import type { SupabaseClient } from '@supabase/supabase-js'
import type { Workspace, WorkspaceFrame } from '../../workspace/types'
import { buildProjectImagePath } from '../supabase/schema'
import { hashBlob } from './contentHash'
import {
  dequeueWrite,
  enqueueWrite,
  getBlob,
  listQueueForUser,
  putBlob,
  type QueuedProjectWrite,
} from './idb'
import {
  deleteFrame,
  deleteProject,
  deleteProjectImage,
  listProjects,
  uploadProjectImage,
  upsertFrame,
  upsertProject,
} from './projectGateway'

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
  activeClient = client
  activeUserId = userId
  statusListener = onStatus ?? null
  void flushProjectSync()
}

export const stopProjectSync = () => {
  activeClient = null
  activeUserId = null
  statusListener = null
}

const blobKey = (userId: string, projectId: string, frameId: string) =>
  `${userId}/${projectId}/${frameId}`

export const queueWorkspaceSave = async (userId: string, workspace: Workspace): Promise<void> => {
  if (workspace.kind !== 'project' || workspace.id === null || workspace.name === null) {
    return
  }

  const projectId = workspace.id
  const clientUpdatedAt = new Date().toISOString()

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
    await queueFrameSave(userId, projectId, frame)
  }
}

export const queueFrameSave = async (
  userId: string,
  projectId: string,
  frame: WorkspaceFrame,
): Promise<void> => {
  const key = blobKey(userId, projectId, frame.id)
  await putBlob(userId, key, frame.file)

  const contentHash = frame.image?.contentHash ?? (await hashBlob(frame.file))
  const imagePath =
    frame.image?.storagePath ?? buildProjectImagePath(userId, projectId, frame.id, contentHash)

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
    },
  })
}

export const queueFrameDelete = async (
  userId: string,
  projectId: string,
  frameId: string,
  imagePath?: string,
): Promise<void> => {
  await enqueueWrite({
    id: crypto.randomUUID(),
    userId,
    projectId,
    kind: 'delete-frame',
    createdAt: new Date().toISOString(),
    payload: { frameId, imagePath },
  })
}

const processItem = async (client: SupabaseClient, item: QueuedProjectWrite): Promise<void> => {
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
      const key = String(payload.blobKey)
      const blob = await getBlob(key)
      if (!blob) {
        throw new Error('Missing local blob for frame upload')
      }
      await uploadProjectImage(client, imagePath, blob)
      try {
        await upsertFrame(client, {
          id: String(payload.id),
          userId: item.userId,
          projectId: String(payload.projectId),
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
      } catch (error) {
        await deleteProjectImage(client, imagePath).catch(() => undefined)
        throw error
      }
      break
    }
    case 'delete-frame': {
      await deleteFrame(client, String(item.payload.frameId))
      if (typeof item.payload.imagePath === 'string' && item.payload.imagePath !== '') {
        await deleteProjectImage(client, item.payload.imagePath)
      }
      break
    }
    case 'delete-project': {
      await deleteProject(client, String(item.payload.projectId))
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
        await processItem(client, item)
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
