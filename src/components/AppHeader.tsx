import { Flex, HStack } from '@chakra-ui/react'
import { toolbarControlSize } from '../layout'
import type { Platform, Screenshot } from '../types'
import { AuthControls } from './AuthControls'
import { BrandLogos } from './BrandLogos'
import { ContentContainer } from './ContentContainer'
import { HeaderEditorControls } from './HeaderEditorControls'

export interface AppHeaderProps {
  hasScreenshots: boolean
  screenshotCount: number
  platform: Platform
  gradientBaseColor: string
  showBezel: boolean
  onPlatformChange: (platform: Platform) => void
  onGradientBaseColorChange: (baseColor: string) => void
  onShowBezelChange: (showBezel: boolean) => void
  onAddScreenshots: (screenshots: Screenshot[]) => void
  onExportClick: () => void
}

export const AppHeader = ({
  hasScreenshots,
  screenshotCount,
  platform,
  gradientBaseColor,
  showBezel,
  onPlatformChange,
  onGradientBaseColorChange,
  onShowBezelChange,
  onAddScreenshots,
  onExportClick,
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
        onPlatformChange={onPlatformChange}
        onGradientBaseColorChange={onGradientBaseColorChange}
        onShowBezelChange={onShowBezelChange}
        onAddScreenshots={onAddScreenshots}
        onExportClick={onExportClick}
      />
      <HStack flex="1" gap={3} align="center" justify="flex-end" minW={0}>
        <AuthControls />
      </HStack>
    </Flex>
  </ContentContainer>
)
