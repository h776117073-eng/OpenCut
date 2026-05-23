import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Project } from '@/store/projectStore';

const SUPABASE_URL = '';
const SUPABASE_ANON_KEY = '';

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const initSupabase = (): SupabaseClient => supabase;

export const syncProjectToCloud = async (
  project: Project,
  userId: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return {
      success: false,
      error: 'Supabase configuration is missing. Set SUPABASE_URL and SUPABASE_ANON_KEY.',
    };
  }

  const row = {
    id: project.id,
    user_id: userId,
    name: project.name,
    thumbnail_uri: project.thumbnailUri ?? null,
    clips: project.clips,
    text_clips: project.textClips,
    audio_clips: project.audioClips,
    created_at: project.createdAt,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('projects').upsert(row, {
    onConflict: 'id',
  });

  return {
    success: error == null,
    error: error?.message,
  };
};
