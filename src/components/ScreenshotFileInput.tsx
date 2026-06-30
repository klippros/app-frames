import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { Screenshot } from '../types'
import { createScreenshot } from '../utils/frameTitle'

export interface ScreenshotFileInputHandle {
  open: () => void
}

export interface ScreenshotFileInputProps {
  existingScreenshotCount?: number
  onSelect: (screenshots: Screenshot[]) => void
}

export const ScreenshotFileInput = forwardRef<ScreenshotFileInputHandle, ScreenshotFileInputProps>(
  ({ existingScreenshotCount = 0, onSelect }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
      open: () => {
        inputRef.current?.click()
      },
    }))

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []).filter((file) =>
        file.type.startsWith('image/'),
      )

      if (files.length === 0) {
        return
      }

      const screenshots: Screenshot[] = files.map((file, index) =>
        createScreenshot(file, existingScreenshotCount + index),
      )

      onSelect(screenshots)
      event.target.value = ''
    }

    return (
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={handleChange} />
    )
  },
)

ScreenshotFileInput.displayName = 'ScreenshotFileInput'
