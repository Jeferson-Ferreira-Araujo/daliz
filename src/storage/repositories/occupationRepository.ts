import { storageClient } from '../storageClient';
import { STORAGE_KEYS } from '../keys';
import type { OccupationEntry } from '@/types';

export interface OccupationsSnapshot {
  fetchedAt: string; // ISO datetime
  entries: OccupationEntry[];
}

export const occupationRepository = {
  async get(): Promise<OccupationsSnapshot | null> {
    return storageClient.getItem<OccupationsSnapshot>(STORAGE_KEYS.occupationsCache);
  },

  async save(snapshot: OccupationsSnapshot): Promise<void> {
    await storageClient.setItem(STORAGE_KEYS.occupationsCache, snapshot);
  },

  async clear(): Promise<void> {
    await storageClient.removeItem(STORAGE_KEYS.occupationsCache);
  },
};
