import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Workspace } from '../../workspace/types'
import { createEmptySketch } from '../../workspace/types'
import * as gateway from './projectGateway'
import { queueWorkspaceSave, startProjectSync, stopProjectSync, SyncStatus } from './projectSync'

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
    __queue: queue,
    __blobs: blobs,
  }
})

vi.mock('./contentHash', () => ({
  hashBlob: vi.fn(async () => 'abc123'),
}))

vi.mock('./projectGateway', () => ({
  upsertProject: vi.fn(async () => ({ id: 'p1' })),
  upsertFrame: vi.fn(async () => ({ id: 'f1' })),
  uploadProjectImage: vi.fn(async () => undefined),
  deleteProjectImage: vi.fn(async () => undefined),
  deleteFrame: vi.fn(async () => undefined),
  deleteProject: vi.fn(async () => undefined),
  downloadProjectImage: vi.fn(),
  getProjectWithFrames: vi.fn(),
  listProjects: vi.fn(async () => []),
}))

describe('projectSync', () => {
  afterEach(() => {
    stopProjectSync()
    vi.clearAllMocks()
  })

  it('does not queue unnamed sketches', async () => {
    const idb = await import('./idb')
    await queueWorkspaceSave('user-1', createEmptySketch())
    expect(idb.enqueueWrite).not.toHaveBeenCalled()
  })

  it('queues project metadata and frames for authenticated saves', async () => {
    const idb = await import('./idb')
    const file = new File([new Uint8Array([1, 2, 3])], 'frame.webp', { type: 'image/webp' })
    const workspace: Workspace = {
      ...createEmptySketch(),
      kind: 'project',
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Launch',
      ownerId: '11111111-1111-1111-1111-111111111111',
      revision: 2,
      frames: [
        {
          id: '33333333-3333-3333-3333-333333333333',
          order: 0,
          settings: { version: 1, title: 'Hello', titlePosition: 'top' },
          file,
          url: 'blob:test',
        },
      ],
    }

    await queueWorkspaceSave('11111111-1111-1111-1111-111111111111', workspace)

    expect(idb.enqueueWrite).toHaveBeenCalled()
    expect(idb.putBlob).toHaveBeenCalled()
  })

  it('queues deletes for removed frames before upserts', async () => {
    const idb = await import('./idb')
    const workspace: Workspace = {
      ...createEmptySketch(),
      kind: 'project',
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Launch',
      ownerId: '11111111-1111-1111-1111-111111111111',
      revision: 3,
      frames: [],
    }

    await queueWorkspaceSave('11111111-1111-1111-1111-111111111111', workspace, [
      {
        id: '33333333-3333-3333-3333-333333333333',
        imagePath: 'user/project/frame/hash.webp',
      },
    ])

    expect(idb.enqueueWrite).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'delete-frame',
        payload: expect.objectContaining({
          frameId: '33333333-3333-3333-3333-333333333333',
        }),
      }),
    )
  })

  it('flushes queued writes through the gateway and dequeues on success', async () => {
    const idb = await import('./idb')
    const file = new File([new Uint8Array([1, 2, 3])], 'frame.webp', { type: 'image/webp' })
    const workspace: Workspace = {
      ...createEmptySketch(),
      kind: 'project',
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Launch',
      ownerId: '11111111-1111-1111-1111-111111111111',
      revision: 1,
      frames: [
        {
          id: '33333333-3333-3333-3333-333333333333',
          order: 0,
          settings: { version: 1, title: 'Hello', titlePosition: 'top' },
          file,
          url: 'blob:test',
        },
      ],
    }

    await queueWorkspaceSave('11111111-1111-1111-1111-111111111111', workspace)

    const statuses: SyncStatus[] = []
    startProjectSync({} as never, '11111111-1111-1111-1111-111111111111', (status) => {
      statuses.push(status)
    })

    await new Promise((resolve) => {
      setTimeout(resolve, 20)
    })

    expect(gateway.upsertProject).toHaveBeenCalled()
    expect(gateway.uploadProjectImage).toHaveBeenCalled()
    expect(gateway.upsertFrame).toHaveBeenCalled()
    expect(idb.dequeueWrite).toHaveBeenCalled()
    expect(statuses).toContain(SyncStatus.Synced)
  })
})
