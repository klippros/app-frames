import { Flex, HStack } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { toolbarControlSize } from '../layout'
import type { Platform, Screenshot } from '../types'
import type { SyncStatus } from '../lib/sync/projectSync'
import { AuthControls } from './AuthControls'
import { BrandLogos } from './BrandLogos'
import { ContentContainer } from './ContentContainer'
import { HeaderEditorControls } from './HeaderEditorControls'
import { ProjectHeaderMeta } from './ProjectHeaderMeta'

export interface AppHeaderProps {
  hasScreenshots: boolean
  screenshotCount: number
  platform: Platform
  gradientBaseColor: string
  showBezel: boolean
  projectName: string | null
  syncStatus: SyncStatus
  syncMessage?: string
  showSaveProject?: boolean
  onPlatformChange: (platform: Platform) => void
  onGradientBaseColorChange: (baseColor: string) => void
  onShowBezelChange: (showBezel: boolean) => void
  onAddScreenshots: (screenshots: Screenshot[]) => void
  onExportClick: () => void
  onSaveProjectClick?: () => void
  trailing?: ReactNode
}

export const AppHeader = ({
  hasScreenshots,
  screenshotCount,
  platform,
  gradientBaseColor,
  showBezel,
  projectName,
  syncStatus,
  syncMessage,
  showSaveProject = false,
  onPlatformChange,
  onGradientBaseColorChange,
  onShowBezelChange,
  onAddScreenshots,
  onExportClick,
  onSaveProjectClick,
  trailing,
}: AppHeaderProps) => (
  <ContentContainer>
    <Flex py={4} align="center" gap={4} minH={toolbarControlSize}>
      <BrandLogos />
      <HeaderEditorControls
        hasScreenshots={hasScreenshots}
        screenshotCount={screenshotCount}
        platform={platform}
        gradientBaseColor={gradientBaseColor}
        showBezel={showBezel}
        showSaveProject={showSaveProject}
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
        />
        {trailing}
        <AuthControls syncStatus={syncStatus} />
      </HStack>
    </Flex>
  </ContentContainer>
)
