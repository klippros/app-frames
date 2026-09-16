import { Flex, HStack, Stack } from '@chakra-ui/react'
import { toolbarControlSize } from '../layout'
import type { Platform, Screenshot } from '../types'
import type { SyncStatus } from '../lib/sync/projectSync'
import { AppNavbar } from './AppNavbar/AppNavbar'
import { AuthControls } from './AuthControls'
import { BrandLogos } from './BrandLogos'
import { MobileNavMenu } from './MobileNavMenu/MobileNavMenu'
import { ContentContainer } from './ContentContainer'
import { ProjectToolbar } from './ProjectToolbar'

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
}: AppHeaderProps) => (
  <ContentContainer>
    <Stack gap={4} py={4}>
      <Flex align="center" gap={4} minH={toolbarControlSize}>
        <BrandLogos />
        <HStack
          flex="1"
          gap={{ base: 1, md: 6 }}
          align="center"
          justify="flex-end"
          minW={0}
          display={{ base: 'none', md: 'flex' }}
        >
          <AppNavbar />
          <AuthControls syncStatus={syncStatus} />
        </HStack>
        <HStack
          flex="1"
          gap={1}
          align="center"
          justify="flex-end"
          minW={0}
          display={{ base: 'flex', md: 'none' }}
        >
          <MobileNavMenu syncStatus={syncStatus} />
        </HStack>
      </Flex>
      <ProjectToolbar
        hasScreenshots={hasScreenshots}
        screenshotCount={screenshotCount}
        platform={platform}
        gradientBaseColor={gradientBaseColor}
        showBezel={showBezel}
        projectName={projectName}
        syncStatus={syncStatus}
        syncMessage={syncMessage}
        showSaveProject={showSaveProject}
        onPlatformChange={onPlatformChange}
        onGradientBaseColorChange={onGradientBaseColorChange}
        onShowBezelChange={onShowBezelChange}
        onAddScreenshots={onAddScreenshots}
        onExportClick={onExportClick}
        onSaveProjectClick={onSaveProjectClick}
      />
    </Stack>
  </ContentContainer>
)
