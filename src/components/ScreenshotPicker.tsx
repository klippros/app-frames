import { Button, Flex } from '@chakra-ui/react'
import { useRef } from 'react'
import type { Screenshot } from '../types'
import type { ImageNormalizationError } from '../utils/normalizeImage'
import { ScreenshotFileInput } from './ScreenshotFileInput'
import type { ScreenshotFileInputHandle } from './ScreenshotFileInput'

export interface ScreenshotPickerProps {
  onSelect: (screenshots: Screenshot[]) => void
  onErrors?: (message: string) => void
}

export const ScreenshotPicker = ({ onSelect, onErrors }: ScreenshotPickerProps) => {
  const inputRef = useRef<ScreenshotFileInputHandle>(null)

  const handleErrors = (errors: ImageNormalizationError[]) => {
    if (errors.length > 0) {
      onErrors?.(errors[0]?.message ?? 'Could not process screenshots.')
    }
  }

  return (
    <Flex justify="center">
      <ScreenshotFileInput ref={inputRef} onSelect={onSelect} onErrors={handleErrors} />
      <Button variant="cta" size="lg" onClick={() => inputRef.current?.open()}>
        Select Screenshots
      </Button>
    </Flex>
  )
}
