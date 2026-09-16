import type { SupabaseClient } from '@supabase/supabase-js'
import type { Workspace, WorkspaceFrame, WorkspaceImageMeta } from '../../workspace/types'
import { buildProjectImagePath } from '../supabase/schema'
import { hashBlob } from './contentHash'
import {
  deleteBlob,
  deleteBlobsByProjectPrefix,
  dequeueWrite,
  enqueueWrite,
  listQueueForUser,
  putBlob,
} from './idb'
import { listProjects } from './projectGateway'
import {
  clearUploadedImagePaths,
  ensureUploadedPathsUser,
  hasUploadedPath,
  processQueuedWrite,
} from './processQueuedWrite'

export const SyncStatus = {
  Idle: 'idle',
  Syncing: 'syncing',
  Synced: 'synced',
  Error: 'error',
  Conflict: 'conflict',
} as const

export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus]

type StatusListener = (status: SyncStatus, message?: string) => void

let flushChain: Promise<void> = Promise.resolve()
let activeUserId: string | null = null
let activeClient: SupabaseClient | null = null
let statusListener: StatusListener | null = null

const setStatus = (status: SyncStatus, message?: string) => {
  statusListener?.(status, message)
}

export const startProjectSync = (
  client: SupabaseClient,
  userId: string,
  onStatus?: StatusListener,
) => {
  ensureUploadedPathsUser(userId)
  activeClient = client
  activeUserId = userId
  statusListener = onStatus ?? null
  void flushProjectSync()
}

export const stopProjectSync = () => {
  activeClient = null
  activeUserId = null
  statusListener = null
  clearUploadedImagePaths()
}

const blobKey = (userId: string, projectId: string, frameId: string) =>
  `${userId}/${projectId}/${frameId}`

export const queueWorkspaceSave = async (
  userId: string,
  workspace: Workspace,
  deletedFrames: readonly { id: string; imagePath?: string }[] = [],
): Promise<Record<string, WorkspaceImageMeta>> => {
  if (workspace.kind !== 'project' || workspace.id === null || workspace.name === null) {
    return {}
  }

  const projectId = workspace.id
  const clientUpdatedAt = new Date().toISOString()
  const frameImages: Record<string, WorkspaceImageMeta> = {}

  for (const deleted of deletedFrames) {
    await queueFrameDelete(userId, projectId, deleted.id, deleted.imagePath)
  }

  await enqueueWrite({
    id: crypto.randomUUID(),
    userId,
    projectId,
    kind: 'upsert-project',
    createdAt: clientUpdatedAt,
    payload: {
      id: projectId,
      name: workspace.name,
      revision: workspace.revision,
      globalSettings: workspace.globalSettings,
      clientUpdatedAt,
    },
  })

  for (const frame of workspace.frames) {
    frameImages[frame.id] = await queueFrameSave(userId, projectId, frame)
  }

  return frameImages
}

export const queueFrameSave = async (
  userId: string,
  projectId: string,
  frame: WorkspaceFrame,
): Promise<WorkspaceImageMeta> => {
  const key = blobKey(userId, projectId, frame.id)
  await putBlob(userId, key, frame.file)

  const contentHash = frame.image?.contentHash ?? (await hashBlob(frame.file))
  const imagePath =
    frame.image?.storagePath ?? buildProjectImagePath(userId, projectId, frame.id, contentHash)

  const image: WorkspaceImageMeta = {
    contentType: 'image/webp',
    byteSize: frame.file.size,
    width: frame.image?.width,
    height: frame.image?.height,
    contentHash,
    storagePath: imagePath,
  }

  await enqueueWrite({
    id: crypto.randomUUID(),
    userId,
    projectId,
    kind: 'upsert-frame',
    createdAt: new Date().toISOString(),
    payload: {
      id: frame.id,
      projectId,
      frameOrder: frame.order,
      settings: frame.settings,
      imagePath,
      imageContentType: 'image/webp',
      imageByteSize: frame.file.size,
      imageWidth: frame.image?.width,
      imageHeight: frame.image?.height,
      imageContentHash: contentHash,
      blobKey: key,
      needsImageUpload: !frame.image?.storagePath && !hasUploadedPath(userId, imagePath),
    },
  })

  return image
}

export const queueFrameDelete = async (
  userId: string,
  projectId: string,
  frameId: string,
  imagePath?: string,
): Promise<void> => {
  const pending = await listQueueForUser(userId)
  for (const item of pending) {
    if (
      item.projectId === projectId &&
      item.kind === 'upsert-frame' &&
      String(item.payload.id) === frameId
    ) {
      await dequeueWrite(item.id)
    }
  }

  await deleteBlob(blobKey(userId, projectId, frameId)).catch(() => undefined)

  await enqueueWrite({
    id: crypto.randomUUID(),
    userId,
    projectId,
    kind: 'delete-frame',
    createdAt: new Date().toISOString(),
    payload: { frameId, imagePath },
  })
}

export const queueProjectDelete = async (userId: string, projectId: string): Promise<void> => {
  const pending = await listQueueForUser(userId)
  for (const item of pending) {
    if (item.projectId === projectId) {
      await dequeueWrite(item.id)
    }
  }

  await deleteBlobsByProjectPrefix(userId, projectId).catch(() => undefined)

  await enqueueWrite({
    id: crypto.randomUUID(),
    userId,
    projectId,
    kind: 'delete-project',
    createdAt: new Date().toISOString(),
    payload: { projectId },
  })
}

export const flushProjectSync = (): Promise<void> => {
  flushChain = flushChain.then(async () => {
    const client = activeClient
    const userId = activeUserId
    if (client === null || userId === null) {
      return
    }

    const items = await listQueueForUser(userId)
    if (items.length === 0) {
      setStatus(SyncStatus.Synced)
      return
    }

    setStatus(SyncStatus.Syncing)
    try {
      for (const item of items) {
        await processQueuedWrite(client, item)
        await dequeueWrite(item.id)
      }
      setStatus(SyncStatus.Synced)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed'
      if (message.toLowerCase().includes('conflict')) {
        setStatus(SyncStatus.Conflict, message)
      } else {
        setStatus(SyncStatus.Error, message)
      }
      throw error
    }
  })

  return flushChain.catch(() => undefined)
}

export const retryProjectSync = (): Promise<void> => flushProjectSync()

export { listProjects }
export { hydrateProjectWorkspace } from './hydrateProjectWorkspace'
