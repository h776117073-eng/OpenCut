import { create } from 'zustand';

interface PlayheadState {
  currentTime: number;
  isPlaying: boolean;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  advanceTime: (delta: number, durationSeconds: number) => void;
}

export const usePlayheadStore = create<PlayheadState>((set) => ({
  currentTime: 0,
  isPlaying: false,
  setCurrentTime: (time: number) => set({ currentTime: Math.max(0, time) }),
  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),
  advanceTime: (delta: number, durationSeconds: number) =>
    set((state) => {
      const nextTime = Math.min(state.currentTime + delta, durationSeconds);
      const shouldStop = nextTime >= durationSeconds;
      return {
        currentTime: nextTime,
        isPlaying: shouldStop ? false : state.isPlaying,
      };
    }),
}));
