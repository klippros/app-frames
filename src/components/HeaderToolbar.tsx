import { Box, HStack, Tooltip, Text, VStack } from '@chakra-ui/react'
import {
  faDownload,
  faFloppyDisk,
  faMobileScreenButton,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { ReactElement } from 'react'
import { MAX_FRAMES_PER_PROJECT, MAX_PROJECTS_PER_USER } from '../lib/supabase/schema'
import { GradientHueSelector } from './GradientHueSelector'
import { ToolbarIconButton } from './ToolbarIconButton'

export interface HeaderToolbarProps {
  disabled?: boolean
  gradientBaseColor: string
  showBezel: boolean
  showSaveProject?: boolean
  saveProjectDisabled?: boolean
  addScreenshotsDisabled?: boolean
  onGradientBaseColorChange: (baseColor: string) => void
  onShowBezelChange: (show: boolean) => void
  onAddScreenshotsClick: () => void
  onExportClick: () => void
  onSaveProjectClick?: () => void
}

const ToolbarTip = ({
  label,
  detail,
  children,
}: {
  label: string
  detail: string
  children: ReactElement
}) => (
  <Tooltip.Root openDelay={200} closeDelay={100}>
    <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
    <Tooltip.Positioner>
      <Tooltip.Content maxW="16rem">
        <VStack gap={1} align="flex-start">
          <Text fontSize="sm" fontWeight="semibold" lineHeight="short">
            {label}
          </Text>
          <Text fontSize="xs" color="fg.muted" lineHeight="short">
            {detail}
          </Text>
        </VStack>
      </Tooltip.Content>
    </Tooltip.Positioner>
  </Tooltip.Root>
)

export const HeaderToolbar = ({
  disabled = false,
  gradientBaseColor,
  showBezel,
  showSaveProject = false,
  saveProjectDisabled = false,
  addScreenshotsDisabled = false,
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
    {addScreenshotsDisabled ? (
      <ToolbarTip
        label="Frame limit reached"
        detail={`A project can have at most ${MAX_FRAMES_PER_PROJECT} frames.`}
      >
        <Box as="span" display="inline-flex">
          <ToolbarIconButton aria-label="Add screenshots" disabled>
            <FontAwesomeIcon icon={faPlus} />
          </ToolbarIconButton>
        </Box>
      </ToolbarTip>
    ) : (
      <ToolbarIconButton
        aria-label="Add screenshots"
        disabled={disabled}
        onClick={onAddScreenshotsClick}
      >
        <FontAwesomeIcon icon={faPlus} />
      </ToolbarIconButton>
    )}
    {showSaveProject &&
      onSaveProjectClick !== undefined &&
      (saveProjectDisabled ? (
        <ToolbarTip
          label="Project limit reached"
          detail={`You can save at most ${MAX_PROJECTS_PER_USER} projects. Delete one to continue.`}
        >
          <Box as="span" display="inline-flex">
            <ToolbarIconButton aria-label="Save as project" disabled>
              <FontAwesomeIcon icon={faFloppyDisk} />
            </ToolbarIconButton>
          </Box>
        </ToolbarTip>
      ) : (
        <ToolbarIconButton
          aria-label="Save as project"
          disabled={disabled}
          onClick={onSaveProjectClick}
        >
          <FontAwesomeIcon icon={faFloppyDisk} />
        </ToolbarIconButton>
      ))}
    <ToolbarIconButton aria-label="Export assets" disabled={disabled} onClick={onExportClick}>
      <FontAwesomeIcon icon={faDownload} />
    </ToolbarIconButton>
  </HStack>
)
