import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { requestCancelVideoProcessing } from '@/services/mediaProcessor';
import { useTimelineStore } from '@/store/useTimelineStore';

const AnimatedView = Animated.createAnimatedComponent(View);

export function ExportProgressOverlay() {
  const isExporting = useTimelineStore((state) => state.isExporting);
  const exportProgress = useTimelineStore((state) => state.exportProgress);
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2200,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [rotation]);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const progressPath = useMemo(() => {
    const radius = 64;
    const center = 80;
    const path = Skia.Path.Make();
    const sweep = Math.max(0.001, Math.min(2 * Math.PI, (exportProgress / 100) * 2 * Math.PI));
    const rect = Skia.XYWHRect(center - radius, center - radius, radius * 2, radius * 2);
    path.addArc(rect, -Math.PI / 2, sweep);
    return path;
  }, [exportProgress]);

  if (!isExporting) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <AnimatedView style={[styles.spinnerWrapper, rotationStyle]}>
        <Canvas style={styles.canvas}>
          <Circle
            cx={80}
            cy={80}
            r={72}
            color="rgba(255,255,255,0.08)"
            style="stroke"
            strokeWidth={12}
          />
          <Path
            path={progressPath}
            color="#38bdf8"
            style="stroke"
            strokeWidth={12}
            strokeCap="round"
          />
          <Circle cx={80} cy={80} r={48} color="rgba(15,23,42,0.94)" />
        </Canvas>
      </AnimatedView>
      <View style={styles.textContainer}>
        <Text style={styles.title}>جاري تصدير عملك الفني...</Text>
        <Text style={styles.percentage}>{exportProgress}%</Text>
        <Text style={styles.subtitle}>يرجى عدم إغلاق التطبيق.</Text>
        <Pressable style={styles.cancelButton} onPress={requestCancelVideoProcessing}>
          <Text style={styles.cancelText}>إلغاء التصدير</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 24,
  },
  spinnerWrapper: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  canvas: {
    width: 160,
    height: 160,
  },
  textContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  title: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  percentage: {
    color: '#38bdf8',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#ef4444',
    borderRadius: 14,
  },
  cancelText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
