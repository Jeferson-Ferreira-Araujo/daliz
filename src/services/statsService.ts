import { challengeInstanceRepository } from '@/storage/repositories/challengeInstanceRepository';
import { getInstanceActionKind } from '@/data/challenges';
import type { ChallengeCategory, ChallengeInstance, ChallengeReaction, PresenceSummary, ReactionCount, RecentNote } from '@/types';
import { addDays, startOfWeek, endOfWeek, toISODate, yesterdayOf, daysBetween } from '@/utils/date';
import { getCurrentDate } from '@/utils/now';

const REACTION_ORDER: ChallengeReaction[] = ['fez_muito_bem', 'foi_bom', 'foi_normal', 'nao_fez_diferenca', 'foi_dificil'];

const DAILY_ACTIVITY_DAYS = 7;
const CATEGORY_BREAKDOWN_WINDOW_DAYS = 30;
const MAX_RECENT_NOTES = 10;

/** Todas as instâncias, exceto sugestões (ver ChallengeActionKind) — sugestões não entram em
 * nenhuma estatística. */
async function getTrackedInstances(): Promise<ChallengeInstance[]> {
  const all = await challengeInstanceRepository.getAll();
  return all.filter((i) => getInstanceActionKind(i) === 'acao');
}

/**
 * Sem Concluir/Não consegui obrigatório (ver plano de migração "Novo modelo de ações"), a aba
 * Insights mede principalmente PRESENÇA: quantas ações chegaram, com que frequência, em quais
 * categorias, e o que a pessoa escreveu nas anotações. `completedCount`/`reactionBreakdown` são
 * a exceção: desde que o ReactionPicker voltou, marcar uma reação é o sinal voluntário de "feito".
 */
export const statsService = {
  async getPresenceSummary(now: Date = getCurrentDate()): Promise<PresenceSummary> {
    const all = await getTrackedInstances();
    // `deliveredAt` é gravado no momento em que a instância é GERADA (ver buildInstance em
    // ChallengeEngine.ts), não no momento em que ela aparece de fato pra pessoa — o motor cria o
    // dia inteiro de uma vez, mas a tela só revela cada card quando `scheduledFor` chega (ver
    // `visibleInstances` em home.tsx). Sem o filtro por horário aqui, Insights contaria ações
    // futuras que a pessoa ainda nem viu como se já tivessem "chegado".
    const delivered = all.filter((i) => i.deliveredAt != null && new Date(i.deliveredAt).getTime() <= now.getTime());

    const today = toISODate(now);
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const deliveredThisWeek = delivered.filter((i) => i.date >= weekStart && i.date <= weekEnd);
    const datesWithDelivery = new Set(delivered.map((i) => i.date));

    const { currentStreak, bestStreak } = computeStreaks(datesWithDelivery, today);

    return {
      totalDelivered: delivered.length,
      deliveredThisWeek: deliveredThisWeek.length,
      daysActiveThisWeek: new Set(deliveredThisWeek.map((i) => i.date)).size,
      currentStreak,
      bestStreak,
      categoryBreakdown: buildCategoryBreakdown(delivered, today),
      dailyActivity: buildDailyActivity(delivered, today),
      hourlyDistribution: buildHourlyDistribution(delivered),
      recentNotes: buildRecentNotes(all),
      completedCount: delivered.filter((i) => i.completedAt != null).length,
      reactionBreakdown: buildReactionBreakdown(delivered),
    };
  },
};

/** Sequência de dias seguidos (até hoje ou ontem) e maior sequência já alcançada, a partir do
 * conjunto de datas com pelo menos 1 ação entregue — mede presença contínua, não desempenho. */
function computeStreaks(dates: Set<string>, today: string): { currentStreak: number; bestStreak: number } {
  if (dates.size === 0) return { currentStreak: 0, bestStreak: 0 };

  const sorted = [...dates].sort();
  let bestStreak = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    run = daysBetween(sorted[i - 1], sorted[i]) === 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
  }

  let cursor = dates.has(today) ? today : yesterdayOf(today);
  let currentStreak = 0;
  while (dates.has(cursor)) {
    currentStreak += 1;
    cursor = yesterdayOf(cursor);
  }

  return { currentStreak, bestStreak };
}

/** Categorias mais recebidas nos últimos `CATEGORY_BREAKDOWN_WINDOW_DAYS` dias, ordenadas por
 * contagem — janela recente pra refletir o que a pessoa tem recebido agora, não o histórico
 * inteiro desde a instalação. */
function buildCategoryBreakdown(delivered: ChallengeInstance[], today: string) {
  const cutoff = addDays(today, -CATEGORY_BREAKDOWN_WINDOW_DAYS);
  const counts = new Map<ChallengeCategory, number>();
  for (const instance of delivered) {
    if (instance.date < cutoff) continue;
    counts.set(instance.categoria, (counts.get(instance.categoria) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([categoria, count]) => ({ categoria, count }))
    .sort((a, b) => b.count - a.count);
}

/** Últimos `DAILY_ACTIVITY_DAYS` dias (incluindo hoje), sempre com uma entrada por dia — pra o
 * gráfico de atividade nunca ter um buraco no eixo. */
function buildDailyActivity(delivered: ChallengeInstance[], today: string): PresenceSummary['dailyActivity'] {
  const byDate = new Map<string, number>();
  for (const instance of delivered) {
    byDate.set(instance.date, (byDate.get(instance.date) ?? 0) + 1);
  }

  const days: PresenceSummary['dailyActivity'] = [];
  let cursor = today;
  for (let i = 0; i < DAILY_ACTIVITY_DAYS; i += 1) {
    days.unshift({ date: cursor, total: byDate.get(cursor) ?? 0 });
    cursor = yesterdayOf(cursor);
  }
  return days;
}

/** Distribuição por hora do dia (índice 0-23) de quando as ações costumam chegar
 * (`scheduledFor`) — não é sobre quando a pessoa "concluiu" nada, é sobre o próprio ritmo de
 * entrega do motor pra essa pessoa. */
function buildHourlyDistribution(delivered: ChallengeInstance[]): number[] {
  const hours = new Array(24).fill(0);
  for (const instance of delivered) {
    hours[new Date(instance.scheduledFor).getHours()] += 1;
  }
  return hours;
}

/** Contagem por tipo de reação (ver ChallengeCard/ReactionPicker), na ordem fixa de humor
 * (positivo → difícil, nunca por contagem) — omite tipos sem nenhuma ocorrência ainda. */
function buildReactionBreakdown(delivered: ChallengeInstance[]): ReactionCount[] {
  const counts = new Map<ChallengeReaction, number>();
  for (const instance of delivered) {
    if (!instance.reaction) continue;
    counts.set(instance.reaction, (counts.get(instance.reaction) ?? 0) + 1);
  }
  return REACTION_ORDER.filter((reaction) => counts.has(reaction)).map((reaction) => ({
    reaction,
    count: counts.get(reaction)!,
  }));
}

/** Anotações mais recentes primeiro (ver ChallengeCard/NoteField) — o conteúdo mais pessoal que
 * existe no histórico hoje. */
function buildRecentNotes(all: ChallengeInstance[]): RecentNote[] {
  return all
    .filter((i): i is ChallengeInstance & { note: string } => !!i.note && i.note.trim().length > 0)
    .sort((a, b) => a.scheduledFor < b.scheduledFor ? 1 : -1)
    .slice(0, MAX_RECENT_NOTES)
    .map((i) => ({ instanceId: i.id, titulo: i.titulo, note: i.note, date: i.date }));
}
