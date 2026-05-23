import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mmkvStorage } from '@/services/storageService';

interface AppState {
  timelineLoaded: boolean;
  setTimelineLoaded: (loaded: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      timelineLoaded: false,
      setTimelineLoaded: (loaded) => set({ timelineLoaded: loaded }),
    }),
    {
      name: 'app-store',
      storage: mmkvStorage,
    },
  ),
);
