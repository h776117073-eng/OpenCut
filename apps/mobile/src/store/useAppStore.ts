import { create } from 'zustand';

interface AppState {
  timelineLoaded: boolean;
  setTimelineLoaded: (loaded: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  timelineLoaded: false,
  setTimelineLoaded: (loaded) => set({ timelineLoaded: loaded }),
}));
