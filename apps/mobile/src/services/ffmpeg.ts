import type { TimelineClip } from '@/store/useTimelineStore';
import { formatTimecode, parseTimecode } from '@/utils/time';

export interface FFmpegExportOptions {
  outputPath: string;
  quality?: 'high' | 'medium' | 'low';
}

export const initFFmpeg = async () => {
  // TODO: Initialize FFmpeg.wasm or native FFmpeg bridge for React Native
};

export const cropAndExportVideo = async (
  inputPath: string,
  clips: TimelineClip[],
  options: FFmpegExportOptions,
) => {
  // Build FFmpeg concat script from clip timings
  const clipSequence = clips
    .sort((a, b) => parseTimecode(a.start) - parseTimecode(b.start))
    .map((clip) => {
      const start = formatTimecode(parseTimecode(clip.start));
      const duration = clip.duration;
      return `[0:v]trim=${start}:${duration}[v${clip.id}]`;
    })
    .join(';');

  // TODO: Execute FFmpeg command with native bridge
  // const command = `ffmpeg -i ${inputPath} ${clipSequence} -c:v libx264 -crf ${getCRF(options.quality)} ${options.outputPath}`;

  return {
    success: true,
    message: 'Video export queued',
    outputPath: options.outputPath,
  };
};

function getCRF(quality?: string) {
  switch (quality) {
    case 'high':
      return 18;
    case 'low':
      return 28;
    default:
      return 23;
  }
}
