import { HStack, IconButton } from '@chakra-ui/react'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { Platform } from '../types'
import { GradientHueSelector } from './GradientHueSelector'
import { PlatformToggle } from './PlatformToggle'

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
    <IconButton aria-label="Export assets" variant="outline" onClick={onExportClick}>
      <FontAwesomeIcon icon={faDownload} />
    </IconButton>
  </HStack>
)
