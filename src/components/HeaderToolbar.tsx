import { HStack } from '@chakra-ui/react'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { Platform } from '../types'
import { GradientHueSelector } from './GradientHueSelector'
import { PlatformToggle } from './PlatformToggle'
import { ToolbarIconButton } from './ToolbarIconButton'

export interface HeaderToolbarProps {
  platform: Platform
  gradientBaseColor: string
  onPlatformChange: (platform: Platform) => void
  onGradientBaseColorChange: (baseColor: string) => void
  onExportClick: () => void
}

export const HeaderToolbar = ({
  platform,
  gradientBaseColor,
  onPlatformChange,
  onGradientBaseColorChange,
  onExportClick,
}: HeaderToolbarProps) => (
  <HStack gap={2}>
    <GradientHueSelector baseColor={gradientBaseColor} onChange={onGradientBaseColorChange} />
    <PlatformToggle platform={platform} onChange={onPlatformChange} />
    <ToolbarIconButton aria-label="Export assets" onClick={onExportClick}>
      <FontAwesomeIcon icon={faDownload} />
    </ToolbarIconButton>
  </HStack>
)
