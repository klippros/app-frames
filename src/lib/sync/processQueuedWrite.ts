import type { SupabaseClient } from '@supabase/supabase-js'
import type { QueuedProjectSnapshotWrite, QueuedProjectWrite } from './idb'
import { getBlob } from './idb'
import {
  deleteProject,
  deleteProjectImages,
  deleteUnreferencedProjectImages,
  saveProjectSnapshot,
  sweepProjectImages,
  uploadProjectImage,
} from './projectGateway'

const uploadedImagePaths = new Set<string>()
let uploadedPathsUserId: string | null = null

export const ensureUploadedPathsUser = (userId: string) => {
  if (uploadedPathsUserId !== userId) {
    uploadedImagePaths.clear()
    uploadedPathsUserId = userId
  }
}

export const clearUploadedImagePaths = () => {
  uploadedImagePaths.clear()
  uploadedPathsUserId = null
}

export const rememberUploadedPath = (userId: string, imagePath: string) => {
  if (uploadedPathsUserId !== userId) {
    uploadedImagePaths.clear()
    uploadedPathsUserId = userId
  }
  uploadedImagePaths.add(imagePath)
}

export const hasUploadedPath = (userId: string, imagePath: string): boolean => {
  if (uploadedPathsUserId !== userId) {
    return false
  }
  return uploadedImagePaths.has(imagePath)
}

export const forgetUploadedPath = (imagePath: string) => {
  uploadedImagePaths.delete(imagePath)
}

const uploadSnapshotImages = async (
  client: SupabaseClient,
  item: QueuedProjectSnapshotWrite,
  createdPaths: string[],
): Promise<void> => {
  for (const frame of item.payload.frames) {
    const skipUpload = !frame.needsImageUpload || hasUploadedPath(item.userId, frame.imagePath)
    if (!skipUpload) {
      const blob = await getBlob(frame.blobKey)
      if (!blob) {
        throw new Error('Missing local blob for frame upload')
      }
      const result = await uploadProjectImage(client, frame.imagePath, blob)
      if (result === 'created') {
        createdPaths.push(frame.imagePath)
      }
    }
    rememberUploadedPath(item.userId, frame.imagePath)
  }
}

export const processQueuedWrite = async (
  client: SupabaseClient,
  item: QueuedProjectWrite,
): Promise<void> => {
  switch (item.kind) {
    case 'save-project-snapshot': {
      const payload = item.payload
      const createdPaths: string[] = []

      try {
        await uploadSnapshotImages(client, item, createdPaths)

        await saveProjectSnapshot(client, {
          projectId: item.projectId,
          expectedRevision: payload.expectedRevision,
          snapshotId: item.id,
          name: payload.name,
          revision: payload.revision,
          globalSettings: payload.globalSettings,
          clientUpdatedAt: payload.clientUpdatedAt,
          frames: payload.frames,
        })
        await sweepProjectImages(client, item.userId, item.projectId).catch(() => undefined)
      } catch (error) {
        if (createdPaths.length > 0) {
          const removed = await deleteUnreferencedProjectImages(
            client,
            item.projectId,
            createdPaths,
          ).catch(() => [])
          for (const path of removed) {
            forgetUploadedPath(path)
          }
        }
        throw error
      }
      break
    }
    case 'delete-project': {
      const projectId = item.payload.projectId
      await deleteProject(client, projectId)
      await deleteProjectImages(client, item.userId, projectId).catch(() => undefined)
      break
    }
    default:
      throw new Error('Unknown queue kind')
  }
}
