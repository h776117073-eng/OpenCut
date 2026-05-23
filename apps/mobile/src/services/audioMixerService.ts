import { NativeModules, Platform } from 'react-native';
import type { AudioClip } from '@/store/useTimelineStore';

const getAudioModule = () => {
  if (Platform.OS === 'ios') {
    return NativeModules.OpenCutAudioMixer;
  }

  if (Platform.OS === 'android') {
    return NativeModules.OpenCutAudioMixer;
  }

  throw new Error('Audio mixer not supported on this platform');
};

export const initializeAudioMixer = async (): Promise<boolean> => {
  try {
    const module = getAudioModule();
    return (await module.initializeAudioMixer?.()) ?? false;
  } catch (error) {
    console.warn('Failed to initialize audio mixer:', error);
    return false;
  }
};

export const loadAudioClips = async (audioClips: AudioClip[]): Promise<boolean> => {
  try {
    const module = getAudioModule();
    return (await module.loadAudioClips?.({ clips: audioClips })) ?? false;
  } catch (error) {
    console.warn('Failed to load audio clips into mixer:', error);
    return false;
  }
};

export const playAudioTimeline = async (syncTime = 0): Promise<boolean> => {
  try {
    const module = getAudioModule();
    return (await module.playAudioTimeline?.({ syncTime })) ?? false;
  } catch (error) {
    console.warn('Failed to play audio timeline:', error);
    return false;
  }
};

export const pauseAudioTimeline = async (): Promise<boolean> => {
  try {
    const module = getAudioModule();
    return (await module.pauseAudioTimeline?.()) ?? false;
  } catch (error) {
    console.warn('Failed to pause audio timeline:', error);
    return false;
  }
};

export const seekAudioTimeline = async (time: number): Promise<boolean> => {
  try {
    const module = getAudioModule();
    return (await module.seekAudioTimeline?.({ time })) ?? false;
  } catch (error) {
    console.warn('Failed to seek audio timeline:', error);
    return false;
  }
};

export const stopAudioTimeline = async (): Promise<boolean> => {
  try {
    const module = getAudioModule();
    return (await module.stopAudioTimeline?.()) ?? false;
  } catch (error) {
    console.warn('Failed to stop audio timeline:', error);
    return false;
  }
};

export const setAudioClipVolume = async (id: string, volume: number): Promise<boolean> => {
  try {
    const module = getAudioModule();
    return (await module.setAudioClipVolume?.({ id, volume })) ?? false;
  } catch (error) {
    console.warn('Failed to update audio clip volume:', error);
    return false;
  }
};

export const setAudioClipFadeDurations = async (
  id: string,
  fadeInDuration: number,
  fadeOutDuration: number,
): Promise<boolean> => {
  try {
    const module = getAudioModule();
    return (
      (await module.setAudioClipFadeDurations?.({
        id,
        fadeInDuration,
        fadeOutDuration,
      })) ?? false
    );
  } catch (error) {
    console.warn('Failed to update audio clip fade durations:', error);
    return false;
  }
};

export const extractWaveformPeaks = async (
  uri: string,
  sampleCount = 256,
): Promise<number[]> => {
  try {
    const module = getAudioModule();
    const result = await module.extractWaveformPeaks?.({ uri, sampleCount });
    if (Array.isArray(result)) {
      return result.map((value: number) => Math.max(0, Math.min(1, value)));
    }
  } catch (error) {
    console.warn('Failed to extract waveform peaks from audio file:', error);
  }

  return new Array(sampleCount).fill(0);
};
