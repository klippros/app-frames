import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProjectFrameRow, ProjectRow } from '../supabase/schema'
import { PROJECT_IMAGES_BUCKET } from '../supabase/schema'

export interface UpsertProjectInput {
  id: string
  userId: string
  name: string
  revision: number
  globalSettings: Record<string, unknown>
  clientUpdatedAt: string
  expectedRevision?: number
}

export interface UpsertFrameInput {
  id: string
  userId: string
  projectId: string
  frameOrder: number
  settings: Record<string, unknown>
  imagePath: string
  imageContentType: 'image/webp'
  imageByteSize: number
  imageWidth?: number
  imageHeight?: number
  imageContentHash?: string
}

export const listProjects = async (client: SupabaseClient): Promise<ProjectRow[]> => {
  const { data, error } = await client
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as ProjectRow[]
}

export const getProjectWithFrames = async (
  client: SupabaseClient,
  projectId: string,
): Promise<{ project: ProjectRow; frames: ProjectFrameRow[] } | null> => {
  const { data: project, error: projectError } = await client
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle()

  if (projectError) {
    throw projectError
  }

  if (!project) {
    return null
  }

  const { data: frames, error: framesError } = await client
    .from('project_frames')
    .select('*')
    .eq('project_id', projectId)
    .order('frame_order', { ascending: true })

  if (framesError) {
    throw framesError
  }

  return {
    project: project as ProjectRow,
    frames: (frames ?? []) as ProjectFrameRow[],
  }
}

export const upsertProject = async (
  client: SupabaseClient,
  input: UpsertProjectInput,
): Promise<ProjectRow> => {
  if (input.expectedRevision !== undefined) {
    const { data: existing, error: readError } = await client
      .from('projects')
      .select('revision')
      .eq('id', input.id)
      .maybeSingle()

    if (readError) {
      throw readError
    }

    if (existing && existing.revision !== input.expectedRevision) {
      throw new Error('Project revision conflict')
    }
  }

  const { data, error } = await client
    .from('projects')
    .upsert(
      {
        id: input.id,
        user_id: input.userId,
        name: input.name,
        revision: input.revision,
        global_settings: input.globalSettings,
        client_updated_at: input.clientUpdatedAt,
      },
      { onConflict: 'user_id,id' },
    )
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Project upsert returned no row')
  }

  return data as ProjectRow
}

export const upsertFrame = async (
  client: SupabaseClient,
  input: UpsertFrameInput,
): Promise<ProjectFrameRow> => {
  const { data, error } = await client
    .from('project_frames')
    .upsert(
      {
        id: input.id,
        user_id: input.userId,
        project_id: input.projectId,
        frame_order: input.frameOrder,
        settings: input.settings,
        image_path: input.imagePath,
        image_content_type: input.imageContentType,
        image_byte_size: input.imageByteSize,
        image_width: input.imageWidth ?? null,
        image_height: input.imageHeight ?? null,
        image_content_hash: input.imageContentHash ?? null,
      },
      { onConflict: 'user_id,id' },
    )
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Frame upsert returned no row')
  }

  return data as ProjectFrameRow
}

export const deleteFrame = async (client: SupabaseClient, frameId: string): Promise<void> => {
  const { error } = await client.from('project_frames').delete().eq('id', frameId)
  if (error) {
    throw error
  }
}

export const deleteProject = async (client: SupabaseClient, projectId: string): Promise<void> => {
  const { error } = await client.from('projects').delete().eq('id', projectId)
  if (error) {
    throw error
  }
}

export const uploadProjectImage = async (
  client: SupabaseClient,
  path: string,
  blob: Blob,
): Promise<void> => {
  const { error } = await client.storage.from(PROJECT_IMAGES_BUCKET).upload(path, blob, {
    contentType: 'image/webp',
    upsert: false,
  })

  if (error && !error.message.toLowerCase().includes('already exists')) {
    throw error
  }
}

export const downloadProjectImage = async (client: SupabaseClient, path: string): Promise<Blob> => {
  const { data, error } = await client.storage.from(PROJECT_IMAGES_BUCKET).download(path)
  if (error || !data) {
    throw error ?? new Error('Image download returned no data')
  }
  return data
}

export const deleteProjectImage = async (client: SupabaseClient, path: string): Promise<void> => {
  const { error } = await client.storage.from(PROJECT_IMAGES_BUCKET).remove([path])
  if (error) {
    throw error
  }
}
