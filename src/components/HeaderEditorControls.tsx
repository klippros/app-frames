import { HStack } from '@chakra-ui/react'
import { useRef } from 'react'
import type { Platform, Screenshot } from '../types'
import { HeaderToolbar } from './HeaderToolbar'
import { PlatformToggle } from './PlatformToggle'
import type { ScreenshotFileInputHandle } from './ScreenshotFileInput'
import { ScreenshotFileInput } from './ScreenshotFileInput'

export interface HeaderEditorControlsProps {
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

export const HeaderEditorControls = ({
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
}: HeaderEditorControlsProps) => {
  const addScreenshotsInputRef = useRef<ScreenshotFileInputHandle>(null)

  return (
    <>
      <ScreenshotFileInput
        ref={addScreenshotsInputRef}
        existingScreenshotCount={screenshotCount}
        onSelect={onAddScreenshots}
      />
      <HStack flexShrink={0} gap={3} justify="center" align="center">
        <PlatformToggle
          disabled={!hasScreenshots}
          platform={platform}
          onChange={onPlatformChange}
        />
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
    </>
  )
}
