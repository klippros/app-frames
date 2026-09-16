import { afterEach, describe, expect, it, vi } from 'vitest'
import type * as NormalizeImageModule from './normalizeImage'
import { ingestImageFiles } from './ingestImages'

vi.mock('./normalizeImage', async () => {
  const actual = await vi.importActual<typeof NormalizeImageModule>('./normalizeImage')
  return {
    ...actual,
    normalizeImageFile: vi.fn(async (file: File) => ({
      file: new File([file], file.name.replace(/\.\w+$/u, '.webp'), { type: 'image/webp' }),
      width: 100,
      height: 200,
      contentType: 'image/webp' as const,
      byteSize: 10,
      wasResized: false,
    })),
  }
})

vi.mock('./frameTitle', () => ({
  createScreenshot: vi.fn((file: File, index: number) => ({
    id: `shot-${index}`,
    file,
    url: `blob:${index}`,
    title: `Frame ${index + 1}`,
    titlePosition: index % 2 === 0 ? 'top' : 'bottom',
  })),
}))

describe('ingestImageFiles', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('accepts files up to the remaining frame slots', async () => {
    const files = Array.from({ length: 3 }, (_, index) => new File(['x'], `a${index}.png`))

    const result = await ingestImageFiles(files, 8, 10)

    expect(result.screenshots).toHaveLength(2)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.message).toContain('Only 2 more frames')
  })

  it('rejects all files when already at the frame limit', async () => {
    const files = [new File(['x'], 'extra.png')]

    const result = await ingestImageFiles(files, 10, 10)

    expect(result.screenshots).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.message).toContain('at most 10 frames')
  })
})
