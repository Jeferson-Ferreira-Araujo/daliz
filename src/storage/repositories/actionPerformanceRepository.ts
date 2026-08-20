import { storageClient } from '../storageClient';
import { STORAGE_KEYS } from '../keys';
import type { UserActionPerformance } from '@/types';

type PerformanceMap = Record<string, UserActionPerformance>; // chave: concept

async function getAllMap(): Promise<PerformanceMap> {
  return (await storageClient.getItem<PerformanceMap>(STORAGE_KEYS.actionPerformance)) ?? {};
}

export const actionPerformanceRepository = {
  /** Mapa concept → desempenho — formato que ChallengeEngine consome diretamente (ver
   * SelectDailyChallengesOptions.performanceByConcept), sem precisar converter. */
  async getAll(): Promise<PerformanceMap> {
    return getAllMap();
  },

  async getByConcept(concept: string): Promise<UserActionPerformance | null> {
    const map = await getAllMap();
    return map[concept] ?? null;
  },

  async save(performance: UserActionPerformance): Promise<void> {
    const map = await getAllMap();
    map[performance.concept] = performance;
    await storageClient.setItem(STORAGE_KEYS.actionPerformance, map);
  },

  async clear(): Promise<void> {
    await storageClient.removeItem(STORAGE_KEYS.actionPerformance);
  },
};
