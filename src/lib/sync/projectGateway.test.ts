import { describe, expect, it, vi } from 'vitest'
import { saveProjectSnapshot, type SaveProjectSnapshotInput } from './projectGateway'
import { SyncFailureKind } from './syncErrors'

const input: SaveProjectSnapshotInput = {
  projectId: '22222222-2222-2222-2222-222222222222',
  expectedRevision: 4,
  snapshotId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Launch',
  revision: 5,
  globalSettings: { version: 1 },
  clientUpdatedAt: '2026-09-16T10:00:00.000Z',
  frames: [
    {
      id: '33333333-3333-3333-3333-333333333333',
      frameOrder: 0,
      settings: { version: 1 },
      imagePath: 'user/project/frame/hash.webp',
      imageContentType: 'image/webp',
      imageByteSize: 3,
      imageContentHash: 'hash',
    },
  ],
}

describe('saveProjectSnapshot', () => {
  it('sends the complete metadata snapshot to one RPC', async () => {
    const rpc = vi.fn(async () => ({
      data: [{ result_code: 'applied', server_revision: 5 }],
      error: null,
    }))

    await expect(saveProjectSnapshot({ rpc } as never, input)).resolves.toBe(5)
    expect(rpc).toHaveBeenCalledWith(
      'save_project_snapshot',
      expect.objectContaining({
        p_expected_revision: 4,
        p_snapshot_id: input.snapshotId,
        p_frames: [
          expect.objectContaining({
            id: input.frames[0]?.id,
            frame_order: 0,
            image_path: input.frames[0]?.imagePath,
          }),
        ],
      }),
    )
  })

  it('maps the stable RPC conflict result to a sync conflict', async () => {
    const rpc = vi.fn(async () => ({
      data: [{ result_code: 'revision_conflict', server_revision: 6 }],
      error: null,
    }))

    await expect(saveProjectSnapshot({ rpc } as never, input)).rejects.toMatchObject({
      kind: SyncFailureKind.Conflict,
    })
  })
})
