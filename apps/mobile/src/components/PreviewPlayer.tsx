import { useEffect, useRef } from 'react';
import { View, ViewStyle } from 'react-native';
import { Canvas, Image as SkiaImage, Skia } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import Video, { OnProgressData, VideoRef } from 'react-native-video';
import { usePlayheadStore } from '@/store/usePlayheadStore';

const AnimatedView = Animated.createAnimatedComponent(View);

interface PreviewPlayerProps {
  videoUrl?: string;
}

export function PreviewPlayer({ videoUrl }: PreviewPlayerProps) {
  const currentTime = usePlayheadStore((state) => state.currentTime);
  const isPlaying = usePlayheadStore((state) => state.isPlaying);
  const setCurrentTime = usePlayheadStore((state) => state.setCurrentTime);
  const setIsPlaying = usePlayheadStore((state) => state.setIsPlaying);

  const videoRef = useRef<VideoRef>(null);
  const canvasProgress = useSharedValue(0);
  const videoDuration = useRef(0);

  // تحديث الفيديو عند تغيير currentTime من Timeline
  useEffect(() => {
    if (videoRef.current && !isPlaying) {
      videoRef.current.seek(currentTime);
    }
  }, [currentTime, isPlaying]);

  // تحديث isPlaying عند التشغيل/الإيقاف
  useEffect(() => {
    canvasProgress.value = withSpring(currentTime, {
      damping: 15,
      mass: 1,
      overshootClamping: false,
    });
  }, [currentTime, canvasProgress]);

  // معالج تقدم الفيديو
  const handleProgress = (data: OnProgressData) => {
    const newTime = data.currentTime;
    const duration = data.seekableDuration || videoDuration.current;

    // تحديث المخزن عند التشغيل الفعلي للفيديو
    if (isPlaying && Math.abs(newTime - currentTime) > 0.1) {
      runOnJS(setCurrentTime)(newTime);
    }
  };

  // معالج انتهاء الفيديو
  const handleEnd = () => {
    runOnJS(setIsPlaying)(false);
    runOnJS(setCurrentTime)(0);
  };

  // معالج حساب المدة
  const handleLoad = (data: { duration: number }) => {
    videoDuration.current = data.duration;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: currentTime >= 0 ? 1 : 0.5,
  }));

  return (
    <AnimatedView
      style={[
        {
          flex: 1,
          backgroundColor: '#000',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        } as ViewStyle,
        animatedStyle,
      ]}
    >
      {/* Canvas Skia لرسم الإطارات */}
      <Canvas
        style={{
          flex: 1,
          width: '100%',
          backgroundColor: '#000',
        }}
      >
        {/* سيتم رسم إطارات الفيديو هنا عند التطبيق الكامل */}
      </Canvas>

      {/* مشغل الفيديو المخفي (يغذي الإطارات) */}
      {videoUrl && (
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            opacity: 0,
          }}
          paused={!isPlaying}
          onProgress={handleProgress}
          onEnd={handleEnd}
          onLoad={handleLoad}
          progressUpdateInterval={50}
          playInBackground={false}
          playWhenInactive={false}
        />
      )}

      {/* عرض نص توضيحي إذا لم يكن هناك فيديو */}
      {!videoUrl && (
        <View
          style={{
            position: 'absolute',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          <View
            style={{
              padding: 20,
              backgroundColor: '#1f2937',
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#374151',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
              }}
            />
          </View>
        </View>
      )}
    </AnimatedView>
  );
}
