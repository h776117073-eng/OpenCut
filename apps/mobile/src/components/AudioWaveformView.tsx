import { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { extractWaveformPeaks } from '@/services/audioMixerService';

interface AudioWaveformViewProps {
  audioUri?: string;
  sampleCount?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_SAMPLE_COUNT = 256;
const DEFAULT_HEIGHT = 100;

const createWaveformPath = (
  peaks: number[],
  width: number,
  height: number,
) => {
  const path = Skia.Path.Make();
  if (!path || peaks.length === 0 || width <= 0 || height <= 0) {
    return path;
  }

  const halfHeight = height * 0.5;
  path.moveTo(0, halfHeight);

  const maxPeak = Math.max(...peaks, 1);

  peaks.forEach((peak, index) => {
    const x = width * (index / Math.max(peaks.length - 1, 1));
    const y = halfHeight - (peak / maxPeak) * halfHeight;
    path.lineTo(x, y);
  });

  for (let index = peaks.length - 1; index >= 0; index -= 1) {
    const x = width * (index / Math.max(peaks.length - 1, 1));
    const y = halfHeight + (peaks[index] / maxPeak) * halfHeight;
    path.lineTo(x, y);
  }

  path.close();
  return path;
};

const downsamplePeaks = (peaks: number[], sampleCount: number): number[] => {
  if (peaks.length <= sampleCount) {
    return peaks;
  }

  const chunkSize = peaks.length / sampleCount;
  const result: number[] = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const start = Math.floor(index * chunkSize);
    const end = Math.min(Math.ceil((index + 1) * chunkSize), peaks.length);
    const chunk = peaks.slice(start, end);
    const maxPeak = chunk.length ? Math.max(...chunk) : 0;
    result.push(maxPeak);
  }

  return result;
};

export function AudioWaveformView({
  audioUri,
  sampleCount = DEFAULT_SAMPLE_COUNT,
  height = DEFAULT_HEIGHT,
  style,
}: AudioWaveformViewProps) {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);

  useEffect(() => {
    let active = true;

    const loadPeaks = async () => {
      if (!audioUri) {
        setWaveformPeaks([]);
        return;
      }

      const peaks = await extractWaveformPeaks(audioUri, sampleCount);
      if (!active) {
        return;
      }

      setWaveformPeaks(downsamplePeaks(peaks, sampleCount));
    };

    void loadPeaks();

    return () => {
      active = false;
    };
  }, [audioUri, sampleCount]);

  const waveformPath = useMemo(() => {
    if (!audioUri || layoutWidth <= 0 || waveformPeaks.length === 0) {
      return null;
    }

    return createWaveformPath(waveformPeaks, layoutWidth, height);
  }, [audioUri, layoutWidth, waveformPeaks, height]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setLayoutWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.container, style, { height }]} onLayout={handleLayout}>
      <Canvas style={styles.canvas}>
        {waveformPath ? (
          <>
            <Path path={waveformPath} color="rgba(56, 189, 248, 0.18)" style="fill" />
            <Path path={waveformPath} color="#0ea5e9" style="stroke" strokeWidth={2} />
          </>
        ) : null}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0f172a',
  },
});
