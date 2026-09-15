import { describe, expect, it } from 'vitest'
import { computeScaledDimensions, isAcceptedImageType, MAX_IMAGE_WIDTH } from './normalizeImage'

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
