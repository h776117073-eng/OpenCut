import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { formatTimecode } from '@/utils/time';
import { usePlayheadStore } from '@/store/usePlayheadStore';

interface TimelineRulerProps {
  durationSeconds: number;
  unitPx: number;
}

export function TimelineRuler({ durationSeconds, unitPx }: TimelineRulerProps) {
  const currentTime = usePlayheadStore((state) => state.currentTime);
  const setCurrentTime = usePlayheadStore((state) => state.setCurrentTime);
  const ticks = Array.from(
    { length: Math.floor(durationSeconds / 5) + 1 },
    (_, index) => index * 5,
  );
  const headPosition = Math.min(currentTime, durationSeconds) * unitPx;

  const handleSeek = (event: GestureResponderEvent) => {
    const { locationX } = event.nativeEvent;
    const nextTime = Math.round(locationX / unitPx);
    setCurrentTime(Math.min(nextTime, durationSeconds));
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handleSeek} style={styles.pressableRuler}>
        <View style={[styles.ruler, { width: durationSeconds * unitPx }]}> 
          {ticks.map((time) => (
            <View key={time} style={[styles.tickWrapper, { left: time * unitPx }]}> 
              <View style={styles.tick} />
              <Text style={styles.tickLabel}>{formatTimecode(time)}</Text>
            </View>
          ))}
          <View style={[styles.playhead, { left: headPosition }]} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  pressableRuler: {
    width: '100%',
  },
  ruler: {
    height: 40,
    marginBottom: 4,
  },
  tickWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  tick: {
    width: 1,
    height: 18,
    backgroundColor: '#d1d5db',
  },
  tickLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#2563eb',
  },
});
