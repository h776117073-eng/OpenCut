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

export interface AudioClip {
  id: string;
  uri: string;
  title: string;
  startTime: number;
  duration: number;
  volume: number;
  fadeInDuration: number;
  fadeOutDuration: number;
}

export interface TimelineTrack {
  id: string;
  title: string;
}

export interface TextClip {
  id: string;
  text: string;
  start: string;
  end: string;
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
}

interface TimelineState {
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  textClips: TextClip[];
  audioClips: AudioClip[];
  selectedClipId: string | null;
  isExporting: boolean;
  exportProgress: number;
  cancelExportRequested: boolean;
  selectClip: (id: string) => void;
  moveClip: (id: string, start: string) => void;
  addImportedClip: (clip: TimelineClip) => void;
  addAudioClip: (clip: AudioClip) => void;
  updateAudioClipVolume: (id: string, volume: number) => void;
  updateAudioClipFadeDurations: (
    id: string,
    fadeInDuration: number,
    fadeOutDuration: number,
  ) => void;
  splitAudioClip: (id: string, splitTime: number) => void;
  syncAudioClipsWithVideoEdit: (cutStart: number, cutEnd: number) => void;
  addTextClip: (clip: TextClip) => void;
  removeTextClip: (id: string) => void;
  updateTextClipPosition: (id: string, x: number, y: number) => void;
  requestCancelExport: () => void;
  clearCancelExportRequest: () => void;
  setIsExporting: (value: boolean) => void;
  setExportProgress: (value: number) => void;
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
  audioClips: [],
  selectedClipId: null,
  isExporting: false,
  exportProgress: 0,
  cancelExportRequested: false,
  textClips: [],
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
  addAudioClip: (clip: AudioClip) =>
    set((state) => ({
      audioClips: [...state.audioClips, clip],
    })),
  updateAudioClipVolume: (id: string, volume: number) =>
    set((state) => ({
      audioClips: state.audioClips.map((clip) =>
        clip.id === id
          ? { ...clip, volume: Math.max(0, Math.min(1, volume)) }
          : clip,
      ),
    })),
  updateAudioClipFadeDurations: (
    id: string,
    fadeInDuration: number,
    fadeOutDuration: number,
  ) =>
    set((state) => ({
      audioClips: state.audioClips.map((clip) =>
        clip.id === id
          ? {
              ...clip,
              fadeInDuration: Math.max(0, fadeInDuration),
              fadeOutDuration: Math.max(0, fadeOutDuration),
            }
          : clip,
      ),
    })),
  splitAudioClip: (id: string, splitTime: number) =>
    set((state) => {
      const clip = state.audioClips.find((item) => item.id === id);
      if (!clip) {
        return { audioClips: state.audioClips };
      }

      const clipStart = clip.startTime;
      const clipEnd = clip.startTime + clip.duration;
      if (splitTime <= clipStart || splitTime >= clipEnd) {
        return { audioClips: state.audioClips };
      }

      const firstPart = {
        ...clip,
        id: `${clip.id}-a`,
        duration: splitTime - clipStart,
      };
      const secondPart = {
        ...clip,
        id: `${clip.id}-b`,
        startTime: splitTime,
        duration: clipEnd - splitTime,
      };

      return {
        audioClips: state.audioClips.flatMap((item) =>
          item.id === id ? [firstPart, secondPart] : item,
        ),
      };
    }),
  syncAudioClipsWithVideoEdit: (cutStart: number, cutEnd: number) =>
    set((state) => {
      const removedDuration = Math.max(0, cutEnd - cutStart);

      return {
        audioClips: state.audioClips.flatMap((clip) => {
          const clipStart = clip.startTime;
          const clipEnd = clip.startTime + clip.duration;

          if (clipEnd <= cutStart) {
            return clip;
          }

          if (clipStart >= cutEnd) {
            return [{ ...clip, startTime: clip.startTime - removedDuration }];
          }

          const overlapStart = Math.max(clipStart, cutStart);
          const overlapEnd = Math.min(clipEnd, cutEnd);
          const trimmedDuration = clip.duration - (overlapEnd - overlapStart);

          if (trimmedDuration <= 0) {
            return [];
          }

          return [
            {
              ...clip,
              duration: trimmedDuration,
            },
          ];
        }),
      };
    }),
  addTextClip: (clip: TextClip) =>
    set((state) => ({
      textClips: [...state.textClips, clip],
    })),
  removeTextClip: (id: string) =>
    set((state) => ({
      textClips: state.textClips.filter((clip) => clip.id !== id),
    })),
  updateTextClipPosition: (id: string, x: number, y: number) =>
    set((state) => ({
      textClips: state.textClips.map((clip) =>
        clip.id === id ? { ...clip, x, y } : clip,
      ),
    })),
  requestCancelExport: () => set({ cancelExportRequested: true }),
  clearCancelExportRequest: () => set({ cancelExportRequested: false }),
  setIsExporting: (value: boolean) => set({ isExporting: value }),
  setExportProgress: (value: number) =>
    set({ exportProgress: Math.max(0, Math.min(100, value)) }),
}));
