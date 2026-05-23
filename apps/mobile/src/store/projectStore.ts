import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mmkvStorage } from '@/services/storageService';
import { useTimelineStore, type AudioClip, type TextClip, type TimelineClip } from '@/store/useTimelineStore';

export interface Project {
  id: string;
  name: string;
  thumbnailUri?: string;
  clips: TimelineClip[];
  textClips: TextClip[];
  audioClips: AudioClip[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
  createProject: (name?: string, thumbnailUri?: string) => string;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  updateProjectName: (id: string, name: string) => void;
  updateProjectThumbnail: (id: string, thumbnailUri: string) => void;
  setActiveProject: (id: string | null) => void;
  loadProject: (id: string) => void;
  closeProject: () => void;
  saveActiveProjectDraft: (timelineState: {
    clips: TimelineClip[];
    textClips: TextClip[];
    audioClips: AudioClip[];
  }) => void;
}

const createId = (): string => `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      createProject: (name = 'New Project', thumbnailUri) => {
        const id = createId();
        const now = new Date().toISOString();
        const project: Project = {
          id,
          name,
          thumbnailUri,
          clips: [],
          textClips: [],
          audioClips: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          projects: [project, ...state.projects],
          activeProjectId: id,
        }));

        return id;
      },
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        })),
      duplicateProject: (id) =>
        set((state) => {
          const original = state.projects.find((project) => project.id === id);
          if (!original) {
            return state;
          }

          const now = new Date().toISOString();
          const duplicate = {
            ...original,
            id: createId(),
            name: `${original.name} Copy`,
            createdAt: now,
            updatedAt: now,
          };

          return {
            projects: [duplicate, ...state.projects],
            activeProjectId: duplicate.id,
          };
        }),
      updateProjectName: (id, name) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? { ...project, name, updatedAt: new Date().toISOString() }
              : project,
          ),
        })),
      updateProjectThumbnail: (id, thumbnailUri) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? { ...project, thumbnailUri, updatedAt: new Date().toISOString() }
              : project,
          ),
        })),
      setActiveProject: (id) => set({ activeProjectId: id }),
      loadProject: (id) => {
        const project = get().projects.find((item) => item.id === id);
        if (!project) {
          set({ activeProjectId: null });
          return;
        }

        useTimelineStore.setState({
          clips: project.clips,
          textClips: project.textClips,
          audioClips: project.audioClips,
          selectedClipId: null,
        });

        set({ activeProjectId: id });
      },
      closeProject: () => set({ activeProjectId: null }),
      saveActiveProjectDraft: (timelineState) =>
        set((state) => {
          if (!state.activeProjectId) {
            return state;
          }

          return {
            projects: state.projects.map((project) =>
              project.id === state.activeProjectId
                ? {
                    ...project,
                    clips: timelineState.clips,
                    textClips: timelineState.textClips,
                    audioClips: timelineState.audioClips,
                    updatedAt: new Date().toISOString(),
                  }
                : project,
            ),
          };
        }),
    }),
    {
      name: 'project-store',
      storage: mmkvStorage,
    },
  ),
);
