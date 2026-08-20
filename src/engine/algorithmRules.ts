/**
 * Config central de regras do motor de seleção — valores que antes ficariam espalhados/implícitos
 * pelo código, agora num único lugar fácil de recalibrar sem tocar em `ChallengeEngine.ts` (ver
 * plano de migração seção 2.2). `maxActionsPerDay` do documento original NÃO entra aqui — a
 * quantidade de ações por dia continua vindo de `DAILY_ACTION_RANGE` (faixa variável 3–10 por
 * intensidade, já implementada e testada), não um teto fixo.
 */
export const ALGORITHM_RULES = {
  // Dias mínimos entre duas ações de textos diferentes mas do mesmo `conceptGroup` (ver
  // ChallengeEngine.filterCandidatesForSlot) — evita repetição semântica mesmo com ids diferentes
  // (ex: "ligar pra alguém" e "mandar mensagem", ambas `strengthen_connection`).
  conceptCooldownDays: 5,
  // Formaliza o que `SAME_CATEGORY_PENALTY` já fazia de forma soft em ChallengeEngine.ts — quantas
  // vezes uma categoria pode se repetir no mesmo dia antes da penalidade de diversidade entrar.
  maxSameCategoryInSequence: 2,
  // Mesma ideia, por interesse já usado no dia (ver interestDiversityPenalty).
  maxSameInterestInSequence: 2,
} as const;
