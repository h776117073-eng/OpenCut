import { MMKV } from 'react-native-mmkv';
import type { PersistStorage } from 'zustand/middleware';

const storage = new MMKV({ id: 'OpenCutMMKV' });

export const mmkvStorage: PersistStorage<unknown> = {
  getItem: (key: string) => {
    const raw = storage.getString(key);
    if (raw === undefined || raw === null) {
      return null;
    }

    try {
      return JSON.parse(raw) as {
        state: unknown;
        version?: number;
      };
    } catch {
      return null;
    }
  },

  setItem: (key: string, value) => {
    storage.set(key, JSON.stringify(value));
    return null;
  },

  removeItem: (key: string) => {
    storage.delete(key);
    return null;
  },
};

export const readJson = <T>(key: string): T | null => {
  const raw = storage.getString(key);
  if (raw === undefined || raw === null) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const writeJson = <T>(key: string, value: T): void => {
  storage.set(key, JSON.stringify(value));
};
