import type { Challenge, UserActionPerformance } from '@/types';

// Regra conservadora e determinística (seção 8/25/27 do pedido): só considera progressão depois
// de evidência real de consistência — nunca após uma única conclusão. Um único lugar pra esse
// número, reaproveitado tanto pela seleção (ChallengeEngine) quanto pelo registro de desempenho
// (progressionService), pra nunca ficar dessincronizado entre os dois.
export const CONSECUTIVE_COMPLETIONS_FOR_PROGRESSION = 3;

export function isReadyForProgression(perf: UserActionPerformance | undefined): boolean {
  if (!perf) return false;
  return perf.consecutiveCompletions >= CONSECUTIVE_COMPLETIONS_FOR_PROGRESSION;
}

/**
 * true = essa ação (representando o nível ATUAL de um progressionGroup) deve sair do pool de
 * candidatos de hoje, porque a pessoa já demonstrou consistência suficiente nela e existe um
 * próximo nível de verdade no catálogo pra substituí-la. Usado por
 * ChallengeEngine.filterCandidatesForSlot — é o único ponto de contato entre o sistema de
 * dificuldade e a seleção diária (seção 21 do pedido: "não reescrever o motor inteiro", só
 * adicionar esse filtro pontual).
 *
 * Deliberadamente conservador: só suprime quando TODAS as condições batem — ação marcada como
 * `progressive`, pertence a um `progressionGroup`, é exatamente o nível que a pessoa está agora
 * (não teria efeito nenhum suprimir um nível que ela nem está cursando), há evidência de
 * consistência, E o próximo nível existe de verdade no catálogo (nunca inventa um nível nem pula
 * pra um id que não existe mais — ver seção 19: "só escolhe entre ações já cadastradas").
 */
export function isSupersededByProgression(
  challenge: Challenge,
  performanceByConcept: Record<string, UserActionPerformance>,
  catalogById: Record<string, Challenge>,
): boolean {
  if (!challenge.progressive || !challenge.progressionGroup || !challenge.concept) return false;
  const perf = performanceByConcept[challenge.concept];
  if (!perf) return false;
  if (challenge.difficulty !== perf.currentDifficulty) return false;
  if (!isReadyForProgression(perf)) return false;
  const nextId = challenge.progression?.nextActionId;
  if (!nextId) return false; // topo da cadeia — nada pra progredir, mantém a ação normalmente
  return Boolean(catalogById[nextId]);
}
