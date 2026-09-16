import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProjectFrameRow, ProjectRow } from '../supabase/schema'
import { PROJECT_IMAGES_BUCKET } from '../supabase/schema'
import { FRAME_LIMIT_MESSAGE, PROJECT_LIMIT_MESSAGE, mapLimitError } from './limitErrors'
import { ProjectSyncError, SyncFailureKind } from './syncErrors'

export { FRAME_LIMIT_MESSAGE, PROJECT_LIMIT_MESSAGE }

export interface ProjectSnapshotFrameInput {
  id: string
  frameOrder: number
  settings: Record<string, unknown>
  imagePath: string
  imageContentType: 'image/webp'
  imageByteSize: number
  imageWidth?: number
  imageHeight?: number
  imageContentHash?: string
}

export interface SaveProjectSnapshotInput {
  projectId: string
  expectedRevision: number | null
  snapshotId: string
  name: string
  revision: number
  globalSettings: Record<string, unknown>
  clientUpdatedAt: string
  frames: ProjectSnapshotFrameInput[]
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

export const saveProjectSnapshot = async (
  client: SupabaseClient,
  input: SaveProjectSnapshotInput,
): Promise<number> => {
  const { data, error } = await client.rpc('save_project_snapshot', {
    p_project_id: input.projectId,
    p_expected_revision: input.expectedRevision,
    p_snapshot_id: input.snapshotId,
    p_name: input.name,
    p_revision: input.revision,
    p_global_settings: input.globalSettings,
    p_client_updated_at: input.clientUpdatedAt,
    p_frames: input.frames.map((frame) => ({
      id: frame.id,
      frame_order: frame.frameOrder,
      settings: frame.settings,
      image_path: frame.imagePath,
      image_content_type: frame.imageContentType,
      image_byte_size: frame.imageByteSize,
      image_width: frame.imageWidth ?? null,
      image_height: frame.imageHeight ?? null,
      image_content_hash: frame.imageContentHash ?? null,
    })),
  })

  if (error) {
    mapLimitError(error)
  }

  const result = Array.isArray(data) ? data[0] : data
  if (!result || typeof result !== 'object') {
    throw new Error('Project snapshot RPC returned no result')
  }

  const row = result as Record<string, unknown>
  if (row.result_code === 'revision_conflict') {
    throw new ProjectSyncError(
      SyncFailureKind.Conflict,
      'Sync conflict — the project changed on another client.',
    )
  }
  if (row.result_code !== 'applied' || typeof row.server_revision !== 'number') {
    throw new Error('Project snapshot RPC returned an invalid result')
  }

  return row.server_revision
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
  deleteUnreferencedProjectImages,
  deleteProjectImages,
  sweepProjectImages,
} from './projectImageStorage'
