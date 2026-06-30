import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { Screenshot } from '../types'

export interface ScreenshotFileInputHandle {
  open: () => void
}

export interface ScreenshotFileInputProps {
  onSelect: (screenshots: Screenshot[]) => void
}

export const ScreenshotFileInput = forwardRef<ScreenshotFileInputHandle, ScreenshotFileInputProps>(
  ({ onSelect }, ref) => {
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

      const screenshots: Screenshot[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
      }))

      onSelect(screenshots)
      event.target.value = ''
    }

    return (
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={handleChange} />
    )
  },
)

ScreenshotFileInput.displayName = 'ScreenshotFileInput'
