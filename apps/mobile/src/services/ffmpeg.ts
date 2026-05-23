import { composeTimeline, initVideoProcessor, exportVideo } from '@/services/mediaProcessor';
import type { TimelineClip } from '@/store/useTimelineStore';
import type { ProcessingResult } from '@/services/mediaProcessor';

export interface FFmpegExportOptions {
  outputPath: string;
  quality?: 'high' | 'medium' | 'low';
}

export const initFFmpeg = initVideoProcessor;

export const cropAndExportVideo = async (
  inputPath: string,
  clips: TimelineClip[],
  options: FFmpegExportOptions,
): Promise<ProcessingResult> => {
  return composeTimeline(clips, options.outputPath, {
    quality: options.quality ?? 'medium',
  });
};

export const nativeExportVideo = async (
  inputPath: string,
  outputPath: string,
  quality: 'high' | 'medium' | 'low' = 'medium',
): Promise<ProcessingResult> => {
  return exportVideo(inputPath, outputPath, { quality, codec: 'h264' });
};
