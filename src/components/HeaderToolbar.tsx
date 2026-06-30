import { HStack } from '@chakra-ui/react'
import { faDownload, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { GradientHueSelector } from './GradientHueSelector'
import { ToolbarIconButton } from './ToolbarIconButton'

export interface HeaderToolbarProps {
  disabled?: boolean
  gradientBaseColor: string
  onGradientBaseColorChange: (baseColor: string) => void
  onAddScreenshotsClick: () => void
  onExportClick: () => void
}

export const HeaderToolbar = ({
  disabled = false,
  gradientBaseColor,
  onGradientBaseColorChange,
  onAddScreenshotsClick,
  onExportClick,
}: HeaderToolbarProps) => (
  <HStack gap={2}>
    <GradientHueSelector
      baseColor={gradientBaseColor}
      disabled={disabled}
      onChange={onGradientBaseColorChange}
    />
    <ToolbarIconButton
      aria-label="Add screenshots"
      disabled={disabled}
      onClick={onAddScreenshotsClick}
    >
      <FontAwesomeIcon icon={faPlus} />
    </ToolbarIconButton>
    <ToolbarIconButton aria-label="Export assets" disabled={disabled} onClick={onExportClick}>
      <FontAwesomeIcon icon={faDownload} />
    </ToolbarIconButton>
  </HStack>
)
