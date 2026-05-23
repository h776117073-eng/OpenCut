export function parseTimecode(timecode: string): number {
  const [minutes, seconds] = timecode.split(':').map((part) => Number(part));
  return minutes * 60 + seconds;
}

export function formatTimecode(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}
