import { useEffect, useRef } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import Video, { OnProgressData, VideoRef } from 'react-native-video';
import { usePlayheadStore } from '@/store/usePlayheadStore';
import { useTimelineStore } from '@/store/useTimelineStore';
import { parseTimecode } from '@/utils/time';

const AnimatedView = Animated.createAnimatedComponent(View);

interface PreviewPlayerProps {
  videoUrl?: string;
}

export function PreviewPlayer({ videoUrl }: PreviewPlayerProps) {
  const currentTime = usePlayheadStore((state) => state.currentTime);
  const isPlaying = usePlayheadStore((state) => state.isPlaying);
  const setCurrentTime = usePlayheadStore((state) => state.setCurrentTime);
  const setIsPlaying = usePlayheadStore((state) => state.setIsPlaying);
  const textClips = useTimelineStore((state) => state.textClips);
  const updateTextClipPosition = useTimelineStore((state) => state.updateTextClipPosition);

  const videoRef = useRef<VideoRef>(null);
  const canvasProgress = useSharedValue(0);
  const videoDuration = useRef(0);
  const containerLayout = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const dragState = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  useEffect(() => {
    if (videoRef.current && !isPlaying) {
      videoRef.current.seek(currentTime);
    }
  }, [currentTime, isPlaying]);

  useEffect(() => {
    canvasProgress.value = withSpring(currentTime, {
      damping: 15,
      mass: 1,
      overshootClamping: false,
    });
  }, [currentTime, canvasProgress]);

  const handleProgress = (data: OnProgressData) => {
    const newTime = data.currentTime;
    const duration = data.seekableDuration || videoDuration.current;

    if (isPlaying && Math.abs(newTime - currentTime) > 0.1) {
      runOnJS(setCurrentTime)(newTime);
    }
  };

  const handleEnd = () => {
    runOnJS(setIsPlaying)(false);
    runOnJS(setCurrentTime)(0);
  };

  const handleLoad = (data: { duration: number }) => {
    videoDuration.current = data.duration;
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    containerLayout.current = event.nativeEvent.layout;
  };

  const activeCaptions = textClips.filter((clip) => {
    const start = parseTimecode(clip.start);
    const end = parseTimecode(clip.end);
    return currentTime >= start && currentTime <= end;
  });

  const handleCaptionGrant = (id: string, event: { nativeEvent: { pageX: number; pageY: number } }) => {
    const layout = containerLayout.current;
    const { pageX, pageY } = event.nativeEvent;
    const caption = textClips.find((clip) => clip.id === id);

    if (!caption) {
      return;
    }

    const pointerX = pageX - layout.x;
    const pointerY = pageY - layout.y;

    dragState.current = {
      id,
      offsetX: pointerX - caption.x,
      offsetY: pointerY - caption.y,
    };
  };

  const handleResponderMove = (event: { nativeEvent: { pageX: number; pageY: number } }) => {
    if (!dragState.current) {
      return;
    }

    const layout = containerLayout.current;
    const { pageX, pageY } = event.nativeEvent;
    const pointerX = pageX - layout.x;
    const pointerY = pageY - layout.y;
    const nextX = Math.max(0, pointerX - dragState.current.offsetX);
    const nextY = Math.max(0, pointerY - dragState.current.offsetY);

    updateTextClipPosition(dragState.current.id, nextX, nextY);
  };

  const handleResponderRelease = () => {
    dragState.current = null;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: currentTime >= 0 ? 1 : 0.5,
  }));

  return (
    <AnimatedView
      style={[
        styles.root,
        animatedStyle,
      ]}
    >
      <View style={styles.previewLayer} onLayout={handleLayout}>
        <Canvas style={styles.canvas} />

        {activeCaptions.map((caption) => (
          <View
            key={caption.id}
            style={[
              styles.captionBubble,
              {
                left: caption.x,
                top: caption.y,
                backgroundColor: caption.backgroundColor ?? 'rgba(15,23,42,0.75)',
              },
            ]}
            onStartShouldSetResponder={() => true}
            onResponderGrant={(event) => handleCaptionGrant(caption.id, event)}
            onResponderMove={handleResponderMove}
            onResponderRelease={handleResponderRelease}
          >
            <Text style={[styles.captionText, { fontSize: caption.fontSize ?? 18, color: caption.color ?? '#ffffff' }]}> 
              {caption.text}
            </Text>
          </View>
        ))}
      </View>

      {videoUrl && (
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.hiddenVideo}
          paused={!isPlaying}
          onProgress={handleProgress}
          onEnd={handleEnd}
          onLoad={handleLoad}
          progressUpdateInterval={50}
          playInBackground={false}
          playWhenInactive={false}
        />
      )}

      {!videoUrl && (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyStateIcon} />
          </View>
        </View>
      )}
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewLayer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  canvas: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  hiddenVideo: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  captionBubble: {
    position: 'absolute',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    maxWidth: '75%',
    elevation: 2,
  },
  captionText: {
    color: '#ffffff',
    letterSpacing: 0.2,
    lineHeight: 22,
    fontWeight: '700',
  },
  emptyStateContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  emptyStateCard: {
    padding: 20,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#374151',
    marginBottom: 12,
  },
});
