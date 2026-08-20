import { challengeInstanceRepository } from '@/storage/repositories/challengeInstanceRepository';
import { getInstanceActionKind } from '@/data/challenges';
import type { AggregatedStats, ChallengeCategory, ChallengeInstance, WeeklyHighlight, WeeklyInsight } from '@/types';
import { CHALLENGE_CATEGORY_LABELS, POSITIVE_REACTIONS } from '@/types';
import { daysBetween, endOfWeek, startOfWeek, toISODate, yesterdayOf } from '@/utils/date';
import { getCurrentDate } from '@/utils/now';

const DAILY_ACTIVITY_DAYS = 7;

/** Todas as instâncias, exceto sugestões (ver ChallengeActionKind) — sugestões nunca têm
 * conclusão/rejeição de verdade, então nunca devem contar em taxa de conclusão, streak, gráficos
 * por categoria ou "mais ignorado". Ponto único usado pelas 4 funções públicas abaixo, no lugar
 * de cada uma chamar `challengeInstanceRepository.getAll()` direto. */
async function getTrackedInstances(): Promise<ChallengeInstance[]> {
  const all = await challengeInstanceRepository.getAll();
  return all.filter((i) => getInstanceActionKind(i) === 'acao');
}

function isResolved(instance: ChallengeInstance): boolean {
  return instance.status !== 'pendente';
}

/** Já foi revelada pra pessoa (resolvida, ou pendente com horário já chegado) — nunca uma
 * próxima ação que ainda nem foi notificada. Usado só em `totalReceived`, a única métrica
 * que soma instâncias sem filtrar por status (ver seção "não revelar ação futura"). */
function isVisible(instance: ChallengeInstance, now: Date): boolean {
  return instance.status !== 'pendente' || new Date(instance.scheduledFor).getTime() <= now.getTime();
}

function completionRateFor(instances: ChallengeInstance[]): number {
  const resolved = instances.filter(isResolved);
  if (resolved.length === 0) return 0;
  const completed = resolved.filter((i) => i.status === 'concluido').length;
  return completed / resolved.length;
}

export const statsService = {
  async getAggregatedStats(): Promise<AggregatedStats> {
    const now = getCurrentDate();
    const all = await getTrackedInstances();
    const resolved = all.filter(isResolved);
    const completed = all.filter((i) => i.status === 'concluido');

    const totalReceived = all.filter((i) => isVisible(i, now)).length;
    const totalCompleted = completed.length;
    const completionRate = resolved.length > 0 ? totalCompleted / resolved.length : 0;

    const completionTimes = completed
      .map((i) => i.timeToCompleteMs)
      .filter((ms): ms is number => ms != null);
    const averageTimeToCompleteMs =
      completionTimes.length > 0
        ? completionTimes.reduce((sum, ms) => sum + ms, 0) / completionTimes.length
        : null;

    const categories = Object.keys(CHALLENGE_CATEGORY_LABELS) as ChallengeCategory[];
    const categoryRates = categories
      .map((categoria) => ({
        categoria,
        completionRate: completionRateFor(all.filter((i) => i.categoria === categoria)),
        sampleSize: all.filter((i) => i.categoria === categoria && isResolved(i)).length,
      }))
      .filter((entry) => entry.sampleSize > 0);

    const bestCategories = [...categoryRates]
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 3)
      .map(({ categoria, completionRate }) => ({ categoria, completionRate }));

    const worstCategories = [...categoryRates]
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, 3)
      .map(({ categoria, completionRate }) => ({ categoria, completionRate }));

    const bestRatedChallengeIds = rankChallengesByPositiveReaction(completed);
    const mostIgnoredChallengeIds = rankMostIgnoredChallenges(all);
    const bestCompletionHours = rankBestCompletionHours(completed);

    const dailyActivity = buildDailyActivity(all);
    const { currentStreak, bestStreak } = computeStreaks(completed);
    const categoryBreakdown = categoryRates
      .map(({ categoria, completionRate: rate }) => ({
        categoria,
        completionRate: rate,
        totalCompleted: all.filter((i) => i.categoria === categoria && i.status === 'concluido').length,
        totalResolved: all.filter((i) => i.categoria === categoria && isResolved(i)).length,
      }))
      .sort((a, b) => b.completionRate - a.completionRate);
    const hourlyDistribution = buildHourlyDistribution(completed);

    return {
      totalReceived,
      totalCompleted,
      completionRate,
      averageTimeToCompleteMs,
      bestCategories,
      worstCategories,
      bestRatedChallengeIds,
      mostIgnoredChallengeIds,
      bestCompletionHours,
      dailyActivity,
      currentStreak,
      bestStreak,
      categoryBreakdown,
      hourlyDistribution,
    };
  },

  /** Taxa de conclusão histórica (0..1) para uma categoria específica. `null` se não há dados suficientes. */
  async completionRateForCategory(categoria: ChallengeCategory): Promise<number | null> {
    const all = await getTrackedInstances();
    const relevant = all.filter((i) => i.categoria === categoria && isResolved(i));
    if (relevant.length < 2) return null;
    return completionRateFor(relevant);
  },

  /** Quantas vezes, dentre as últimas N aparições, um desafio específico foi ignorado/não concluído. */
  async recentIgnoreCount(challengeId: string, lastN: number = 5): Promise<number> {
    const all = await getTrackedInstances();
    const relevant = all
      .filter((i) => i.challengeId === challengeId && isResolved(i))
      .slice(-lastN);
    return relevant.filter((i) => i.status === 'ignorado' || i.status === 'nao_concluido').length;
  },

  /**
   * "O que você melhorou?" — resumo semanal (segunda a domingo, respeitando a data local do
   * dispositivo via getCurrentDate/toISODate, mesma fonte de data usada no resto do app). Só
   * `status === 'concluido'` conta (ver seção 16 do pedido — pendente/rejeitada/expirada/ignorada
   * ficam de fora); como um lembrete só adiciona um campo `reminder` na MESMA instância em vez de
   * criar uma nova (ver reminderService.ts), uma ação lembrada várias vezes já é contada uma
   * única vez aqui, sem nenhuma deduplicação extra necessária (seção 17).
   * Se a semana ainda não terminou, considera só até hoje — nunca inventa dias futuros (seção 2).
   */
  async getWeeklyInsight(now: Date = getCurrentDate()): Promise<WeeklyInsight> {
    const all = await getTrackedInstances();
    const today = toISODate(now);
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const effectiveEnd = today < weekEnd ? today : weekEnd;

    const completedThisWeek = all.filter(
      (i) => i.status === 'concluido' && i.date >= weekStart && i.date <= effectiveEnd,
    );

    const countByCategory = new Map<ChallengeCategory, number>();
    const lastCompletedAtByCategory = new Map<ChallengeCategory, number>();
    for (const instance of completedThisWeek) {
      countByCategory.set(instance.categoria, (countByCategory.get(instance.categoria) ?? 0) + 1);
      const completedAtMs = instance.completedAt ? new Date(instance.completedAt).getTime() : 0;
      const previousMax = lastCompletedAtByCategory.get(instance.categoria) ?? 0;
      if (completedAtMs > previousMax) lastCompletedAtByCategory.set(instance.categoria, completedAtMs);
    }

    // Desempate determinístico (seção 9): mais ações primeiro; empatadas, a categoria com a
    // conclusão mais recente vence. Nunca aleatório.
    const ranked: WeeklyHighlight[] = [...countByCategory.entries()]
      .map(([categoria, count]) => ({ categoria, count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return (lastCompletedAtByCategory.get(b.categoria) ?? 0) - (lastCompletedAtByCategory.get(a.categoria) ?? 0);
      });

    return {
      currentWeek: {
        weekStart,
        weekEnd,
        totalCompleted: completedThisWeek.length,
        // Categorias com só 1 ação não entram no destaque principal (seção 7) — a "mudança que
        // mais se destacou" abaixo não tem esse filtro, pode ser até uma única ação.
        highlights: ranked.filter((entry) => entry.count > 1).slice(0, 3),
        topHighlight: ranked[0] ?? null,
      },
    };
  },
};

function rankChallengesByPositiveReaction(completed: ChallengeInstance[]): { challengeId: string; titulo: string }[] {
  const counts = new Map<string, number>();
  const tituloById = new Map<string, string>();
  for (const instance of completed) {
    if (instance.reaction && POSITIVE_REACTIONS.includes(instance.reaction)) {
      counts.set(instance.challengeId, (counts.get(instance.challengeId) ?? 0) + 1);
      tituloById.set(instance.challengeId, instance.titulo);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([challengeId]) => ({ challengeId, titulo: tituloById.get(challengeId) ?? challengeId }));
}

function rankMostIgnoredChallenges(all: ChallengeInstance[]): { challengeId: string; titulo: string }[] {
  const counts = new Map<string, number>();
  const tituloById = new Map<string, string>();
  for (const instance of all) {
    if (instance.status === 'ignorado' || instance.status === 'nao_concluido') {
      counts.set(instance.challengeId, (counts.get(instance.challengeId) ?? 0) + 1);
      tituloById.set(instance.challengeId, instance.titulo);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([challengeId]) => ({ challengeId, titulo: tituloById.get(challengeId) ?? challengeId }));
}

function rankBestCompletionHours(completed: ChallengeInstance[]): number[] {
  const counts = new Map<number, number>();
  for (const instance of completed) {
    if (!instance.completedAt) continue;
    const hour = new Date(instance.completedAt).getHours();
    counts.set(hour, (counts.get(hour) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([hour]) => hour);
}

/** Últimos `DAILY_ACTIVITY_DAYS` dias (incluindo hoje), sempre com uma entrada por dia
 * mesmo sem nenhum desafio — pra o gráfico de atividade nunca ter um buraco no eixo. */
function buildDailyActivity(all: ChallengeInstance[]): AggregatedStats['dailyActivity'] {
  const today = toISODate(getCurrentDate());
  const byDate = new Map<string, { completed: number; total: number }>();
  for (const instance of all) {
    if (!isResolved(instance)) continue;
    const entry = byDate.get(instance.date) ?? { completed: 0, total: 0 };
    entry.total += 1;
    if (instance.status === 'concluido') entry.completed += 1;
    byDate.set(instance.date, entry);
  }

  const days: AggregatedStats['dailyActivity'] = [];
  let cursor = today;
  for (let i = 0; i < DAILY_ACTIVITY_DAYS; i += 1) {
    const entry = byDate.get(cursor) ?? { completed: 0, total: 0 };
    days.unshift({ date: cursor, ...entry });
    cursor = yesterdayOf(cursor);
  }
  return days;
}

/** Sequência de dias seguidos com pelo menos 1 desafio concluído. `currentStreak` conta a
 * partir de hoje (ou de ontem, se hoje ainda não teve nenhuma conclusão — um dia em
 * andamento não deve "zerar" uma sequência que ainda está viva). */
function computeStreaks(completed: ChallengeInstance[]): { currentStreak: number; bestStreak: number } {
  const completedDates = new Set(completed.map((i) => i.date));
  const today = toISODate(getCurrentDate());

  let currentStreak = 0;
  let cursor = completedDates.has(today) ? today : yesterdayOf(today);
  while (completedDates.has(cursor)) {
    currentStreak += 1;
    cursor = yesterdayOf(cursor);
  }

  const sortedDates = [...completedDates].sort();
  let bestStreak = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of sortedDates) {
    run = previous && daysBetween(previous, date) === 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    previous = date;
  }

  return { currentStreak, bestStreak };
}

function buildHourlyDistribution(completed: ChallengeInstance[]): number[] {
  const hours = new Array(24).fill(0);
  for (const instance of completed) {
    if (!instance.completedAt) continue;
    const hour = new Date(instance.completedAt).getHours();
    hours[hour] += 1;
  }
  return hours;
}
