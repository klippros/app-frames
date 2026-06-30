import { Flex } from '@chakra-ui/react'
import type { Platform, Screenshot } from '../types'
import type { GradientConfig } from '../utils/featureGraphicConfig'
import { FramesEditor } from './FramesEditor/FramesEditor'
import { MainContent } from './MainContent'
import { ScreenshotPicker } from './ScreenshotPicker'

export interface ScreenshotWorkspaceProps {
  screenshots: Screenshot[]
  platform: Platform
  gradientConfig: GradientConfig
  onSelect: (screenshots: Screenshot[]) => void
  onReplace: (id: string, file: File) => void
  onDelete: (id: string) => void
  onSwap: (index: number) => void
}

export const ScreenshotWorkspace = ({
  screenshots,
  platform,
  gradientConfig,
  onSelect,
  onReplace,
  onDelete,
  onSwap,
}: ScreenshotWorkspaceProps) => (
  <Flex direction="column" flex="1" minH={0} w="full">
    {screenshots.length > 0 ? (
      <FramesEditor
        screenshots={screenshots}
        platform={platform}
        gradientConfig={gradientConfig}
        onReplace={onReplace}
        onDelete={onDelete}
        onSwap={onSwap}
      />
    ) : (
      <MainContent>
        <ScreenshotPicker onSelect={onSelect} />
      </MainContent>
    )}
  </Flex>
)
