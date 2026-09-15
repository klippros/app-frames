import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { Screenshot } from '../types'
import type { ImageNormalizationError } from '../utils/normalizeImage'
import { ingestImageFiles } from '../utils/ingestImages'

export interface ScreenshotFileInputHandle {
  open: () => void
}

export interface ScreenshotFileInputProps {
  existingScreenshotCount?: number
  onSelect: (screenshots: Screenshot[]) => void
  onErrors?: (errors: ImageNormalizationError[]) => void
}

export const ScreenshotFileInput = forwardRef<ScreenshotFileInputHandle, ScreenshotFileInputProps>(
  ({ existingScreenshotCount = 0, onSelect, onErrors }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
      open: () => {
        inputRef.current?.click()
      },
    }))

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? [])
      event.target.value = ''

      if (files.length === 0) {
        return
      }

      void (async () => {
        const { screenshots, errors } = await ingestImageFiles(files, existingScreenshotCount)

        if (errors.length > 0) {
          onErrors?.(errors)
        }

        if (screenshots.length > 0) {
          onSelect(screenshots)
        }
      })()
    }

    return (
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={handleChange} />
    )
  },
)

ScreenshotFileInput.displayName = 'ScreenshotFileInput'
