import { storageClient } from '../storageClient';
import { STORAGE_KEYS } from '../keys';
import type { ChallengeInstance } from '@/types';

type ChallengeInstanceMap = Record<string, ChallengeInstance>;

async function getAllMap(): Promise<ChallengeInstanceMap> {
  return (await storageClient.getItem<ChallengeInstanceMap>(STORAGE_KEYS.challengeInstances)) ?? {};
}

export const challengeInstanceRepository = {
  async getAll(): Promise<ChallengeInstance[]> {
    const map = await getAllMap();
    return Object.values(map).sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  },

  async getById(id: string): Promise<ChallengeInstance | null> {
    const map = await getAllMap();
    return map[id] ?? null;
  },

  async getByDate(date: string): Promise<ChallengeInstance[]> {
    const all = await this.getAll();
    return all.filter((instance) => instance.date === date);
  },

  async save(instance: ChallengeInstance): Promise<void> {
    const map = await getAllMap();
    map[instance.id] = instance;
    await storageClient.setItem(STORAGE_KEYS.challengeInstances, map);
  },

  async saveMany(instances: ChallengeInstance[]): Promise<void> {
    const map = await getAllMap();
    for (const instance of instances) {
      map[instance.id] = instance;
    }
    await storageClient.setItem(STORAGE_KEYS.challengeInstances, map);
  },

  async clear(): Promise<void> {
    await storageClient.removeItem(STORAGE_KEYS.challengeInstances);
  },
};
