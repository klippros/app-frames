/* oxlint-disable max-lines -- Sync queue mocks are intentionally shared across regression cases. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptySketch, type Workspace } from '../../workspace/types'
import { buildProjectImagePath } from '../supabase/schema'
import * as gateway from './projectGateway'
import {
  flushProjectSync,
  getProjectSyncGeneration,
  ProjectSyncError,
  queueProjectDelete,
  queueWorkspaceSave,
  startProjectSync,
  stopProjectSync,
  SyncFailureKind,
  SyncStatus,
  syncWorkspace,
} from './projectSync'

vi.mock('./contentHash', () => ({
  hashBlob: vi.fn(async () => 'abc123'),
}))

vi.mock('./projectGateway', () => ({
  saveProjectSnapshot: vi.fn(async (input: { revision: number }) => input.revision),
  uploadProjectImage: vi.fn(async () => 'created'),
  deleteUnreferencedProjectImages: vi.fn(
    async (_client: unknown, _projectId: string, paths: string[]) => paths,
  ),
  deleteProjectImages: vi.fn(async () => undefined),
  sweepProjectImages: vi.fn(async () => undefined),
  deleteProject: vi.fn(async () => undefined),
  downloadProjectImage: vi.fn(),
  getProjectWithFrames: vi.fn(),
  listProjects: vi.fn(async () => []),
  countProjects: vi.fn(async () => 0),
}))

vi.mock('./idb', () => {
  const queue: Array<Record<string, unknown>> = []
  const blobs = new Map<string, Blob>()

  return {
    enqueueWrite: vi.fn(async (item: Record<string, unknown>) => {
      queue.push(item)
    }),
    listQueueForUser: vi.fn(async (userId: string) =>
      queue.filter((item) => item.userId === userId),
    ),
    dequeueWrite: vi.fn(async (id: string) => {
      const index = queue.findIndex((item) => item.id === id)
      if (index >= 0) {
        queue.splice(index, 1)
      }
    }),
    putBlob: vi.fn(async (_userId: string, key: string, blob: Blob) => {
      blobs.set(key, blob)
    }),
    getBlob: vi.fn(async (key: string) => blobs.get(key)),
    deleteBlobsByProjectPrefix: vi.fn(async (userId: string, projectId: string) => {
      const prefix = `${userId}/${projectId}`
      for (const key of [...blobs.keys()]) {
        if (key === prefix || key.startsWith(`${prefix}/`)) {
          blobs.delete(key)
        }
      }
    }),
    __queue: queue,
    __blobs: blobs,
    getTestQueue: () => queue,
    clearTestState: () => {
      queue.length = 0
      blobs.clear()
    },
  }
})

const USER_ID = '11111111-1111-1111-1111-111111111111'
const PROJECT_ID = '22222222-2222-2222-2222-222222222222'
const FRAME_ID = '33333333-3333-3333-3333-333333333333'
const IMAGE_PATH = buildProjectImagePath(USER_ID, PROJECT_ID, FRAME_ID, 'abc123')

const waitForFlush = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 20)
  })

const startAndSettleInitialFlush = async (
  onStatus?: (status: SyncStatus, message?: string) => void,
) => {
  startProjectSync({} as never, USER_ID, onStatus)
  await waitForFlush()
}

const createProjectWorkspace = (frameImage?: Workspace['frames'][number]['image']): Workspace => {
  const file = new File([new Uint8Array([1, 2, 3])], 'frame.webp', { type: 'image/webp' })
  return {
    ...createEmptySketch(),
    kind: 'project',
    id: PROJECT_ID,
    name: 'Launch',
    ownerId: USER_ID,
    revision: 2,
    frames: [
      {
        id: FRAME_ID,
        order: 0,
        settings: { version: 1, title: 'Hello', titlePosition: 'top' },
        file,
        url: 'blob:test',
        image: frameImage,
      },
    ],
  }
}

describe('projectSync', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { onLine: true })
  })

  afterEach(async () => {
    stopProjectSync()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    const idb = await import('./idb')
    ;(idb as unknown as { clearTestState: () => void }).clearTestState()
  })

  it('does not queue unnamed sketches', async () => {
    const idb = await import('./idb')
    await queueWorkspaceSave('user-1', createEmptySketch())
    expect(idb.enqueueWrite).not.toHaveBeenCalled()
  })

  it('queues one complete snapshot for authenticated saves', async () => {
    const idb = await import('./idb')
    await queueWorkspaceSave(USER_ID, createProjectWorkspace())

    expect(idb.enqueueWrite).toHaveBeenCalledTimes(1)
    expect(idb.enqueueWrite).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'save-project-snapshot',
        payload: expect.objectContaining({
          expectedRevision: null,
          revision: 2,
          frames: [
            expect.objectContaining({
              id: FRAME_ID,
              frameOrder: 0,
              imagePath: IMAGE_PATH,
            }),
          ],
        }),
      }),
    )
    expect(idb.putBlob).toHaveBeenCalled()
  })

  it('represents frame deletion by omission from the next snapshot', async () => {
    const idb = await import('./idb')
    await queueWorkspaceSave(USER_ID, createProjectWorkspace())
    const workspace: Workspace = {
      ...createEmptySketch(),
      kind: 'project',
      id: PROJECT_ID,
      name: 'Launch',
      ownerId: USER_ID,
      revision: 3,
      frames: [],
    }

    await queueWorkspaceSave(USER_ID, workspace)

    expect(idb.enqueueWrite).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'save-project-snapshot',
        payload: expect.objectContaining({
          expectedRevision: 2,
          revision: 3,
          frames: [],
        }),
      }),
    )
  })

  it('queues frame swaps with their final unique ordering', async () => {
    const idb = await import('./idb')
    const secondId = '44444444-4444-4444-4444-444444444444'
    const workspace = createProjectWorkspace()
    const first = workspace.frames[0]
    workspace.frames = [
      {
        ...first,
        id: secondId,
        order: 0,
        file: new File([new Uint8Array([4])], 'second.webp', { type: 'image/webp' }),
      },
      { ...first, order: 1 },
    ]

    await queueWorkspaceSave(USER_ID, workspace)

    const queue = (
      idb as unknown as {
        getTestQueue: () => Array<{
          payload: { frames: Array<{ id: string; frameOrder: number }> }
        }>
      }
    ).getTestQueue()
    expect(queue[0]?.payload.frames.map(({ id, frameOrder }) => [id, frameOrder])).toEqual([
      [secondId, 0],
      [FRAME_ID, 1],
    ])
  })

  it('serializes concurrent local saves with chained expected revisions', async () => {
    const first = createProjectWorkspace()
    const second = {
      ...first,
      revision: 3,
      globalSettings: { ...first.globalSettings, showBezel: false },
    }
    await queueWorkspaceSave(USER_ID, first)
    await queueWorkspaceSave(USER_ID, second)

    startProjectSync({} as never, USER_ID)
    await waitForFlush()

    const snapshots = vi.mocked(gateway.saveProjectSnapshot).mock.calls.map((call) => call[1])
    expect(snapshots.map(({ expectedRevision, revision }) => [expectedRevision, revision])).toEqual(
      [
        [null, 2],
        [2, 3],
      ],
    )
  })

  it('replays each queued snapshot with its own immutable image blob', async () => {
    const first = createProjectWorkspace()
    const second = createProjectWorkspace()
    second.revision = 3
    second.frames[0] = {
      ...second.frames[0],
      file: new File([new Uint8Array([9])], 'replacement.webp', { type: 'image/webp' }),
      image: {
        contentType: 'image/webp',
        byteSize: 1,
        contentHash: 'def456',
      },
    }
    await queueWorkspaceSave(USER_ID, first)
    await queueWorkspaceSave(USER_ID, second)

    startProjectSync({} as never, USER_ID)
    await waitForFlush()

    expect(
      vi.mocked(gateway.uploadProjectImage).mock.calls.map(([, path, blob]) => [path, blob.size]),
    ).toEqual([
      [IMAGE_PATH, 3],
      [buildProjectImagePath(USER_ID, PROJECT_ID, FRAME_ID, 'def456'), 1],
    ])
  })

  it('compensates created objects when a later upload fails before the RPC', async () => {
    const secondId = '44444444-4444-4444-4444-444444444444'
    const workspace = createProjectWorkspace()
    workspace.frames.push({
      ...workspace.frames[0],
      id: secondId,
      order: 1,
      file: new File([new Uint8Array([4])], 'second.webp', { type: 'image/webp' }),
    })
    vi.mocked(gateway.uploadProjectImage)
      .mockResolvedValueOnce('created')
      .mockRejectedValueOnce(new Error('second upload failed'))
    await startAndSettleInitialFlush()
    await queueWorkspaceSave(USER_ID, workspace)

    await expect(flushProjectSync()).rejects.toMatchObject({
      kind: SyncFailureKind.Error,
    })

    expect(gateway.saveProjectSnapshot).not.toHaveBeenCalled()
    expect(gateway.deleteUnreferencedProjectImages).toHaveBeenCalledWith(
      expect.anything(),
      PROJECT_ID,
      [IMAGE_PATH],
    )
  })

  it('flushes queued writes through the gateway and dequeues on success', async () => {
    const idb = await import('./idb')
    await queueWorkspaceSave(USER_ID, createProjectWorkspace())

    const statuses: SyncStatus[] = []
    startProjectSync({} as never, USER_ID, (status) => {
      statuses.push(status)
    })

    await waitForFlush()

    expect(gateway.uploadProjectImage).toHaveBeenCalled()
    expect(gateway.saveProjectSnapshot).toHaveBeenCalledTimes(1)
    expect(idb.dequeueWrite).toHaveBeenCalled()
    expect(statuses).toContain(SyncStatus.Synced)
  })

  it('only completes a snapshot after its queued RPC succeeds', async () => {
    const idb = await import('./idb')
    const statuses: Array<{ status: SyncStatus; message?: string }> = []
    const onCompletion = vi.fn()
    startProjectSync(
      {} as never,
      USER_ID,
      (status, message) => {
        statuses.push({ status, message })
      },
      (completion) => {
        onCompletion(completion)
      },
    )
    await waitForFlush()
    vi.mocked(gateway.saveProjectSnapshot).mockRejectedValueOnce(new Error('database unavailable'))

    await expect(syncWorkspace(USER_ID, createProjectWorkspace())).rejects.toMatchObject({
      kind: SyncFailureKind.Error,
      message: 'database unavailable',
    })

    const queue = (idb as unknown as { getTestQueue: () => Array<{ kind: string }> }).getTestQueue()
    expect(onCompletion).not.toHaveBeenCalled()
    expect(queue.map((item) => item.kind)).toEqual(['save-project-snapshot'])
    expect(statuses.at(-1)).toEqual({
      status: SyncStatus.Error,
      message: 'database unavailable',
    })

    await expect(flushProjectSync()).resolves.toBeUndefined()
    expect(queue).toHaveLength(0)
    expect(onCompletion).toHaveBeenCalledOnce()
    expect(onCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJECT_ID,
        revision: 2,
        frameImages: {
          [FRAME_ID]: expect.objectContaining({ storagePath: IMAGE_PATH }),
        },
      }),
    )
    expect(statuses.at(-1)?.status).toBe(SyncStatus.Synced)
  })

  it('compensates an RPC failure and retries the same snapshot idempotently', async () => {
    const idb = await import('./idb')
    await startAndSettleInitialFlush()
    await queueWorkspaceSave(USER_ID, createProjectWorkspace())
    vi.mocked(gateway.saveProjectSnapshot).mockRejectedValueOnce(
      new Error('metadata response was lost'),
    )

    await expect(flushProjectSync()).rejects.toBeInstanceOf(ProjectSyncError)

    const queue = (
      idb as unknown as {
        getTestQueue: () => Array<{ id: string; kind: string }>
      }
    ).getTestQueue()
    const snapshotId = queue[0]?.id
    expect(queue.map((item) => item.kind)).toEqual(['save-project-snapshot'])
    expect(gateway.deleteUnreferencedProjectImages).toHaveBeenCalledWith(
      expect.anything(),
      PROJECT_ID,
      [IMAGE_PATH],
    )

    await expect(flushProjectSync()).resolves.toBeUndefined()
    expect(queue).toHaveLength(0)
    expect(gateway.uploadProjectImage).toHaveBeenCalledTimes(2)
    expect(gateway.saveProjectSnapshot).toHaveBeenCalledTimes(2)
    expect(vi.mocked(gateway.saveProjectSnapshot).mock.calls[0]?.[1].snapshotId).toBe(snapshotId)
    expect(vi.mocked(gateway.saveProjectSnapshot).mock.calls[1]?.[1].snapshotId).toBe(snapshotId)
  })

  it('reports a stale-revision conflict and retains the snapshot', async () => {
    const idb = await import('./idb')
    await startAndSettleInitialFlush()
    await queueWorkspaceSave(USER_ID, createProjectWorkspace())
    vi.mocked(gateway.saveProjectSnapshot).mockRejectedValueOnce(
      new ProjectSyncError(SyncFailureKind.Conflict, 'revision conflict'),
    )

    await expect(flushProjectSync()).rejects.toMatchObject({
      kind: SyncFailureKind.Conflict,
    })
    expect((idb as unknown as { getTestQueue: () => unknown[] }).getTestQueue()).toHaveLength(1)
  })

  it('classifies timeout failures while retaining the queued write', async () => {
    const idb = await import('./idb')
    await startAndSettleInitialFlush()
    await queueWorkspaceSave(USER_ID, createProjectWorkspace())
    vi.mocked(gateway.saveProjectSnapshot).mockRejectedValueOnce(new Error('request timed out'))

    await expect(flushProjectSync()).rejects.toMatchObject({
      kind: SyncFailureKind.Timeout,
      message: 'Sync timed out — changes remain queued.',
    })

    const queue = (idb as unknown as { getTestQueue: () => unknown[] }).getTestQueue()
    expect(queue).toHaveLength(1)
  })

  it('classifies offline failures while retaining the queued write', async () => {
    const idb = await import('./idb')
    await startAndSettleInitialFlush()
    await queueWorkspaceSave(USER_ID, createProjectWorkspace())
    vi.stubGlobal('navigator', { onLine: false })
    vi.mocked(gateway.saveProjectSnapshot).mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(flushProjectSync()).rejects.toMatchObject({
      kind: SyncFailureKind.Offline,
      message: 'Offline — changes remain saved on this device.',
    })

    const queue = (idb as unknown as { getTestQueue: () => unknown[] }).getTestQueue()
    expect(queue).toHaveLength(1)
  })

  it('skips image upload when the frame is already stored at the content-hash path', async () => {
    await queueWorkspaceSave(
      USER_ID,
      createProjectWorkspace({
        contentType: 'image/webp',
        byteSize: 3,
        contentHash: 'abc123',
        storagePath: IMAGE_PATH,
      }),
    )

    startProjectSync({} as never, USER_ID)

    await waitForFlush()

    expect(gateway.uploadProjectImage).not.toHaveBeenCalled()
    expect(gateway.saveProjectSnapshot).toHaveBeenCalled()
  })

  it('does not re-upload the same image on a later save in the same session', async () => {
    const workspace = createProjectWorkspace()
    await queueWorkspaceSave(USER_ID, workspace)

    startProjectSync({} as never, USER_ID)
    await waitForFlush()

    expect(gateway.uploadProjectImage).toHaveBeenCalledTimes(1)

    await queueWorkspaceSave(USER_ID, workspace)
    await flushProjectSync()
    await waitForFlush()

    expect(gateway.uploadProjectImage).toHaveBeenCalledTimes(1)
    expect(gateway.saveProjectSnapshot).toHaveBeenCalledTimes(2)
  })

  it('sweeps unused project images after a successful snapshot', async () => {
    await queueWorkspaceSave(USER_ID, createProjectWorkspace())

    startProjectSync({} as never, USER_ID)
    await waitForFlush()

    expect(gateway.sweepProjectImages).toHaveBeenCalledWith(expect.anything(), USER_ID, PROJECT_ID)
  })

  it('queues project deletes and removes storage under the project prefix', async () => {
    const idb = await import('./idb')
    await queueWorkspaceSave(USER_ID, createProjectWorkspace())
    await queueProjectDelete(USER_ID, PROJECT_ID)

    expect(idb.deleteBlobsByProjectPrefix).toHaveBeenCalledWith(USER_ID, PROJECT_ID)
    expect(idb.enqueueWrite).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'delete-project',
        payload: expect.objectContaining({ projectId: PROJECT_ID }),
      }),
    )

    startProjectSync({} as never, USER_ID)
    await waitForFlush()

    expect(gateway.deleteProject).toHaveBeenCalledWith(expect.anything(), PROJECT_ID)
    expect(gateway.deleteProjectImages).toHaveBeenCalledWith(expect.anything(), USER_ID, PROJECT_ID)
  })

  it('keeps a failed project delete queued until an idempotent retry succeeds', async () => {
    const idb = await import('./idb')
    await startAndSettleInitialFlush()
    await queueProjectDelete(USER_ID, PROJECT_ID)
    vi.mocked(gateway.deleteProject).mockRejectedValueOnce(new Error('delete failed'))

    await expect(flushProjectSync()).rejects.toMatchObject({
      kind: SyncFailureKind.Error,
    })

    const queue = (idb as unknown as { getTestQueue: () => Array<{ kind: string }> }).getTestQueue()
    expect(queue.map((item) => item.kind)).toEqual(['delete-project'])

    await expect(flushProjectSync()).resolves.toBeUndefined()
    expect(queue).toHaveLength(0)
    expect(gateway.deleteProject).toHaveBeenCalledTimes(2)
  })

  it('fails closed when the account changes while preparing an old save', async () => {
    const idb = await import('./idb')
    await startAndSettleInitialFlush()
    vi.clearAllMocks()
    const generation = getProjectSyncGeneration(USER_ID)
    expect(generation).not.toBeNull()
    vi.mocked(idb.putBlob).mockImplementationOnce(async () => {
      stopProjectSync()
      startProjectSync({} as never, 'user-b')
    })

    await expect(
      syncWorkspace(USER_ID, createProjectWorkspace(), generation ?? undefined),
    ).rejects.toThrow('authenticated session changed')
    expect(idb.enqueueWrite).not.toHaveBeenCalled()
    expect(gateway.saveProjectSnapshot).not.toHaveBeenCalled()
  })
})
