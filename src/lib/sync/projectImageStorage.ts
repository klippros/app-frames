import type { SupabaseClient } from '@supabase/supabase-js'
import { PROJECT_IMAGES_BUCKET } from '../supabase/schema'

export const buildFrameImageFolder = (userId: string, projectId: string, frameId: string): string =>
  `${userId}/${projectId}/${frameId}`

export const buildProjectImageFolder = (userId: string, projectId: string): string =>
  `${userId}/${projectId}`

const listStorageNames = async (client: SupabaseClient, folder: string): Promise<string[]> => {
  const { data, error } = await client.storage.from(PROJECT_IMAGES_BUCKET).list(folder)
  if (error) {
    throw error
  }
  return (data ?? []).map((entry) => entry.name).filter((name) => name.length > 0)
}

const listProjectImagePaths = async (
  client: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<string[]> => {
  const projectFolder = buildProjectImageFolder(userId, projectId)
  const frameFolders = await listStorageNames(client, projectFolder)
  const paths: string[] = []

  for (const frameId of frameFolders) {
    const frameFolder = `${projectFolder}/${frameId}`
    const names = await listStorageNames(client, frameFolder)
    paths.push(...names.map((name) => `${frameFolder}/${name}`))
  }

  return paths
}

const listReferencedImagePaths = async (
  client: SupabaseClient,
  projectId: string,
): Promise<Set<string>> => {
  const { data, error } = await client
    .from('project_frames')
    .select('image_path')
    .eq('project_id', projectId)

  if (error) {
    throw error
  }

  return new Set(((data ?? []) as { image_path: string }[]).map((frame) => frame.image_path))
}

const removePaths = async (client: SupabaseClient, paths: string[]): Promise<void> => {
  if (paths.length === 0) {
    return
  }

  const { error } = await client.storage.from(PROJECT_IMAGES_BUCKET).remove(paths)
  if (error) {
    throw error
  }
}

/** Compensate uploads only when no committed frame metadata references them. */
export const deleteUnreferencedProjectImages = async (
  client: SupabaseClient,
  projectId: string,
  candidatePaths: string[],
): Promise<string[]> => {
  const referenced = await listReferencedImagePaths(client, projectId)
  const toRemove = candidatePaths.filter((path) => !referenced.has(path))
  await removePaths(client, toRemove)
  return toRemove
}

/** Sweep orphaned/replaced objects against the latest committed metadata. */
export const sweepProjectImages = async (
  client: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<void> => {
  const [stored, referenced] = await Promise.all([
    listProjectImagePaths(client, userId, projectId),
    listReferencedImagePaths(client, projectId),
  ])
  await removePaths(
    client,
    stored.filter((path) => !referenced.has(path)),
  )
}

/** Remove every storage object under a project prefix (all frame folders). */
export const deleteProjectImages = async (
  client: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<void> => {
  await removePaths(client, await listProjectImagePaths(client, userId, projectId))
}
