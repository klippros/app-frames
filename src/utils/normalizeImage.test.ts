// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computeScaledDimensions,
  isAcceptedImageType,
  MAX_IMAGE_WIDTH,
  MAX_OUTPUT_BYTES,
  MAX_SOURCE_BYTES,
  normalizeImageFile,
} from './normalizeImage'

const pngBytes = (...chunkTypes: string[]): Uint8Array => {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  const chunks: number[] = []
  for (const type of chunkTypes) {
    chunks.push(0, 0, 0, 0)
    chunks.push(...Array.from(type, (character) => character.charCodeAt(0)))
    chunks.push(0, 0, 0, 0)
  }
  return new Uint8Array([...signature, ...chunks])
}

const webpBytes = (chunks: Array<{ type: string; payload: number[] }>): Uint8Array => {
  const body = chunks.flatMap(({ type, payload }) => [
    ...Array.from(type, (character) => character.charCodeAt(0)),
    payload.length,
    0,
    0,
    0,
    ...payload,
    ...(payload.length % 2 === 0 ? [] : [0]),
  ])
  const riffSize = body.length + 4
  return new Uint8Array([
    ...Array.from('RIFF', (character) => character.charCodeAt(0)),
    riffSize,
    0,
    0,
    0,
    ...Array.from('WEBP', (character) => character.charCodeAt(0)),
    ...body,
  ])
}

const gifBytes = (frames: number): Uint8Array => {
  const image = [0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 1, 0, 0]
  return new Uint8Array([
    ...Array.from('GIF89a', (character) => character.charCodeAt(0)),
    1,
    0,
    1,
    0,
    0,
    0,
    0,
    ...Array.from({ length: frames }, () => image).flat(),
    0x3b,
  ])
}

const imageFile = (bytes: Uint8Array, name = 'source.png', type = 'image/png') =>
  new File([bytes.buffer as ArrayBuffer], name, { type })

let bitmapWidth = 800
let bitmapHeight = 600
let encodedSize = 100
let hasContext = true
const close = vi.fn()
const drawImage = vi.fn()
const convertToBlob = vi.fn(async () => new Blob([new ArrayBuffer(encodedSize)]))

class MockOffscreenCanvas {
  readonly width: number
  readonly height: number

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }

  getContext = () => (hasContext ? { drawImage } : null)
  convertToBlob = convertToBlob
}

beforeEach(() => {
  bitmapWidth = 800
  bitmapHeight = 600
  encodedSize = 100
  hasContext = true
  vi.clearAllMocks()
  vi.stubGlobal('OffscreenCanvas', MockOffscreenCanvas)
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ width: bitmapWidth, height: bitmapHeight, close })),
  )
})

describe('isAcceptedImageType', () => {
  it('accepts common raster image types', () => {
    expect(isAcceptedImageType('image/png')).toBe(true)
    expect(isAcceptedImageType('image/jpeg')).toBe(true)
    expect(isAcceptedImageType('image/webp')).toBe(true)
  })

  it('rejects non-images and SVG', () => {
    expect(isAcceptedImageType('application/pdf')).toBe(false)
    expect(isAcceptedImageType('image/svg+xml')).toBe(false)
    expect(isAcceptedImageType('image/svg')).toBe(false)
    expect(isAcceptedImageType('image/bmp')).toBe(false)
  })
})

describe('normalizeImageFile', () => {
  it('decodes with EXIF orientation, draws, and re-encodes WebP', async () => {
    const file = imageFile(new Uint8Array([0xff, 0xd8, 0xff, 0xe1]), 'photo.jpg', 'image/jpeg')
    const result = await normalizeImageFile(file)

    expect(createImageBitmap).toHaveBeenCalledWith(file, { imageOrientation: 'from-image' })
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 800, 600)
    expect(convertToBlob).toHaveBeenCalledWith({ type: 'image/webp', quality: 0.82 })
    expect(result).toMatchObject({
      width: 800,
      height: 600,
      contentType: 'image/webp',
      wasResized: false,
    })
    expect(result.file.name).toBe('photo.webp')
    expect(close).toHaveBeenCalledOnce()
  })

  it.each([
    [2160, 1440, 1080, 720, true],
    [1620, 2880, 1080, 1920, true],
    [2000, 2000, 1080, 1080, true],
    [3240, 1080, 1080, 360, true],
    [1080, 1920, 1080, 1920, false],
    [540, 960, 540, 960, false],
  ])(
    'normalizes %i x %i to %i x %i',
    async (sourceWidth, sourceHeight, width, height, wasResized) => {
      bitmapWidth = sourceWidth
      bitmapHeight = sourceHeight

      const result = await normalizeImageFile(imageFile(pngBytes('IEND')))

      expect(result).toMatchObject({ width, height, wasResized })
      expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, width, height)
    },
  )

  it.each([
    [pngBytes('acTL', 'IEND'), 'animated.png', 'image/png'],
    [
      webpBytes([{ type: 'VP8X', payload: [0x02, 0, 0, 0, 0, 0, 0, 0, 0, 0] }]),
      'a.webp',
      'image/webp',
    ],
    [gifBytes(2), 'animated.gif', 'image/gif'],
  ])('rejects animated containers before decode', async (bytes, name, type) => {
    await expect(normalizeImageFile(imageFile(bytes, name, type))).rejects.toThrow(
      'Animated images are not supported',
    )
    expect(createImageBitmap).not.toHaveBeenCalled()
  })

  it('accepts static PNG, JPEG, WebP, and GIF containers', async () => {
    const files = [
      imageFile(pngBytes('IEND')),
      imageFile(new Uint8Array([0xff, 0xd8, 0xff]), 'a.jpeg', 'image/jpeg'),
      imageFile(webpBytes([{ type: 'VP8 ', payload: [0] }]), 'a.webp', 'image/webp'),
      imageFile(gifBytes(1), 'a.gif', 'image/gif'),
    ]

    for (const file of files) {
      await expect(normalizeImageFile(file)).resolves.toMatchObject({ contentType: 'image/webp' })
    }
  })

  it('rejects empty, oversized, malformed, unsupported, and spoofed files before decode', async () => {
    const oversized = imageFile(pngBytes('IEND'), 'large.png')
    Object.defineProperty(oversized, 'size', { value: MAX_SOURCE_BYTES + 1 })
    const cases = [
      [new File([], 'empty.png', { type: 'image/png' }), 'Image file is empty'],
      [oversized, 'Image file is too large'],
      [imageFile(new Uint8Array([0x89, 0x50]), 'broken.png'), 'unsafe image content'],
      [
        imageFile(new TextEncoder().encode('<svg></svg>'), 'active.svg', 'image/svg+xml'),
        'unsafe image type',
      ],
      [imageFile(pngBytes('IEND'), 'spoofed.jpg', 'image/jpeg'), 'does not match'],
      [imageFile(pngBytes('IDAT'), 'truncated.png'), 'container is malformed'],
    ] as const

    for (const [file, message] of cases) {
      await expect(normalizeImageFile(file)).rejects.toThrow(message)
    }
    expect(createImageBitmap).not.toHaveBeenCalled()
  })

  it('rejects decoded pixel bombs and closes the bitmap', async () => {
    bitmapWidth = 10_000
    bitmapHeight = 10_000

    await expect(normalizeImageFile(imageFile(pngBytes('IEND')))).rejects.toThrow(
      'Image resolution is too large',
    )
    expect(close).toHaveBeenCalledOnce()
  })

  it('reports decode and draw failures while closing decoded bitmaps', async () => {
    vi.mocked(createImageBitmap).mockRejectedValueOnce(new Error('decode'))
    await expect(normalizeImageFile(imageFile(pngBytes('IEND')))).rejects.toThrow(
      'Could not decode image',
    )

    hasContext = false
    await expect(normalizeImageFile(imageFile(pngBytes('IEND')))).rejects.toThrow(
      'Failed to create OffscreenCanvas context',
    )
    expect(close).toHaveBeenCalledOnce()
  })

  it('runs the quality loop and rejects output that remains over the hard limit', async () => {
    encodedSize = MAX_OUTPUT_BYTES + 1

    await expect(normalizeImageFile(imageFile(pngBytes('IEND')))).rejects.toThrow(
      'Compressed image is still too large',
    )
    expect(convertToBlob).toHaveBeenCalledTimes(7)
    expect(close).toHaveBeenCalledOnce()
  })

  it('surfaces encoder failures and closes the bitmap', async () => {
    convertToBlob.mockRejectedValueOnce(new Error('encoder failed'))

    await expect(normalizeImageFile(imageFile(pngBytes('IEND')))).rejects.toThrow(
      'Could not encode image',
    )
    expect(close).toHaveBeenCalledOnce()
  })
})

describe('computeScaledDimensions', () => {
  it('preserves dimensions when width is at or below the max', () => {
    expect(computeScaledDimensions(1080, 1920)).toEqual({
      width: 1080,
      height: 1920,
      scaled: false,
    })
    expect(computeScaledDimensions(800, 600)).toEqual({
      width: 800,
      height: 600,
      scaled: false,
    })
  })

  it('scales landscape images down to max width without changing aspect ratio', () => {
    const result = computeScaledDimensions(2160, 1440)

    expect(result).toEqual({
      width: MAX_IMAGE_WIDTH,
      height: 720,
      scaled: true,
    })
    expect(result.width / result.height).toBeCloseTo(2160 / 1440)
  })

  it('scales portrait images by width while preserving aspect ratio', () => {
    const result = computeScaledDimensions(1620, 2880)

    expect(result.width).toBe(MAX_IMAGE_WIDTH)
    expect(result.height).toBe(1920)
    expect(result.scaled).toBe(true)
    expect(result.width / result.height).toBeCloseTo(1620 / 2880)
  })

  it('scales square and unusual aspect ratios proportionally', () => {
    expect(computeScaledDimensions(2000, 2000)).toEqual({
      width: MAX_IMAGE_WIDTH,
      height: MAX_IMAGE_WIDTH,
      scaled: true,
    })

    const ultrawide = computeScaledDimensions(3240, 1080)
    expect(ultrawide).toEqual({
      width: MAX_IMAGE_WIDTH,
      height: 360,
      scaled: true,
    })
  })

  it('does not upscale narrow images', () => {
    expect(computeScaledDimensions(540, 960).scaled).toBe(false)
  })
})
