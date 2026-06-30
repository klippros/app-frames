import { Button, Flex } from '@chakra-ui/react'
import { useRef } from 'react'
import type { Screenshot } from '../types'
import { ScreenshotFileInput } from './ScreenshotFileInput'
import type { ScreenshotFileInputHandle } from './ScreenshotFileInput'

export interface ScreenshotPickerProps {
  onSelect: (screenshots: Screenshot[]) => void
}

export const ScreenshotPicker = ({ onSelect }: ScreenshotPickerProps) => {
  const inputRef = useRef<ScreenshotFileInputHandle>(null)

  return (
    <Flex justify="center">
      <ScreenshotFileInput ref={inputRef} onSelect={onSelect} />
      <Button variant="cta" size="lg" onClick={() => inputRef.current?.open()}>
        Select Screenshots
      </Button>
    </Flex>
  )
}
