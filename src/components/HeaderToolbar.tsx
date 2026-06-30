import { HStack } from '@chakra-ui/react'
import { faDownload, faMobileScreenButton, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { GradientHueSelector } from './GradientHueSelector'
import { ToolbarIconButton } from './ToolbarIconButton'

export interface HeaderToolbarProps {
  disabled?: boolean
  gradientBaseColor: string
  showBezel: boolean
  onGradientBaseColorChange: (baseColor: string) => void
  onShowBezelChange: (show: boolean) => void
  onAddScreenshotsClick: () => void
  onExportClick: () => void
}

export const HeaderToolbar = ({
  disabled = false,
  gradientBaseColor,
  showBezel,
  onGradientBaseColorChange,
  onShowBezelChange,
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
      aria-label="Toggle device bezel"
      aria-pressed={showBezel}
      disabled={disabled}
      variant={showBezel ? 'solid' : 'outline'}
      onClick={() => {
        onShowBezelChange(!showBezel)
      }}
    >
      <FontAwesomeIcon icon={faMobileScreenButton} />
    </ToolbarIconButton>
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
