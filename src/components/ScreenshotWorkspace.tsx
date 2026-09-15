import { Flex } from '@chakra-ui/react'
import type { Platform, Screenshot } from '../types'
import type { GradientConfig } from '../utils/featureGraphicConfig'
import { FramesEditor } from './FramesEditor/FramesEditor'
import { MainContent } from './MainContent'
import { WelcomeScreen } from './WelcomeScreen/WelcomeScreen'

export interface ScreenshotWorkspaceProps {
  screenshots: Screenshot[]
  platform: Platform
  gradientConfig: GradientConfig
  showBezel: boolean
  onSelect: (screenshots: Screenshot[]) => void
  onReplace: (id: string, file: File) => void
  onDelete: (id: string) => void
  onSwap: (index: number) => void
  onTitleChange: (id: string, title: string) => void
  onToggleTitlePosition: (id: string) => void
  onOpenProject: (projectId: string) => Promise<void>
  onCreateProject: () => void
}

export const ScreenshotWorkspace = ({
  screenshots,
  platform,
  gradientConfig,
  showBezel,
  onSelect,
  onReplace,
  onDelete,
  onSwap,
  onTitleChange,
  onToggleTitlePosition,
  onOpenProject,
  onCreateProject,
}: ScreenshotWorkspaceProps) => (
  <Flex direction="column" flex="1" minH={0} w="full">
    {screenshots.length > 0 ? (
      <FramesEditor
        screenshots={screenshots}
        platform={platform}
        gradientConfig={gradientConfig}
        showBezel={showBezel}
        onReplace={onReplace}
        onDelete={onDelete}
        onSwap={onSwap}
        onTitleChange={onTitleChange}
        onToggleTitlePosition={onToggleTitlePosition}
      />
    ) : (
      <MainContent>
        <WelcomeScreen
          onSelectScreenshots={onSelect}
          onOpenProject={onOpenProject}
          onCreateProject={onCreateProject}
        />
      </MainContent>
    )}
  </Flex>
)
