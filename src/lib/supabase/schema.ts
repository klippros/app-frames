export const PROJECT_IMAGES_BUCKET = 'project-images'
export const MAX_PROJECT_NAME_LENGTH = 100
export const MAX_PROJECT_IMAGE_BYTES = 1_572_864
export const MAX_PROJECTS_PER_USER = 3
export const MAX_FRAMES_PER_PROJECT = 10

export const buildProjectImagePath = (
  userId: string,
  projectId: string,
  frameId: string,
  contentHash: string,
): string => `${userId}/${projectId}/${frameId}/${contentHash}.webp`

export interface ProjectRow {
  id: string
  user_id: string
  name: string
  revision: number
  global_settings: Record<string, unknown>
  created_at: string
  updated_at: string
  client_updated_at: string
  last_snapshot_id: string | null
}

export interface ProjectFrameRow {
  id: string
  project_id: string
  user_id: string
  frame_order: number
  settings: Record<string, unknown>
  image_path: string
  image_content_type: 'image/webp'
  image_byte_size: number
  image_width: number | null
  image_height: number | null
  image_content_hash: string | null
  created_at: string
  updated_at: string
}
