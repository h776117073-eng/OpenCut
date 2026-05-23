import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { TimelineScreen } from '@/screens/TimelineScreen';
import { syncProjectToCloud } from '@/services/supabase';
import { useProjectStore, type Project } from '@/store/projectStore';
import { useTimelineStore } from '@/store/useTimelineStore';

export function HomeScreen() {
  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const createProject = useProjectStore((state) => state.createProject);
  const loadProject = useProjectStore((state) => state.loadProject);
  const duplicateProject = useProjectStore((state) => state.duplicateProject);
  const updateProjectName = useProjectStore((state) => state.updateProjectName);
  const deleteProject = useProjectStore((state) => state.deleteProject);
  const closeProject = useProjectStore((state) => state.closeProject);
  const saveActiveProjectDraft = useProjectStore((state) => state.saveActiveProjectDraft);

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  useEffect(() => {
    if (!activeProjectId) {
      return;
    }

    const unsubscribe = useTimelineStore.subscribe((timelineState) => {
      saveActiveProjectDraft({
        clips: timelineState.clips,
        textClips: timelineState.textClips,
        audioClips: timelineState.audioClips,
      });
    });

    return unsubscribe;
  }, [activeProjectId, saveActiveProjectDraft]);

  const handleNewProject = async () => {
    const result = await launchImageLibrary({
      selectionLimit: 1,
      mediaType: 'photo',
    });

    const thumbnailUri = result.assets?.[0]?.uri;
    const id = createProject('New Project', thumbnailUri);
    loadProject(id);
  };

  const handleRenameProject = (project: Project) => {
    setDraftName(project.name);
    setEditingProjectId(project.id);
  };

  const handleSaveRename = () => {
    if (editingProjectId) {
      updateProjectName(editingProjectId, draftName.trim() || 'Untitled Project');
      setEditingProjectId(null);
    }
  };

  const handleCancelRename = () => {
    setEditingProjectId(null);
    setDraftName('');
  };

  const handleDeleteProject = (project: Project) => {
    Alert.alert(
      'Delete Draft',
      `Are you sure you want to delete "${project.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteProject(project.id) },
      ],
    );
  };

  const handleSyncProject = async (project: Project) => {
    const result = await syncProjectToCloud(project, 'anonymous-user');
    if (!result.success) {
      Alert.alert('Sync failed', result.error ?? 'Unable to sync project to Supabase.');
    } else {
      Alert.alert('Sync complete', `Project "${project.name}" was synced to the cloud.`);
    }
  };

  if (activeProjectId && activeProject) {
    return <TimelineScreen onClose={closeProject} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>OpenCut Projects</Text>
        <Text style={styles.subtitle}>Create, duplicate, and sync your drafts instantly.</Text>
      </View>

      <TouchableOpacity style={styles.newButton} onPress={handleNewProject}>
        <Text style={styles.newButtonLabel}>+ New Project</Text>
      </TouchableOpacity>

      {projects.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No drafts found yet</Text>
          <Text style={styles.emptySubtitle}>Create a project to start editing and sync it later.</Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.projectCard}>
              <TouchableOpacity style={styles.projectPreview} onPress={() => loadProject(item.id)}>
                {item.thumbnailUri ? (
                  <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnail} />
                ) : (
                  <View style={styles.thumbnailPlaceholder} />
                )}
                <View style={styles.projectInfo}>
                  {editingProjectId === item.id ? (
                    <TextInput
                      value={draftName}
                      onChangeText={setDraftName}
                      style={styles.projectNameInput}
                      placeholder="Project name"
                      placeholderTextColor="#9ca3af"
                    />
                  ) : (
                    <Text style={styles.projectName}>{item.name}</Text>
                  )}
                  <Text style={styles.projectMeta}>{new Date(item.updatedAt).toLocaleDateString()}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.projectActions}>
                {editingProjectId === item.id ? (
                  <>
                    <TouchableOpacity style={styles.actionButton} onPress={handleSaveRename}>
                      <Text style={styles.actionLabel}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleCancelRename}>
                      <Text style={styles.actionLabel}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleRenameProject(item)}>
                      <Text style={styles.actionLabel}>Rename</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => duplicateProject(item.id)}>
                      <Text style={styles.actionLabel}>Duplicate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteProject(item)}>
                      <Text style={styles.actionLabel}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleSyncProject(item)}>
                      <Text style={styles.actionLabel}>Sync</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    maxWidth: '80%',
  },
  newButton: {
    marginBottom: 20,
    backgroundColor: '#22c55e',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  newButtonLabel: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 280,
  },
  list: {
    paddingBottom: 40,
  },
  projectCard: {
    marginBottom: 16,
    backgroundColor: '#111827',
    borderRadius: 20,
    overflow: 'hidden',
  },
  projectPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginRight: 16,
    backgroundColor: '#334155',
  },
  thumbnailPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginRight: 16,
    backgroundColor: '#334155',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  projectNameInput: {
    color: '#ffffff',
    borderColor: '#475569',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 4,
  },
  projectMeta: {
    color: '#94a3b8',
    fontSize: 13,
  },
  projectActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    backgroundColor: '#0b1120',
  },
  actionButton: {
    marginRight: 8,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1f2937',
    borderRadius: 12,
  },
  actionLabel: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
});
