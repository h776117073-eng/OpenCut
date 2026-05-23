import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayheadStore } from '@/store/usePlayheadStore';
import { formatTimecode } from '@/utils/time';

interface TimelineControlsProps {
  durationSeconds: number;
}

export function TimelineControls({ durationSeconds }: TimelineControlsProps) {
  const currentTime = usePlayheadStore((state) => state.currentTime);
  const isPlaying = usePlayheadStore((state) => state.isPlaying);
  const setCurrentTime = usePlayheadStore((state) => state.setCurrentTime);
  const setIsPlaying = usePlayheadStore((state) => state.setIsPlaying);
  const advanceTime = usePlayheadStore((state) => state.advanceTime);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      advanceTime(1, durationSeconds);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [advanceTime, durationSeconds, isPlaying]);

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Text style={styles.statusText}>{formatTimecode(currentTime)}</Text>
        <Text style={styles.statusText}>{formatTimecode(durationSeconds)}</Text>
      </View>
      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.button, isPlaying && styles.buttonActive]}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          <Text style={styles.buttonText}>{isPlaying ? 'Pause' : 'Play'}</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.resetButton]}
          onPress={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        >
          <Text style={styles.buttonText}>Reset</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    marginRight: 10,
  },
  resetButton: {
    backgroundColor: '#3f3f46',
    marginRight: 0,
  },
  buttonActive: {
    backgroundColor: '#2563eb',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
