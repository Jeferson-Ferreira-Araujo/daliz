import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Abstração fina sobre o armazenamento local. Todo o resto do app depende
 * desta interface, não diretamente do AsyncStorage — troca futura por
 * sincronização em nuvem significa implementar esta interface novamente,
 * sem tocar em repositórios/serviços consumidores.
 */
export interface StorageClient {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
}

class AsyncStorageClient implements StorageClient {
  async getItem<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}

export const storageClient: StorageClient = new AsyncStorageClient();
