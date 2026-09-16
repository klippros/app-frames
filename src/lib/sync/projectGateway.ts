import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProjectFrameRow, ProjectRow } from '../supabase/schema'
import { PROJECT_IMAGES_BUCKET } from '../supabase/schema'
import { FRAME_LIMIT_MESSAGE, PROJECT_LIMIT_MESSAGE, mapLimitError } from './limitErrors'

export { FRAME_LIMIT_MESSAGE, PROJECT_LIMIT_MESSAGE }

export interface UpsertProjectInput {
  id: string
  userId: string
  name: string
  revision: number
  globalSettings: Record<string, unknown>
  clientUpdatedAt: string
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

export const countProjects = async (client: SupabaseClient): Promise<number> => {
  const { count, error } = await client.from('projects').select('*', { count: 'exact', head: true })

  if (error) {
    throw error
  }

  return count ?? 0
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
  const { data: existingRow, error: existingError } = await client
    .from('projects')
    .select('id')
    .eq('id', input.id)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  const writable = {
    name: input.name,
    revision: input.revision,
    global_settings: input.globalSettings,
    client_updated_at: input.clientUpdatedAt,
  }

  if (existingRow) {
    const { data, error } = await client
      .from('projects')
      .update(writable)
      .eq('id', input.id)
      .select('*')
      .single()

    if (error || !data) {
      throw error ?? new Error('Project update returned no row')
    }

    return data as ProjectRow
  }

  // Ownership uses the column default auth.uid() — do not client-set user_id.
  const { data, error } = await client
    .from('projects')
    .insert({
      id: input.id,
      ...writable,
    })
    .select('*')
    .single()

  if (error || !data) {
    mapLimitError(error ?? new Error('Project insert returned no row'))
  }

  return data as ProjectRow
}

export const upsertFrame = async (
  client: SupabaseClient,
  input: UpsertFrameInput,
): Promise<ProjectFrameRow> => {
  const { data: existingRow, error: existingError } = await client
    .from('project_frames')
    .select('id')
    .eq('id', input.id)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  const writable = {
    frame_order: input.frameOrder,
    settings: input.settings,
    image_path: input.imagePath,
    image_content_type: input.imageContentType,
    image_byte_size: input.imageByteSize,
    image_width: input.imageWidth ?? null,
    image_height: input.imageHeight ?? null,
    image_content_hash: input.imageContentHash ?? null,
  }

  if (existingRow) {
    const { data, error } = await client
      .from('project_frames')
      .update(writable)
      .eq('id', input.id)
      .select('*')
      .single()

    if (error || !data) {
      mapLimitError(error ?? new Error('Frame update returned no row'))
    }

    return data as ProjectFrameRow
  }

  const { data, error } = await client
    .from('project_frames')
    .insert({
      id: input.id,
      project_id: input.projectId,
      ...writable,
    })
    .select('*')
    .single()

  if (error || !data) {
    mapLimitError(error ?? new Error('Frame insert returned no row'))
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

type ImageUploadResult = 'created' | 'exists'

const isDuplicateStorageError = (error: {
  message?: string
  statusCode?: string | number
  error?: string
  name?: string
}): boolean => {
  const status = String(error.statusCode ?? '')
  const haystack = `${error.error ?? ''} ${error.name ?? ''} ${error.message ?? ''}`.toLowerCase()
  return (
    status === '409' ||
    haystack.includes('already exists') ||
    haystack.includes('duplicate') ||
    haystack.includes('keyalreadyexists')
  )
}

export const uploadProjectImage = async (
  client: SupabaseClient,
  path: string,
  blob: Blob,
): Promise<ImageUploadResult> => {
  const { error } = await client.storage.from(PROJECT_IMAGES_BUCKET).upload(path, blob, {
    contentType: 'image/webp',
    upsert: false,
  })

  if (!error) {
    return 'created'
  }

  if (isDuplicateStorageError(error)) {
    return 'exists'
  }

  throw error
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

export {
  buildFrameImageFolder,
  buildProjectImageFolder,
  deleteProjectImages,
  sweepFrameImages,
} from './projectImageStorage'
