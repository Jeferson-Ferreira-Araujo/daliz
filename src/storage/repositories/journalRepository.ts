import { storageClient } from '../storageClient';
import { STORAGE_KEYS } from '../keys';
import type { DayJournalEntry } from '@/types';

type JournalMap = Record<string, DayJournalEntry>;

async function getAllMap(): Promise<JournalMap> {
  return (await storageClient.getItem<JournalMap>(STORAGE_KEYS.journal)) ?? {};
}

export const journalRepository = {
  async getByDate(date: string): Promise<DayJournalEntry | null> {
    const map = await getAllMap();
    return map[date] ?? null;
  },

  async save(entry: DayJournalEntry): Promise<void> {
    const map = await getAllMap();
    map[entry.date] = entry;
    await storageClient.setItem(STORAGE_KEYS.journal, map);
  },

  async clear(): Promise<void> {
    await storageClient.removeItem(STORAGE_KEYS.journal);
  },
};
