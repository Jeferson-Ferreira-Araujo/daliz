import { storageClient } from '../storageClient';
import { STORAGE_KEYS } from '../keys';
import { DEFAULT_PREFERENCES, type AppPreferences } from '@/types';

export const preferencesRepository = {
  async get(): Promise<AppPreferences> {
    const stored = await storageClient.getItem<AppPreferences>(STORAGE_KEYS.preferences);
    // Faz merge com os defaults em vez de usar o `stored` puro — assim, campos novos
    // adicionados depois (ex: hasSeenInsightsIntro) não ficam `undefined` em preferências
    // salvas por uma versão anterior do app.
    return { ...DEFAULT_PREFERENCES, ...stored };
  },

  async save(preferences: AppPreferences): Promise<void> {
    await storageClient.setItem(STORAGE_KEYS.preferences, preferences);
  },

  async clear(): Promise<void> {
    await storageClient.removeItem(STORAGE_KEYS.preferences);
  },
};
