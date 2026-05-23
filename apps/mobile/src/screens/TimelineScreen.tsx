import { useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { PreviewPlayer } from '@/components/PreviewPlayer';
import { TimelineControls } from '@/components/TimelineControls';
import { TimelineTrack } from '@/components/TimelineTrack';
import { TimelineRuler } from '@/components/TimelineRuler';
import { useTimelineStore } from '@/store/useTimelineStore';
import { initVideoProcessor } from '@/services/mediaProcessor';
import { initializeAudioMixer } from '@/services/audioMixerService';
import { AudioWaveformView } from '@/components/AudioWaveformView';
import { ExportProgressOverlay } from '@/components/ExportProgressOverlay';

const TRACK_DURATION_SECONDS = 60;
const UNIT_PX = 18;

export function TimelineScreen() {
  const setTimelineLoaded = useAppStore((state) => state.setTimelineLoaded);
  const tracks = useTimelineStore((state) => state.tracks);
  const clips = useTimelineStore((state) => state.clips);
  const audioClips = useTimelineStore((state) => state.audioClips);
  const firstVideoUrl = clips.find((clip) => clip.uri)?.uri;
  const firstAudioUrl = audioClips.find((clip) => clip.uri)?.uri;

  useEffect(() => {
    setTimelineLoaded(true);

    void (async () => {
      await initVideoProcessor();
      await initializeAudioMixer();
    })();
  }, [setTimelineLoaded]);

  return (
    <SafeAreaView style={styles.screen}>
      <ExportProgressOverlay />
      <View style={styles.previewContainer}>
        <PreviewPlayer videoUrl={firstVideoUrl} />
        <AudioWaveformView audioUri={firstAudioUrl} style={styles.waveform} />
      </View>
      <View style={styles.timelineContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Timeline</Text>
          <Text style={styles.subtitle}>Edit clips, arrange scenes, and preview your sequence.</Text>
        </View>
        <TimelineControls durationSeconds={TRACK_DURATION_SECONDS} />
        <TimelineRuler durationSeconds={TRACK_DURATION_SECONDS} unitPx={UNIT_PX} />
        <ScrollView contentContainerStyle={styles.trackList}>
          {tracks.map((track) => (
            <TimelineTrack key={track.id} track={track} clips={clips.filter((clip) => clip.trackId === track.id)} />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
    flexDirection: 'column',
  },
  previewContainer: {
    flex: 0.4,
    backgroundColor: '#000',
  },
  waveform: {
    paddingVertical: 8,
    backgroundColor: '#0f172a',
  },
  timelineContainer: {
    flex: 0.6,
    backgroundColor: '#f2f4f7',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6b7280',
  },
  trackList: {
    paddingBottom: 32,
  },
});
