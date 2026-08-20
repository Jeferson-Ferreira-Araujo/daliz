import { challengeInstanceRepository } from '@/storage/repositories/challengeInstanceRepository';
import { getInstanceActionKind } from '@/data/challenges';
import type { AggregatedStats, ChallengeCategory, ChallengeInstance, WeeklyHighlight, WeeklyInsight } from '@/types';
import { toISODate, yesterdayOf } from '@/utils/date';
import { getCurrentDate } from '@/utils/now';

const DAILY_ACTIVITY_DAYS = 7;

/** Todas as instâncias, exceto sugestões (ver ChallengeActionKind) — sugestões não entram em
 * nenhuma estatística. */
async function getTrackedInstances(): Promise<ChallengeInstance[]> {
  const all = await challengeInstanceRepository.getAll();
  return all.filter((i) => getInstanceActionKind(i) === 'acao');
}

/**
 * Sem Concluir/Não consegui (ver plano de migração seção 4), não existe mais sinal de conclusão
 * pra calcular taxa/streak/melhores avaliadas/mais ignoradas — essas métricas ficam neutras
 * (0/vazio) até o produto decidir um novo sinal de qualidade. `app/(main)/(tabs)/insights.tsx`
 * já trata `totalCompleted === 0` como "sem dados ainda" (empty-state existente), então esse
 * resultado neutro é coerente sem precisar redesenhar a tela — ela fica FORA de escopo desta
 * migração (decisão explícita do usuário).
 */
export const statsService = {
  async getAggregatedStats(): Promise<AggregatedStats> {
    const all = await getTrackedInstances();
    const totalReceived = all.filter((i) => i.deliveredAt != null).length;
    const dailyActivity = buildDailyActivity(all);

    return {
      totalReceived,
      totalCompleted: 0,
      completionRate: 0,
      averageTimeToCompleteMs: null,
      bestCategories: [],
      worstCategories: [],
      bestRatedChallengeIds: [],
      mostIgnoredChallengeIds: [],
      bestCompletionHours: [],
      dailyActivity,
      currentStreak: 0,
      bestStreak: 0,
      categoryBreakdown: [],
      hourlyDistribution: new Array(24).fill(0),
    };
  },

  /** Sem sinal de conclusão — sempre `null` (ver comentário acima). */
  async completionRateForCategory(_categoria: ChallengeCategory): Promise<number | null> {
    return null;
  },

  /** Sem sinal de conclusão — sempre 0. */
  async recentIgnoreCount(_challengeId: string, _lastN: number = 5): Promise<number> {
    return 0;
  },

  /**
   * "O que você melhorou?" — sem conclusão, não há mais o que resumir. Sempre "semana vazia" até
   * o produto decidir um novo sinal (ver comentário acima).
   */
  async getWeeklyInsight(now: Date = getCurrentDate()): Promise<WeeklyInsight> {
    const today = toISODate(now);
    return {
      currentWeek: {
        weekStart: today,
        weekEnd: today,
        totalCompleted: 0,
        highlights: [] as WeeklyHighlight[],
        topHighlight: null,
      },
    };
  },
};

/** Últimos `DAILY_ACTIVITY_DAYS` dias (incluindo hoje), sempre com uma entrada por dia — pra o
 * gráfico de atividade nunca ter um buraco no eixo. `completed` sempre 0 (sem sinal de conclusão,
 * ver comentário acima); `total` conta o que foi entregue (`deliveredAt`) naquele dia. */
function buildDailyActivity(all: ChallengeInstance[]): AggregatedStats['dailyActivity'] {
  const today = toISODate(getCurrentDate());
  const byDate = new Map<string, number>();
  for (const instance of all) {
    if (instance.deliveredAt == null) continue;
    byDate.set(instance.date, (byDate.get(instance.date) ?? 0) + 1);
  }

  const days: AggregatedStats['dailyActivity'] = [];
  let cursor = today;
  for (let i = 0; i < DAILY_ACTIVITY_DAYS; i += 1) {
    days.unshift({ date: cursor, completed: 0, total: byDate.get(cursor) ?? 0 });
    cursor = yesterdayOf(cursor);
  }
  return days;
}
