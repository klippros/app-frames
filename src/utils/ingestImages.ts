import type { Screenshot } from '../types'
import { MAX_FRAMES_PER_PROJECT } from '../lib/supabase/schema'
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
  maxFrames = MAX_FRAMES_PER_PROJECT,
): Promise<ImageIngestionResult> => {
  const screenshots: Screenshot[] = []
  const normalized: NormalizedImage[] = []
  const errors: ImageNormalizationError[] = []
  const remainingSlots = Math.max(0, maxFrames - existingScreenshotCount)

  if (remainingSlots === 0) {
    if (files.length > 0) {
      errors.push(
        new NormalizationError(
          files[0]?.name ?? 'screenshots',
          `A project can have at most ${maxFrames} frames.`,
        ),
      )
    }
    return { screenshots, normalized, errors }
  }

  const acceptedFiles = files.slice(0, remainingSlots)
  const overflowFiles = files.slice(remainingSlots)

  for (const file of acceptedFiles) {
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

  if (overflowFiles.length > 0) {
    errors.push(
      new NormalizationError(
        overflowFiles[0]?.name ?? 'screenshots',
        `Only ${remainingSlots} more frame${remainingSlots === 1 ? '' : 's'} can be added (max ${maxFrames}).`,
      ),
    )
  }

  return { screenshots, normalized, errors }
}

export const ingestSingleImageFile = (file: File): Promise<NormalizedImage> =>
  normalizeImageFile(file)
