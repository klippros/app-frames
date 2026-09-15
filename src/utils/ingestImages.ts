import type { Screenshot } from '../types'
import { createScreenshot } from './frameTitle'
import type { ImageNormalizationError, NormalizedImage } from './normalizeImage'
import { ImageNormalizationError as NormalizationError, normalizeImageFile } from './normalizeImage'

export interface ImageIngestionResult {
  screenshots: Screenshot[]
  normalized: NormalizedImage[]
  errors: ImageNormalizationError[]
}

export const ingestImageFiles = async (
  files: File[],
  existingScreenshotCount = 0,
): Promise<ImageIngestionResult> => {
  const screenshots: Screenshot[] = []
  const normalized: NormalizedImage[] = []
  const errors: ImageNormalizationError[] = []

  for (const file of files) {
    try {
      const result = await normalizeImageFile(file)
      const screenshot = createScreenshot(result.file, existingScreenshotCount + screenshots.length)
      screenshots.push(screenshot)
      normalized.push(result)
    } catch (error) {
      if (error instanceof NormalizationError) {
        errors.push(error)
        continue
      }

      errors.push(
        new NormalizationError(
          file.name,
          error instanceof Error ? error.message : 'Failed to process image',
        ),
      )
    }
  }

  return { screenshots, normalized, errors }
}

export const ingestSingleImageFile = (file: File): Promise<NormalizedImage> =>
  normalizeImageFile(file)
