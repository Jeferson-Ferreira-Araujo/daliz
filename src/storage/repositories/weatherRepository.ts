import { storageClient } from '../storageClient';
import { STORAGE_KEYS } from '../keys';
import type { WeatherSnapshot } from '@/types/weather';

export const weatherRepository = {
  async get(): Promise<WeatherSnapshot | null> {
    return storageClient.getItem<WeatherSnapshot>(STORAGE_KEYS.weatherCache);
  },

  async save(snapshot: WeatherSnapshot): Promise<void> {
    await storageClient.setItem(STORAGE_KEYS.weatherCache, snapshot);
  },

  async clear(): Promise<void> {
    await storageClient.removeItem(STORAGE_KEYS.weatherCache);
  },
};
