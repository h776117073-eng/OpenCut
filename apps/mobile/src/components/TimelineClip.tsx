import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo, useRef } from 'react';
import { formatTimecode } from '@/utils/time';
import type { TimelineClip as TimelineClipType } from '@/store/useTimelineStore';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TimelineClipProps {
  clip: TimelineClipType;
  selected: boolean;
  onPress: () => void;
  left: number;
  width: number;
  unitPx: number;
  onMove: (id: string, start: string) => void;
}

export function TimelineClip({ clip, selected, onPress, left, width, unitPx, onMove }: TimelineClipProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const clipWidth = width;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 4,
        onPanResponderMove: (_, gestureState) => {
          translateX.setValue(gestureState.dx);
        },
        onPanResponderRelease: (_, gestureState) => {
          const rawLeft = left + gestureState.dx;
          const nextLeft = Math.max(0, rawLeft);
          const nextSeconds = Math.round(nextLeft / unitPx);
          onMove(clip.id, formatTimecode(nextSeconds));
          Animated.timing(translateX, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();
        },
      }),
    [clip.id, left, onMove, translateX, unitPx],
  );

  return (
    <AnimatedPressable
      {...panResponder.panHandlers}
      onPress={onPress}
      style={[
        styles.card,
        selected && styles.selectedCard,
        {
          position: 'absolute',
          left,
          width: clipWidth,
          transform: [{ translateX }],
        },
      ]}
    >
      <View style={styles.row}>
        <Text style={styles.title}>{clip.title}</Text>
        <Text style={styles.duration}>{clip.duration}</Text>
      </View>
      <Text style={styles.status}>{clip.status}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 120,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  duration: {
    fontSize: 13,
    color: '#6b7280',
  },
  status: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
});
