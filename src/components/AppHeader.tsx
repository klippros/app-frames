import { Flex, HStack, Link } from '@chakra-ui/react'
import { useRef } from 'react'
import appFramesLogo from '../assets/app-frames-logo.svg'
import klipprosLogo from '../assets/klippros-logo.svg'
import { toolbarControlSize } from '../layout'
import type { Platform, Screenshot } from '../types'
import { ContentContainer } from './ContentContainer'
import { HeaderToolbar } from './HeaderToolbar'
import { PlatformToggle } from './PlatformToggle'
import type { ScreenshotFileInputHandle } from './ScreenshotFileInput'
import { ScreenshotFileInput } from './ScreenshotFileInput'

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
}: AppHeaderProps) => {
  const addScreenshotsInputRef = useRef<ScreenshotFileInputHandle>(null)

  return (
    <ContentContainer>
      <ScreenshotFileInput
        ref={addScreenshotsInputRef}
        existingScreenshotCount={screenshotCount}
        onSelect={onAddScreenshots}
      />
      <Flex py={4} align="center" gap={4} minH={toolbarControlSize}>
        <HStack flex="1" gap={5} align="center" minW={0}>
          <Link
            href="https://klippros.com"
            target="_blank"
            rel="noopener noreferrer"
            display="flex"
            alignItems="center"
            flexShrink={0}
            h={toolbarControlSize}
            transition="transform 0.15s ease"
            _hover={{ transform: 'scale(1.08)' }}
            aria-label="Klippros"
          >
            <img
              src={klipprosLogo}
              alt=""
              style={{ height: toolbarControlSize, width: 'auto', display: 'block' }}
            />
          </Link>
          <img
            src={appFramesLogo}
            alt="App Frames"
            style={{ height: toolbarControlSize, width: 'auto', display: 'block' }}
          />
        </HStack>
        <HStack flexShrink={0} gap={2} justify="center">
          <PlatformToggle
            disabled={!hasScreenshots}
            platform={platform}
            onChange={onPlatformChange}
          />
        </HStack>
        <HStack flex="1" gap={2} align="center" justify="flex-end" minW={0}>
          <HeaderToolbar
            disabled={!hasScreenshots}
            gradientBaseColor={gradientBaseColor}
            showBezel={showBezel}
            onGradientBaseColorChange={onGradientBaseColorChange}
            onShowBezelChange={onShowBezelChange}
            onAddScreenshotsClick={() => {
              addScreenshotsInputRef.current?.open()
            }}
            onExportClick={onExportClick}
          />
        </HStack>
      </Flex>
    </ContentContainer>
  )
}
