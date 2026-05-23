import { useEffect, useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayheadStore } from '@/store/usePlayheadStore';
import { useTimelineStore } from '@/store/useTimelineStore';
import { executeVideoCuts, executeVideoCutOperations, saveToCameraRoll } from '@/services/mediaProcessor';
import { pickVideoFromGallery } from '@/services/mediaPickerService';
import { formatTimecode, parseTimecode } from '@/utils/time';

interface TimelineControlsProps {
  durationSeconds: number;
}

type CutActionType = 'trim' | 'split' | 'ripple';

export function TimelineControls({ durationSeconds }: TimelineControlsProps) {
  const currentTime = usePlayheadStore((state) => state.currentTime);
  const isPlaying = usePlayheadStore((state) => state.isPlaying);
  const setCurrentTime = usePlayheadStore((state) => state.setCurrentTime);
  const setIsPlaying = usePlayheadStore((state) => state.setIsPlaying);
  const advanceTime = usePlayheadStore((state) => state.advanceTime);
  const clips = useTimelineStore((state) => state.clips);
  const selectedClipId = useTimelineStore((state) => state.selectedClipId);
  const addImportedClip = useTimelineStore((state) => state.addImportedClip);
  const selectedClip = clips.find((clip) => clip.id === selectedClipId);
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

  const handleImportVideo = async () => {
    const asset = await pickVideoFromGallery();

    if (!asset) {
      Alert.alert('استيراد الفيديو', 'لم يتم اختيار أي فيديو.');
      return;
    }

    const trackClips = clips.filter((clip) => clip.trackId === 'track-1');
    const occupiedSeconds = trackClips.reduce((acc, clip) => {
      return Math.max(acc, parseTimecode(clip.start) + parseTimecode(clip.duration));
    }, 0);

    const clipDurationSeconds = Math.max(1, Math.round(asset.durationMs / 1000));

    addImportedClip({
      id: `imported-${Date.now()}`,
      title: asset.fileName,
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      durationMs: asset.durationMs,
      start: formatTimecode(occupiedSeconds),
      duration: formatTimecode(clipDurationSeconds),
      trackId: 'track-1',
      status: 'Ready',
    });

    Alert.alert('استيراد الفيديو', 'تم استيراد الفيديو إلى الجدول الزمني بنجاح.');
  };

  const handleExportSelectedClip = async () => {
    if (!selectedClip?.uri) {
      Alert.alert('تصدير الفيديو', 'يرجى تحديد مقطع فيديو مستورد للتصدير.');
      return;
    }

    const clipStart = parseTimecode(selectedClip.start);
    const clipDuration = parseTimecode(selectedClip.duration);

    const result = await executeVideoCutOperations(
      selectedClip.uri,
      [
        {
          type: 'trim' as const,
          clipId: selectedClip.id,
          startTime: clipStart,
          endTime: clipStart + clipDuration,
        },
      ],
      `export-${selectedClip.id}.mp4`,
      { quality: 'high' },
    );

    if (!result.success || !result.outputPath) {
      Alert.alert('خطأ في التصدير', result.error ?? result.message);
      return;
    }

    try {
      await saveToCameraRoll(result.outputPath);
      Alert.alert('تصدير الفيديو', 'تم حفظ الملف إلى معرض الصور بنجاح.');
    } catch (error) {
      Alert.alert('خطأ في الحفظ', error instanceof Error ? error.message : 'فشل حفظ الملف.');
    }
  };

  const handleCutAction = async (action: CutActionType) => {
    if (!selectedClip || !selectedClip.uri) {
      Alert.alert('Video cut action', 'يرجى تحديد مقطع فيديو مستورد أولاً.');
      return;
    }

    const clipStart = parseTimecode(selectedClip.start);
    const clipDuration = parseTimecode(selectedClip.duration);

    const operations =
      action === 'trim'
        ? [
            {
              type: 'trim' as const,
              clipId: selectedClip.id,
              startTime: clipStart,
              endTime: clipStart + clipDuration,
            },
          ]
        : action === 'split'
        ? [
            {
              type: 'split' as const,
              clipId: selectedClip.id,
              startTime: clipStart + Math.floor(clipDuration / 2),
              endTime: clipStart + clipDuration,
            },
          ]
        : [
            {
              type: 'ripple' as const,
              clipId: selectedClip.id,
              startTime: clipStart + Math.floor(clipDuration / 3),
              endTime: clipStart + Math.floor((clipDuration * 2) / 3),
              rippleOffset: Math.max(1, Math.floor(clipDuration / 3)),
            },
          ];

    const result = await executeVideoCutOperations(selectedClip.uri, operations, `${selectedClip.id}-${action}.mp4`, {
      quality: 'high',
    });

    if (!result.success) {
      Alert.alert('خطأ في المعالجة', result.error ?? result.message);
      return;
    }

    Alert.alert('نجاح المعالجة', result.message);
  };

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
      <View style={styles.cutButtonRow}>
        <Pressable style={styles.actionButton} onPress={() => handleCutAction('trim')}>
          <Text style={styles.actionText}>Trim</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => handleCutAction('split')}>
          <Text style={styles.actionText}>Split</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => handleCutAction('ripple')}>
          <Text style={styles.actionText}>Ripple</Text>
        </Pressable>
      </View>
      <View style={styles.importExportRow}>
        <Pressable style={styles.secondaryButton} onPress={handleImportVideo}>
          <Text style={styles.secondaryText}>Import Video</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={handleExportSelectedClip}>
          <Text style={styles.secondaryText}>Export MP4</Text>
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
    marginBottom: 10,
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
  cutButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    marginRight: 10,
  },
  actionText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  importExportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    marginRight: 10,
  },
  secondaryText: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '700',
  },
});
