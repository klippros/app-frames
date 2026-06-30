import { SimpleGrid } from '@chakra-ui/react'
import type { Platform, Screenshot } from '../types'
import { PREVIEW_FORMAT_BY_PLATFORM } from '../utils/exportFormats'
import { FrameCanvas } from './FrameCanvas'

export interface FramesEditorProps {
  screenshots: Screenshot[]
  platform: Platform
}

export const FramesEditor = ({ screenshots, platform }: FramesEditorProps) => {
  const format = PREVIEW_FORMAT_BY_PLATFORM[platform]

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={8} p={8} w="full" maxW="1200px">
      {screenshots.map((screenshot) => (
        <FrameCanvas key={screenshot.id} screenshotUrl={screenshot.url} format={format} />
      ))}
    </SimpleGrid>
  )
}
