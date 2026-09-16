import { Box, Flex, HStack } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { toolbarControlSize } from '../layout'
import type { Platform, Screenshot } from '../types'
import type { SyncStatus } from '../lib/sync/projectSync'
import { HeaderEditorControls } from './HeaderEditorControls'
import { ProjectHeaderMeta } from './ProjectHeaderMeta'

export interface ProjectToolbarProps {
  hasScreenshots: boolean
  screenshotCount: number
  platform: Platform
  gradientBaseColor: string
  showBezel: boolean
  projectName: string | null
  syncStatus: SyncStatus
  syncMessage?: string
  showSaveProject?: boolean
  saveProjectDisabled?: boolean
  deleteProjectDisabled?: boolean
  onPlatformChange: (platform: Platform) => void
  onGradientBaseColorChange: (baseColor: string) => void
  onShowBezelChange: (showBezel: boolean) => void
  onAddScreenshots: (screenshots: Screenshot[]) => void
  onExportClick: () => void
  onSaveProjectClick?: () => void
  onDeleteProjectClick?: () => void
  trailing?: ReactNode
}

export const ProjectToolbar = ({
  hasScreenshots,
  screenshotCount,
  platform,
  gradientBaseColor,
  showBezel,
  projectName,
  syncStatus,
  syncMessage,
  showSaveProject = false,
  saveProjectDisabled = false,
  deleteProjectDisabled = false,
  onPlatformChange,
  onGradientBaseColorChange,
  onShowBezelChange,
  onAddScreenshots,
  onExportClick,
  onSaveProjectClick,
  onDeleteProjectClick,
  trailing,
}: ProjectToolbarProps) => (
  <Flex align="center" gap={4} minH={toolbarControlSize} w="full">
    <Box flex="1" minW={0} aria-hidden />
    <HeaderEditorControls
      hasScreenshots={hasScreenshots}
      screenshotCount={screenshotCount}
      platform={platform}
      gradientBaseColor={gradientBaseColor}
      showBezel={showBezel}
      showSaveProject={showSaveProject}
      saveProjectDisabled={saveProjectDisabled}
      onPlatformChange={onPlatformChange}
      onGradientBaseColorChange={onGradientBaseColorChange}
      onShowBezelChange={onShowBezelChange}
      onAddScreenshots={onAddScreenshots}
      onExportClick={onExportClick}
      onSaveProjectClick={onSaveProjectClick}
    />
    <HStack flex="1" gap={3} align="center" justify="flex-end" minW={0}>
      <ProjectHeaderMeta
        projectName={projectName}
        syncStatus={syncStatus}
        syncMessage={syncMessage}
        deleteDisabled={deleteProjectDisabled}
        onDeleteProjectClick={onDeleteProjectClick}
      />
      {trailing}
    </HStack>
  </Flex>
)
