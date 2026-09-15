import { HStack } from '@chakra-ui/react'
import {
  faDownload,
  faFloppyDisk,
  faMobileScreenButton,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { GradientHueSelector } from './GradientHueSelector'
import { ToolbarIconButton } from './ToolbarIconButton'

export interface HeaderToolbarProps {
  disabled?: boolean
  gradientBaseColor: string
  showBezel: boolean
  showSaveProject?: boolean
  onGradientBaseColorChange: (baseColor: string) => void
  onShowBezelChange: (show: boolean) => void
  onAddScreenshotsClick: () => void
  onExportClick: () => void
  onSaveProjectClick?: () => void
}

export const HeaderToolbar = ({
  disabled = false,
  gradientBaseColor,
  showBezel,
  showSaveProject = false,
  onGradientBaseColorChange,
  onShowBezelChange,
  onAddScreenshotsClick,
  onExportClick,
  onSaveProjectClick,
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
    {showSaveProject && onSaveProjectClick !== undefined && (
      <ToolbarIconButton
        aria-label="Save as project"
        disabled={disabled}
        onClick={onSaveProjectClick}
      >
        <FontAwesomeIcon icon={faFloppyDisk} />
      </ToolbarIconButton>
    )}
    <ToolbarIconButton aria-label="Export assets" disabled={disabled} onClick={onExportClick}>
      <FontAwesomeIcon icon={faDownload} />
    </ToolbarIconButton>
  </HStack>
)
