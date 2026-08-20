import type { Challenge, ChallengeCategory } from '@/types';

export interface ScoringContext {
  categoryCompletionRate: Partial<Record<ChallengeCategory, number>>;
  bestRatedChallengeIds: Set<string>;
  recentIgnoreCounts: Map<string, number>;
  daysSinceLastUse: Map<string, number>; // challengeId -> dias desde a última vez que apareceu (ausente = nunca apareceu)
}

const LONG_ABSENCE_DAYS = 30;

/**
 * Pontua um desafio candidato. Quanto maior, mais prioridade ele tem para
 * ser escolhido no slot do dia. Valores aproximados, pensados para o MVP — a
 * ideia é ser uma heurística razoável, não uma fórmula definitiva.
 */
export function scoreChallenge(challenge: Challenge, ctx: ScoringContext): number {
  let score = 50;

  const categoryRate = ctx.categoryCompletionRate[challenge.categoria];
  score += categoryRate != null ? categoryRate * 30 : 10;

  if (ctx.bestRatedChallengeIds.has(challenge.id)) {
    score += 20;
  }

  const ignoreCount = ctx.recentIgnoreCounts.get(challenge.id) ?? 0;
  score -= Math.min(ignoreCount * 15, 45);

  const daysSince = ctx.daysSinceLastUse.get(challenge.id);
  if (daysSince == null || daysSince >= LONG_ABSENCE_DAYS) {
    score += 6; // nunca apareceu, ou faz muito tempo — incentiva rotação pelos 901 desafios
  }

  // Pequena variação para evitar que o mesmo conjunto "vença" sempre em empates.
  score += Math.random() * 6;

  return score;
}
