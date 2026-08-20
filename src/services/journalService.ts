import { journalRepository } from '@/storage/repositories/journalRepository';
import { getCurrentDate } from '@/utils/now';
import type { DayJournalEntry } from '@/types';

export const journalService = {
  async getForDate(date: string): Promise<DayJournalEntry | null> {
    return journalRepository.getByDate(date);
  },

  async saveForDate(date: string, text: string): Promise<DayJournalEntry> {
    const entry: DayJournalEntry = { date, text: text.trim(), updatedAt: getCurrentDate().toISOString() };
    await journalRepository.save(entry);
    return entry;
  },
};
