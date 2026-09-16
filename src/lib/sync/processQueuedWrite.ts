import type { SupabaseClient } from '@supabase/supabase-js'
import type { QueuedProjectWrite } from './idb'
import { getBlob } from './idb'
import {
  deleteFrame,
  deleteProject,
  deleteProjectImage,
  deleteProjectImages,
  sweepFrameImages,
  uploadProjectImage,
  upsertFrame,
  upsertProject,
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

export const processQueuedWrite = async (
  client: SupabaseClient,
  item: QueuedProjectWrite,
): Promise<void> => {
  switch (item.kind) {
    case 'upsert-project': {
      const payload = item.payload
      await upsertProject(client, {
        id: String(payload.id),
        userId: item.userId,
        name: String(payload.name),
        revision: Number(payload.revision),
        globalSettings: payload.globalSettings as Record<string, unknown>,
        clientUpdatedAt: String(payload.clientUpdatedAt),
      })
      break
    }
    case 'upsert-frame': {
      const payload = item.payload
      const imagePath = String(payload.imagePath)
      const frameId = String(payload.id)
      const projectId = String(payload.projectId)
      const skipUpload =
        payload.needsImageUpload === false || hasUploadedPath(item.userId, imagePath)
      let createdObject = false

      if (!skipUpload) {
        const key = String(payload.blobKey)
        const blob = await getBlob(key)
        if (!blob) {
          throw new Error('Missing local blob for frame upload')
        }
        const result = await uploadProjectImage(client, imagePath, blob)
        createdObject = result === 'created'
      }

      rememberUploadedPath(item.userId, imagePath)

      try {
        await upsertFrame(client, {
          id: frameId,
          userId: item.userId,
          projectId,
          frameOrder: Number(payload.frameOrder),
          settings: payload.settings as Record<string, unknown>,
          imagePath,
          imageContentType: 'image/webp',
          imageByteSize: Number(payload.imageByteSize),
          imageWidth: typeof payload.imageWidth === 'number' ? payload.imageWidth : undefined,
          imageHeight: typeof payload.imageHeight === 'number' ? payload.imageHeight : undefined,
          imageContentHash:
            typeof payload.imageContentHash === 'string' ? payload.imageContentHash : undefined,
        })
        await sweepFrameImages(client, item.userId, projectId, frameId, imagePath).catch(
          () => undefined,
        )
      } catch (error) {
        if (createdObject) {
          await deleteProjectImage(client, imagePath).catch(() => undefined)
          forgetUploadedPath(imagePath)
        }
        throw error
      }
      break
    }
    case 'delete-frame': {
      const frameId = String(item.payload.frameId)
      await deleteFrame(client, frameId)
      await sweepFrameImages(client, item.userId, item.projectId, frameId).catch(() => undefined)
      break
    }
    case 'delete-project': {
      const projectId = String(item.payload.projectId)
      await deleteProject(client, projectId)
      await deleteProjectImages(client, item.userId, projectId).catch(() => undefined)
      break
    }
    case 'delete-object': {
      await deleteProjectImage(client, String(item.payload.imagePath))
      break
    }
    default:
      throw new Error(`Unknown queue kind: ${item.kind}`)
  }
}
