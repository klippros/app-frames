import { Box, HStack, Text } from '@chakra-ui/react'
import { useRef, useState } from 'react'
import { MAX_FRAMES_PER_PROJECT } from '../lib/supabase/schema'
import type { Platform, Screenshot } from '../types'
import type { ImageNormalizationError } from '../utils/normalizeImage'
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
  showSaveProject?: boolean
  saveProjectDisabled?: boolean
  onPlatformChange: (platform: Platform) => void
  onGradientBaseColorChange: (baseColor: string) => void
  onShowBezelChange: (showBezel: boolean) => void
  onAddScreenshots: (screenshots: Screenshot[]) => void
  onExportClick: () => void
  onSaveProjectClick?: () => void
}

export const HeaderEditorControls = ({
  hasScreenshots,
  screenshotCount,
  platform,
  gradientBaseColor,
  showBezel,
  showSaveProject = false,
  saveProjectDisabled = false,
  onPlatformChange,
  onGradientBaseColorChange,
  onShowBezelChange,
  onAddScreenshots,
  onExportClick,
  onSaveProjectClick,
}: HeaderEditorControlsProps) => {
  const addScreenshotsInputRef = useRef<ScreenshotFileInputHandle>(null)
  const [addError, setAddError] = useState<string | null>(null)
  const atFrameLimit = screenshotCount >= MAX_FRAMES_PER_PROJECT

  const handleErrors = (errors: ImageNormalizationError[]) => {
    if (errors.length > 0) {
      setAddError(errors[0]?.message ?? 'Could not process screenshots.')
    }
  }

  return (
    <Box position="relative">
      <ScreenshotFileInput
        ref={addScreenshotsInputRef}
        existingScreenshotCount={screenshotCount}
        onSelect={(screenshots) => {
          setAddError(null)
          onAddScreenshots(screenshots)
        }}
        onErrors={handleErrors}
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
          showSaveProject={showSaveProject}
          saveProjectDisabled={saveProjectDisabled}
          addScreenshotsDisabled={atFrameLimit}
          onGradientBaseColorChange={onGradientBaseColorChange}
          onShowBezelChange={onShowBezelChange}
          onAddScreenshotsClick={() => {
            if (atFrameLimit) {
              return
            }
            setAddError(null)
            addScreenshotsInputRef.current?.open()
          }}
          onExportClick={onExportClick}
          onSaveProjectClick={onSaveProjectClick}
        />
      </HStack>
      {addError !== null && (
        <Text
          fontSize="xs"
          color="red.300"
          textAlign="center"
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
        >
          {addError}
        </Text>
      )}
    </Box>
  )
}
