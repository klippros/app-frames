export const MAX_IMAGE_WIDTH = 1080
export const MAX_SOURCE_BYTES = 40 * 1024 * 1024
export const MAX_SOURCE_PIXELS = 40_000_000
export const TARGET_OUTPUT_BYTES = 500 * 1024
export const MAX_OUTPUT_BYTES = 1.5 * 1024 * 1024
export const WEBP_CONTENT_TYPE = 'image/webp'

const REJECTED_TYPES = new Set(['image/svg+xml', 'image/svg'])

export interface ScaledDimensions {
  width: number
  height: number
  scaled: boolean
}

export interface NormalizedImage {
  file: File
  width: number
  height: number
  contentType: typeof WEBP_CONTENT_TYPE
  byteSize: number
  wasResized: boolean
}

export class ImageNormalizationError extends Error {
  readonly fileName: string

  constructor(fileName: string, message: string) {
    super(message)
    this.name = 'ImageNormalizationError'
    this.fileName = fileName
  }
}

export const isAcceptedImageType = (type: string): boolean => {
  if (!type.startsWith('image/')) {
    return false
  }

  return !REJECTED_TYPES.has(type.toLowerCase())
}

export const computeScaledDimensions = (
  sourceWidth: number,
  sourceHeight: number,
  maxWidth = MAX_IMAGE_WIDTH,
): ScaledDimensions => {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error('Image dimensions must be positive')
  }

  if (sourceWidth <= maxWidth) {
    return { width: sourceWidth, height: sourceHeight, scaled: false }
  }

  const scale = maxWidth / sourceWidth
  return {
    width: maxWidth,
    height: Math.max(1, Math.round(sourceHeight * scale)),
    scaled: true,
  }
}

const canvasToWebpBlob = (
  canvas: HTMLCanvasElement | OffscreenCanvas,
  quality: number,
): Promise<Blob> => {
  if ('convertToBlob' in canvas) {
    return canvas.convertToBlob({ type: WEBP_CONTENT_TYPE, quality })
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to encode image as WebP'))
          return
        }
        resolve(blob)
      },
      WEBP_CONTENT_TYPE,
      quality,
    )
  })
}

const encodeWebpUnderLimit = async (
  canvas: HTMLCanvasElement | OffscreenCanvas,
  fileName: string,
): Promise<Blob> => {
  let quality = 0.82
  let blob = await canvasToWebpBlob(canvas, quality)

  while (blob.size > TARGET_OUTPUT_BYTES && quality > 0.4) {
    quality -= 0.08
    blob = await canvasToWebpBlob(canvas, quality)
  }

  if (blob.size > MAX_OUTPUT_BYTES) {
    throw new ImageNormalizationError(
      fileName,
      `Compressed image is still too large (${Math.ceil(blob.size / 1024)} KB)`,
    )
  }

  return blob
}

const drawBitmapToCanvas = (
  bitmap: ImageBitmap,
  width: number,
  height: number,
): HTMLCanvasElement | OffscreenCanvas => {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height)
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Failed to create OffscreenCanvas context')
    }
    context.drawImage(bitmap, 0, 0, width, height)
    return canvas
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Failed to create canvas context')
  }
  context.drawImage(bitmap, 0, 0, width, height)
  return canvas
}

export const normalizeImageFile = async (file: File): Promise<NormalizedImage> => {
  if (!isAcceptedImageType(file.type)) {
    throw new ImageNormalizationError(file.name, 'Unsupported or unsafe image type')
  }

  if (file.size <= 0) {
    throw new ImageNormalizationError(file.name, 'Image file is empty')
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageNormalizationError(file.name, 'Image file is too large')
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => {
    throw new ImageNormalizationError(file.name, 'Could not decode image')
  })

  try {
    const sourcePixels = bitmap.width * bitmap.height
    if (sourcePixels > MAX_SOURCE_PIXELS) {
      throw new ImageNormalizationError(file.name, 'Image resolution is too large')
    }

    const dimensions = computeScaledDimensions(bitmap.width, bitmap.height)
    const canvas = drawBitmapToCanvas(bitmap, dimensions.width, dimensions.height)
    const blob = await encodeWebpUnderLimit(canvas, file.name)
    const baseName = file.name.replace(/\.[^.]+$/u, '') || 'screenshot'
    const normalizedFile = new File([blob], `${baseName}.webp`, {
      type: WEBP_CONTENT_TYPE,
      lastModified: Date.now(),
    })

    return {
      file: normalizedFile,
      width: dimensions.width,
      height: dimensions.height,
      contentType: WEBP_CONTENT_TYPE,
      byteSize: normalizedFile.size,
      wasResized: dimensions.scaled,
    }
  } finally {
    bitmap.close()
  }
}
