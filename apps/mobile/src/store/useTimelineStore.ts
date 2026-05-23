import { create } from 'zustand';

export interface TimelineClip {
  id: string;
  title: string;
  start: string;
  duration: string;
  trackId: string;
  status: 'Ready' | 'Editing' | 'Pending';
  uri?: string;
  width?: number;
  height?: number;
  durationMs?: number;
}

export interface TimelineTrack {
  id: string;
  title: string;
}

interface TimelineState {
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  selectedClipId: string | null;
  selectClip: (id: string) => void;
  moveClip: (id: string, start: string) => void;
  addImportedClip: (clip: TimelineClip) => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
  tracks: [
    { id: 'track-1', title: 'Video' },
    { id: 'track-2', title: 'Audio' },
    { id: 'track-3', title: 'Effects' },
  ],
  clips: [
    { id: 'clip-1', title: 'Intro', start: '00:00', duration: '00:05', trackId: 'track-1', status: 'Ready' },
    { id: 'clip-2', title: 'Transition', start: '00:05', duration: '00:12', trackId: 'track-1', status: 'Editing' },
    { id: 'clip-3', title: 'Voiceover', start: '00:00', duration: '00:20', trackId: 'track-2', status: 'Pending' },
    { id: 'clip-4', title: 'Music', start: '00:08', duration: '00:24', trackId: 'track-2', status: 'Ready' },
    { id: 'clip-5', title: 'Glow', start: '00:15', duration: '00:08', trackId: 'track-3', status: 'Editing' },
  ],
  selectedClipId: null,
  selectClip: (id: string) => set({ selectedClipId: id }),
  moveClip: (id: string, start: string) =>
    set((state) => ({
      clips: state.clips.map((clip) =>
        clip.id === id ? { ...clip, start } : clip,
      ),
    })),
  addImportedClip: (clip: TimelineClip) =>
    set((state) => ({
      clips: [...state.clips, clip],
      selectedClipId: clip.id,
    })),
}));
