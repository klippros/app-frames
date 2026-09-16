/* oxlint-disable typescript/unbound-method -- URL spy assertions intentionally reference platform methods. */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectFrameRow, ProjectRow } from '../supabase/schema'
import { hydrateProjectWorkspace } from './hydrateProjectWorkspace'
import { downloadProjectImage, getProjectWithFrames } from './projectGateway'
import { getBlob, putBlob } from './idb'

vi.mock('./projectGateway', () => ({
  downloadProjectImage: vi.fn(),
  getProjectWithFrames: vi.fn(),
}))

vi.mock('./idb', () => ({
  getBlob: vi.fn(),
  putBlob: vi.fn(),
}))

const USER_ID = 'user-a'
const PROJECT_ID = 'project-a'
const project: ProjectRow = {
  id: PROJECT_ID,
  user_id: USER_ID,
  name: 'Launch',
  revision: 2,
  global_settings: {
    version: 1,
    platform: 'ios',
    gradientBaseColor: '#000000',
    showBezel: true,
  },
  created_at: '2026-09-16T10:00:00.000Z',
  updated_at: '2026-09-16T10:00:00.000Z',
  client_updated_at: '2026-09-16T10:00:00.000Z',
  last_snapshot_id: null,
}

const frame = (id: string): ProjectFrameRow => ({
  id,
  project_id: PROJECT_ID,
  user_id: USER_ID,
  frame_order: Number(id.at(-1)) - 1,
  settings: { version: 1, title: id, titlePosition: 'top' },
  image_path: `${USER_ID}/${PROJECT_ID}/${id}/image.webp`,
  image_content_type: 'image/webp',
  image_byte_size: 1,
  image_width: null,
  image_height: null,
  image_content_hash: null,
  created_at: '2026-09-16T10:00:00.000Z',
  updated_at: '2026-09-16T10:00:00.000Z',
})

describe('hydrateProjectWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(URL, 'createObjectURL')
      .mockReturnValueOnce('blob:frame-1')
      .mockReturnValueOnce('blob:frame-2')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    vi.mocked(getBlob).mockResolvedValue(undefined)
    vi.mocked(putBlob).mockResolvedValue(undefined)
  })

  it('fails the whole open and revokes partial URLs when an image download fails', async () => {
    vi.mocked(getProjectWithFrames).mockResolvedValue({
      project,
      frames: [frame('frame-1'), frame('frame-2')],
    })
    vi.mocked(downloadProjectImage)
      .mockResolvedValueOnce(new Blob(['a'], { type: 'image/webp' }))
      .mockRejectedValueOnce(new Error('private object unavailable'))

    await expect(hydrateProjectWorkspace({} as never, USER_ID, PROJECT_ID)).rejects.toThrow(
      'one or more images failed to load',
    )
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:frame-1')
  })
})
