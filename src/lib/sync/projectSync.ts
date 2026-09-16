import type { SupabaseClient } from '@supabase/supabase-js'
import type { Workspace, WorkspaceFrame, WorkspaceImageMeta } from '../../workspace/types'
import { buildProjectImagePath } from '../supabase/schema'
import { hashBlob } from './contentHash'
import type { QueuedProjectSnapshotWrite, QueuedSnapshotFrame } from './idb'
import {
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
import { SyncFailureKind, toProjectSyncError } from './syncErrors'

export { ProjectSyncError, SyncFailureKind } from './syncErrors'

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
const knownServerRevisions = new Map<string, number>()

const setStatus = (status: SyncStatus, message?: string) => {
  statusListener?.(status, message)
}

const reportSyncFailure = (error: unknown) => {
  const syncError = toProjectSyncError(error)
  setStatus(
    syncError.kind === SyncFailureKind.Conflict ? SyncStatus.Conflict : SyncStatus.Error,
    syncError.message,
  )
  return syncError
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
  void flushProjectSync().catch(() => undefined)
}

export const stopProjectSync = () => {
  activeClient = null
  activeUserId = null
  statusListener = null
  clearUploadedImagePaths()
  knownServerRevisions.clear()
}

const blobKey = (userId: string, projectId: string, frameId: string, contentHash: string) =>
  `${userId}/${projectId}/${frameId}/${contentHash}`

export const queueWorkspaceSave = async (
  userId: string,
  workspace: Workspace,
): Promise<Record<string, WorkspaceImageMeta>> => {
  if (workspace.kind !== 'project' || workspace.id === null || workspace.name === null) {
    return {}
  }

  const projectId = workspace.id
  const clientUpdatedAt = new Date().toISOString()
  const frameImages: Record<string, WorkspaceImageMeta> = {}
  const frames: QueuedSnapshotFrame[] = []

  for (const frame of workspace.frames) {
    const queued = await prepareFrameSnapshot(userId, projectId, frame)
    frameImages[frame.id] = queued.image
    frames.push(queued.payload)
  }

  const pending = (await listQueueForUser(userId)).filter(
    (item): item is QueuedProjectSnapshotWrite =>
      item.projectId === projectId && item.kind === 'save-project-snapshot',
  )
  const expectedRevision =
    pending.at(-1)?.payload.revision ??
    knownServerRevisions.get(`${userId}/${projectId}`) ??
    workspace.syncedRevision

  await enqueueWrite({
    id: crypto.randomUUID(),
    userId,
    projectId,
    kind: 'save-project-snapshot',
    createdAt: clientUpdatedAt,
    payload: {
      expectedRevision,
      name: workspace.name,
      revision: workspace.revision,
      globalSettings: { ...workspace.globalSettings },
      clientUpdatedAt,
      frames,
    },
  })

  return frameImages
}

export interface SyncedWorkspaceRevision {
  revision: number
  frameImages: Record<string, WorkspaceImageMeta>
}

export const syncWorkspace = async (
  userId: string,
  workspace: Workspace,
  onQueued?: (queued: SyncedWorkspaceRevision) => void,
): Promise<SyncedWorkspaceRevision> => {
  let frameImages: Record<string, WorkspaceImageMeta>
  try {
    frameImages = await queueWorkspaceSave(userId, workspace)
  } catch (error) {
    throw reportSyncFailure(error)
  }

  const queued = { revision: workspace.revision, frameImages }
  onQueued?.(queued)
  await flushProjectSync()
  return queued
}

const prepareFrameSnapshot = async (
  userId: string,
  projectId: string,
  frame: WorkspaceFrame,
): Promise<{
  image: WorkspaceImageMeta
  payload: QueuedSnapshotFrame
}> => {
  const contentHash = frame.image?.contentHash ?? (await hashBlob(frame.file))
  const key = blobKey(userId, projectId, frame.id, contentHash)
  await putBlob(userId, key, frame.file)
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

  return {
    image,
    payload: {
      id: frame.id,
      frameOrder: frame.order,
      settings: { ...frame.settings },
      imagePath,
      imageContentType: 'image/webp',
      imageByteSize: frame.file.size,
      imageWidth: frame.image?.width,
      imageHeight: frame.image?.height,
      imageContentHash: contentHash,
      blobKey: key,
      needsImageUpload: !frame.image?.storagePath && !hasUploadedPath(userId, imagePath),
    },
  }
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
  const flush = flushChain.then(async () => {
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
        if (item.kind === 'save-project-snapshot') {
          knownServerRevisions.set(`${item.userId}/${item.projectId}`, item.payload.revision)
        }
        await dequeueWrite(item.id)
      }
      if ((await listQueueForUser(userId)).length === 0) {
        setStatus(SyncStatus.Synced)
      }
    } catch (error) {
      throw reportSyncFailure(error)
    }
  })

  flushChain = flush.catch(() => undefined)
  return flush
}

export const retryProjectSync = (): Promise<void> => flushProjectSync()

export { listProjects }
export { hydrateProjectWorkspace } from './hydrateProjectWorkspace'
