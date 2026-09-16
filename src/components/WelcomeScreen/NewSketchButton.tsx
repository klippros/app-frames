import { Button, Text, VStack } from '@chakra-ui/react'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useRef } from 'react'
import type { Screenshot } from '../../types'
import type { ImageNormalizationError } from '../../utils/normalizeImage'
import { ScreenshotFileInput } from '../ScreenshotFileInput'
import type { ScreenshotFileInputHandle } from '../ScreenshotFileInput'

export interface NewSketchButtonProps {
  onSelect: (screenshots: Screenshot[]) => void
  onErrors?: (message: string) => void
}

export const NewSketchButton = ({ onSelect, onErrors }: NewSketchButtonProps) => {
  const inputRef = useRef<ScreenshotFileInputHandle>(null)

  const handleErrors = (errors: ImageNormalizationError[]) => {
    if (errors.length > 0) {
      onErrors?.(errors[0]?.message ?? 'Could not process screenshots.')
    }
  }

  return (
    <>
      <ScreenshotFileInput ref={inputRef} onSelect={onSelect} onErrors={handleErrors} />
      <Button
        variant="ghost"
        h="auto"
        p={3}
        borderRadius="12px"
        color="white"
        aria-label="New sketch"
        onClick={() => {
          inputRef.current?.open()
        }}
        _hover={{ bg: 'whiteAlpha.100' }}
        _active={{ bg: 'whiteAlpha.150' }}
      >
        <VStack gap={2} w="7rem">
          <Text fontSize="2.5rem" lineHeight={1} color="whiteAlpha.700" aria-hidden>
            <FontAwesomeIcon icon={faPlus} />
          </Text>
          <Text fontSize="sm" color="whiteAlpha.800" textAlign="center">
            New sketch
          </Text>
        </VStack>
      </Button>
    </>
  )
}
