import { Button } from '@chakra-ui/react'
import { useRef } from 'react'
import type { Screenshot } from '../types'

export interface ScreenshotPickerProps {
  onSelect: (screenshots: Screenshot[]) => void
}

export const ScreenshotPicker = ({ onSelect }: ScreenshotPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

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
    <>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={handleChange} />
      <Button size="lg" onClick={handleClick}>
        Select Screenshots
      </Button>
    </>
  )
}
