import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEmptySketch, type Workspace } from '../../workspace/types'
import { buildProjectImagePath } from '../supabase/schema'
import * as gateway from './projectGateway'
import {
  flushProjectSync,
  queueProjectDelete,
  queueWorkspaceSave,
  startProjectSync,
  stopProjectSync,
  SyncStatus,
} from './projectSync'

vi.mock('./contentHash', () => ({
  hashBlob: vi.fn(async () => 'abc123'),
}))

vi.mock('./projectGateway', () => ({
  upsertProject: vi.fn(async () => ({ id: 'p1' })),
  upsertFrame: vi.fn(async () => ({ id: 'f1' })),
  uploadProjectImage: vi.fn(async () => 'created'),
  deleteProjectImage: vi.fn(async () => undefined),
  deleteProjectImages: vi.fn(async () => undefined),
  sweepFrameImages: vi.fn(async () => undefined),
  deleteFrame: vi.fn(async () => undefined),
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
    deleteBlob: vi.fn(async (key: string) => {
      blobs.delete(key)
    }),
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
  afterEach(async () => {
    stopProjectSync()
    vi.clearAllMocks()
    const idb = await import('./idb')
    ;(idb as unknown as { clearTestState: () => void }).clearTestState()
  })

  it('does not queue unnamed sketches', async () => {
    const idb = await import('./idb')
    await queueWorkspaceSave('user-1', createEmptySketch())
    expect(idb.enqueueWrite).not.toHaveBeenCalled()
  })

  it('queues project metadata and frames for authenticated saves', async () => {
    const idb = await import('./idb')
    await queueWorkspaceSave(USER_ID, createProjectWorkspace())

    expect(idb.enqueueWrite).toHaveBeenCalled()
    expect(idb.putBlob).toHaveBeenCalled()
  })

  it('queues deletes for removed frames before upserts', async () => {
    const idb = await import('./idb')
    const workspace: Workspace = {
      ...createEmptySketch(),
      kind: 'project',
      id: PROJECT_ID,
      name: 'Launch',
      ownerId: USER_ID,
      revision: 3,
      frames: [],
    }

    await queueWorkspaceSave(USER_ID, workspace, [
      {
        id: FRAME_ID,
        imagePath: 'user/project/frame/hash.webp',
      },
    ])

    expect(idb.enqueueWrite).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'delete-frame',
        payload: expect.objectContaining({
          frameId: FRAME_ID,
        }),
      }),
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

    expect(gateway.upsertProject).toHaveBeenCalled()
    expect(gateway.uploadProjectImage).toHaveBeenCalled()
    expect(gateway.upsertFrame).toHaveBeenCalled()
    expect(idb.dequeueWrite).toHaveBeenCalled()
    expect(statuses).toContain(SyncStatus.Synced)
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
    expect(gateway.upsertFrame).toHaveBeenCalled()
    expect(gateway.deleteProjectImage).not.toHaveBeenCalled()
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
    expect(gateway.upsertFrame).toHaveBeenCalledTimes(2)
  })

  it('sweeps unused frame images after a successful upsert', async () => {
    await queueWorkspaceSave(USER_ID, createProjectWorkspace())

    startProjectSync({} as never, USER_ID)
    await waitForFlush()

    expect(gateway.sweepFrameImages).toHaveBeenCalledWith(
      expect.anything(),
      USER_ID,
      PROJECT_ID,
      FRAME_ID,
      IMAGE_PATH,
    )
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
})
