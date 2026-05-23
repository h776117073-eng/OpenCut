import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TimelineClip as TimelineClipType } from '@/store/useTimelineStore';
import { TimelineClip } from '@/components/TimelineClip';
import { useTimelineStore } from '@/store/useTimelineStore';
import { parseTimecode } from '@/utils/time';

interface TimelineTrackProps {
  track: {
    id: string;
    title: string;
  };
  clips: TimelineClipType[];
}

const UNIT_PX = 18;
const TRACK_DURATION_SECONDS = 60;

export function TimelineTrack({ track, clips }: TimelineTrackProps) {
  const selectedClipId = useTimelineStore((state) => state.selectedClipId);
  const selectClip = useTimelineStore((state) => state.selectClip);

  const trackWidth = TRACK_DURATION_SECONDS * UNIT_PX;

  const moveClip = useTimelineStore((state) => state.moveClip);

  return (
    <View style={styles.trackContainer}>
      <View style={styles.trackHeader}>
        <Text style={styles.trackTitle}>{track.title}</Text>
        <Text style={styles.trackMeta}>{clips.length} clips</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.trackLane, { width: trackWidth }]}> 
          {clips.map((clip) => {
            const startSeconds = parseTimecode(clip.start);
            const durationSeconds = parseTimecode(clip.duration);
            return (
              <TimelineClip
                key={clip.id}
                clip={clip}
                selected={selectedClipId === clip.id}
                onPress={() => selectClip(clip.id)}
                left={startSeconds * UNIT_PX}
                width={Math.max(durationSeconds * UNIT_PX, 120)}
                unitPx={UNIT_PX}
                onMove={moveClip}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  trackContainer: {
    marginBottom: 18,
  },
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  trackMeta: {
    fontSize: 13,
    color: '#6b7280',
  },
  trackLane: {
    minHeight: 120,
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
    paddingVertical: 16,
  },
});
