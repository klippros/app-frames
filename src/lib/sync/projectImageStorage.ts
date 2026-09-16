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

/** Remove every object in a frame folder except the path still referenced by metadata. */
export const sweepFrameImages = async (
  client: SupabaseClient,
  userId: string,
  projectId: string,
  frameId: string,
  keepImagePath?: string,
): Promise<void> => {
  const folder = buildFrameImageFolder(userId, projectId, frameId)
  const names = await listStorageNames(client, folder)
  const toRemove = names.map((name) => `${folder}/${name}`).filter((path) => path !== keepImagePath)

  if (toRemove.length === 0) {
    return
  }

  const { error } = await client.storage.from(PROJECT_IMAGES_BUCKET).remove(toRemove)
  if (error) {
    throw error
  }
}

/** Remove every storage object under a project prefix (all frame folders). */
export const deleteProjectImages = async (
  client: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<void> => {
  const projectFolder = buildProjectImageFolder(userId, projectId)
  const frameFolders = await listStorageNames(client, projectFolder)
  const paths: string[] = []

  for (const frameId of frameFolders) {
    const frameFolder = `${projectFolder}/${frameId}`
    const names = await listStorageNames(client, frameFolder)
    for (const name of names) {
      paths.push(`${frameFolder}/${name}`)
    }
  }

  if (paths.length === 0) {
    return
  }

  const { error } = await client.storage.from(PROJECT_IMAGES_BUCKET).remove(paths)
  if (error) {
    throw error
  }
}
