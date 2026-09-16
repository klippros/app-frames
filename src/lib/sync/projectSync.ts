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
let syncGeneration = 0
const knownServerRevisions = new Map<string, number>()

const setStatus = (status: SyncStatus, message?: string) => {
  statusListener?.(status, message)
}

const isCurrentSession = (
  client: SupabaseClient | null,
  userId: string,
  generation: number,
): boolean => activeClient === client && activeUserId === userId && syncGeneration === generation

const reportSyncFailure = (error: unknown, generation?: number) => {
  const syncError = toProjectSyncError(error)
  if (generation === undefined || generation === syncGeneration) {
    setStatus(
      syncError.kind === SyncFailureKind.Conflict ? SyncStatus.Conflict : SyncStatus.Error,
      syncError.message,
    )
  }
  return syncError
}

export const startProjectSync = (
  client: SupabaseClient,
  userId: string,
  onStatus?: StatusListener,
) => {
  syncGeneration += 1
  ensureUploadedPathsUser(userId)
  activeClient = client
  activeUserId = userId
  statusListener = onStatus ?? null
  void flushProjectSync().catch(() => undefined)
}

export const stopProjectSync = () => {
  syncGeneration += 1
  activeClient = null
  activeUserId = null
  statusListener = null
  clearUploadedImagePaths()
  knownServerRevisions.clear()
}

export const getProjectSyncGeneration = (userId: string): number | null =>
  activeUserId === userId && activeClient !== null ? syncGeneration : null

const assertCurrentGeneration = (userId: string, generation?: number) => {
  if (generation !== undefined && getProjectSyncGeneration(userId) !== generation) {
    throw new Error('The authenticated session changed before the project could be saved.')
  }
}

const blobKey = (userId: string, projectId: string, frameId: string, contentHash: string) =>
  `${userId}/${projectId}/${frameId}/${contentHash}`

export const queueWorkspaceSave = async (
  userId: string,
  workspace: Workspace,
  generation?: number,
): Promise<Record<string, WorkspaceImageMeta>> => {
  assertCurrentGeneration(userId, generation)
  if (workspace.kind !== 'project' || workspace.id === null || workspace.name === null) {
    return {}
  }
  if (workspace.ownerId !== userId) {
    throw new Error('The project does not belong to the authenticated user.')
  }

  const projectId = workspace.id
  const clientUpdatedAt = new Date().toISOString()
  const frameImages: Record<string, WorkspaceImageMeta> = {}
  const frames: QueuedSnapshotFrame[] = []

  for (const frame of workspace.frames) {
    const queued = await prepareFrameSnapshot(userId, projectId, frame, generation)
    frameImages[frame.id] = queued.image
    frames.push(queued.payload)
  }

  assertCurrentGeneration(userId, generation)
  const pending = (await listQueueForUser(userId)).filter(
    (item): item is QueuedProjectSnapshotWrite =>
      item.projectId === projectId && item.kind === 'save-project-snapshot',
  )
  const expectedRevision =
    pending.at(-1)?.payload.revision ??
    knownServerRevisions.get(`${userId}/${projectId}`) ??
    workspace.syncedRevision

  assertCurrentGeneration(userId, generation)
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
  generation?: number,
): Promise<SyncedWorkspaceRevision> => {
  let frameImages: Record<string, WorkspaceImageMeta>
  try {
    frameImages = await queueWorkspaceSave(userId, workspace, generation)
  } catch (error) {
    throw reportSyncFailure(error, generation)
  }

  assertCurrentGeneration(userId, generation)
  const queued = { revision: workspace.revision, frameImages }
  onQueued?.(queued)
  await flushProjectSync()
  return queued
}

const prepareFrameSnapshot = async (
  userId: string,
  projectId: string,
  frame: WorkspaceFrame,
  generation?: number,
): Promise<{
  image: WorkspaceImageMeta
  payload: QueuedSnapshotFrame
}> => {
  const contentHash = frame.image?.contentHash ?? (await hashBlob(frame.file))
  assertCurrentGeneration(userId, generation)
  const key = blobKey(userId, projectId, frame.id, contentHash)
  await putBlob(userId, key, frame.file)
  assertCurrentGeneration(userId, generation)
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
  const client = activeClient
  const userId = activeUserId
  const generation = syncGeneration
  const listener = statusListener

  const flush = flushChain.then(async () => {
    if (client === null || userId === null) {
      return
    }
    if (!isCurrentSession(client, userId, generation)) {
      return
    }

    const items = await listQueueForUser(userId)
    if (!isCurrentSession(client, userId, generation)) {
      return
    }
    if (items.length === 0) {
      listener?.(SyncStatus.Synced)
      return
    }

    listener?.(SyncStatus.Syncing)
    try {
      for (const item of items) {
        if (!isCurrentSession(client, userId, generation)) {
          return
        }
        await processQueuedWrite(client, item)
        if (!isCurrentSession(client, userId, generation)) {
          return
        }
        if (item.kind === 'save-project-snapshot') {
          knownServerRevisions.set(`${item.userId}/${item.projectId}`, item.payload.revision)
        }
        await dequeueWrite(item.id)
      }
      if (
        isCurrentSession(client, userId, generation) &&
        (await listQueueForUser(userId)).length === 0
      ) {
        listener?.(SyncStatus.Synced)
      }
    } catch (error) {
      if (!isCurrentSession(client, userId, generation)) {
        return
      }
      throw reportSyncFailure(error, generation)
    }
  })

  flushChain = flush.catch(() => undefined)
  return flush
}

export const retryProjectSync = (): Promise<void> => flushProjectSync()

export { listProjects }
export { hydrateProjectWorkspace } from './hydrateProjectWorkspace'
