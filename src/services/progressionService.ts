import { actionPerformanceRepository } from '@/storage/repositories/actionPerformanceRepository';
import { analyticsService } from './analyticsService';
import { isReadyForProgression } from '@/engine/progression';
import { getCurrentDate } from '@/utils/now';
import type { ChallengeInstance, UserActionPerformance } from '@/types';

// DESATIVADO (ver plano de migração seção 4/6): nada mais chama recordCompletion/recordRejection/
// recordReminder desde a remoção de Concluir/Não consegui — o service fica intacto pra reativação
// futura com outro sinal, sem re-arquitetar. `instance.conceptGroup` foi renomeado pra `conceptGroup`
// (ver Challenge/ChallengeInstance), mesmo campo/papel.

function emptyPerformance(concept: string, difficulty: number): UserActionPerformance {
  return {
    concept,
    currentDifficulty: difficulty,
    completedCount: 0,
    consecutiveCompletions: 0,
    rejectedCount: 0,
    reminderCount: 0,
    lastCompletedAt: null,
    confidence: 0,
    comfortLevel: null,
  };
}

function computeConfidence(perf: UserActionPerformance): number {
  const total = perf.completedCount + perf.rejectedCount;
  if (total === 0) return 0;
  return Math.round((perf.completedCount / total) * 100) / 100;
}

export const progressionService = {
  /**
   * Registra a conclusão de uma ação com `concept` no desempenho da pessoa (seção 7/8/13 do
   * pedido). Só a dificuldade que a pessoa realmente concluiu vira `currentDifficulty` — nunca a
   * que foi só oferecida. Concluir o nível seguinte confirma a progressão (currentDifficulty
   * sobe) e reinicia a contagem de consistência (precisa de evidência nova antes de progredir de
   * novo, seção 12: "não pular vários níveis").
   */
  async recordCompletion(instance: ChallengeInstance, now: Date = getCurrentDate()): Promise<void> {
    if (!instance.conceptGroup || instance.difficulty == null) return;
    const existing = await actionPerformanceRepository.getByConcept(instance.conceptGroup);
    const perf = existing ?? emptyPerformance(instance.conceptGroup, instance.difficulty);

    if (instance.difficulty > perf.currentDifficulty) {
      const previousDifficulty = perf.currentDifficulty;
      perf.currentDifficulty = instance.difficulty;
      perf.consecutiveCompletions = 1; // nível novo, evidência recomeça (seção 12/18)
      analyticsService.log('action_difficulty_increased', {
        concept: instance.conceptGroup,
        progressionGroup: instance.progressionGroup,
        previousDifficulty,
        newDifficulty: instance.difficulty,
        completedCount: perf.completedCount + 1,
      });
    } else if (instance.difficulty === perf.currentDifficulty) {
      perf.consecutiveCompletions += 1;
    }
    // difficulty < currentDifficulty (raro/legado): conta como conclusão sem mexer no streak.

    perf.completedCount += 1;
    perf.lastCompletedAt = now.toISOString();
    perf.confidence = computeConfidence(perf);
    await actionPerformanceRepository.save(perf);

    if (isReadyForProgression(perf)) {
      analyticsService.log('action_progression_detected', {
        concept: instance.conceptGroup,
        progressionGroup: instance.progressionGroup,
        currentDifficulty: perf.currentDifficulty,
        completedCount: perf.completedCount,
      });
    }
  },

  /**
   * Registra rejeição/abandono (seção 9/10 do pedido). Só "foi_dificil" zera a sequência de
   * consistência — é o único motivo que é, de fato, um sinal sobre a DIFICULDADE da ação; os
   * demais (sem tempo, esqueci, momento inadequado, não gostei, não fez sentido) só contam como
   * rejeição pro histórico, sem interpretar que o nível está inadequado.
   */
  async recordRejection(instance: ChallengeInstance, reason: string): Promise<void> {
    if (!instance.conceptGroup || instance.difficulty == null) return;
    const existing = await actionPerformanceRepository.getByConcept(instance.conceptGroup);
    const perf = existing ?? emptyPerformance(instance.conceptGroup, instance.difficulty);

    perf.rejectedCount += 1;
    if (reason === 'foi_dificil') perf.consecutiveCompletions = 0;
    perf.confidence = computeConfidence(perf);
    await actionPerformanceRepository.save(perf);
  },

  /**
   * Registra um "Lembrar mais tarde" (seção 11 do pedido): só soma ao contador, nunca afeta
   * consistência/dificuldade — adiar não é sinal de que a ação era difícil, só que o momento não
   * era bom (ver reminderService.ts, que já não mexe em `timing` pelo mesmo motivo).
   */
  async recordReminder(instance: ChallengeInstance): Promise<void> {
    if (!instance.conceptGroup || instance.difficulty == null) return;
    const existing = await actionPerformanceRepository.getByConcept(instance.conceptGroup);
    const perf = existing ?? emptyPerformance(instance.conceptGroup, instance.difficulty);
    perf.reminderCount += 1;
    await actionPerformanceRepository.save(perf);
  },

  /** Mapa concept → desempenho, no formato que ChallengeEngine.selectDailyChallenges consome
   * (ver dayCycleService.ensureUpcomingActions). */
  async getPerformanceByConcept(): Promise<Record<string, UserActionPerformance>> {
    return actionPerformanceRepository.getAll();
  },
};
