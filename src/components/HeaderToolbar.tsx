import { HStack } from '@chakra-ui/react'
import { faDownload, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { GradientHueSelector } from './GradientHueSelector'
import { ToolbarIconButton } from './ToolbarIconButton'

export interface HeaderToolbarProps {
  gradientBaseColor: string
  onGradientBaseColorChange: (baseColor: string) => void
  onAddScreenshotsClick: () => void
  onExportClick: () => void
}

export const HeaderToolbar = ({
  gradientBaseColor,
  onGradientBaseColorChange,
  onAddScreenshotsClick,
  onExportClick,
}: HeaderToolbarProps) => (
  <HStack gap={2}>
    <GradientHueSelector baseColor={gradientBaseColor} onChange={onGradientBaseColorChange} />
    <ToolbarIconButton aria-label="Add screenshots" onClick={onAddScreenshotsClick}>
      <FontAwesomeIcon icon={faPlus} />
    </ToolbarIconButton>
    <ToolbarIconButton aria-label="Export assets" onClick={onExportClick}>
      <FontAwesomeIcon icon={faDownload} />
    </ToolbarIconButton>
  </HStack>
)
