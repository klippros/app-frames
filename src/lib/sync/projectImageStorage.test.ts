import { describe, expect, it, vi } from 'vitest'
import { deleteUnreferencedProjectImages } from './projectImageStorage'

describe('deleteUnreferencedProjectImages', () => {
  it('never removes an object referenced by committed metadata', async () => {
    const keep = 'user/project/frame/keep.webp'
    const remove = 'user/project/frame/orphan.webp'
    const removeObjects = vi.fn(async () => ({ error: null }))
    const client = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: [{ image_path: keep }], error: null })),
        })),
      })),
      storage: {
        from: vi.fn(() => ({ remove: removeObjects })),
      },
    }

    await expect(
      deleteUnreferencedProjectImages(client as never, 'project', [keep, remove]),
    ).resolves.toEqual([remove])
    expect(removeObjects).toHaveBeenCalledWith([remove])
  })
})
