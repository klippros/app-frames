import { Box, HStack } from '@chakra-ui/react'
import { faImage, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useRef } from 'react'
import type { ExportFormat } from '../../types'
import type { GradientConfig } from '../../utils/featureGraphicConfig'
import { FrameCanvas } from '../FrameCanvas'
import { ToolbarIconButton } from '../ToolbarIconButton'

export interface ScreenshotFrameProps {
  screenshotUrl: string
  format: ExportFormat
  gradientConfig: GradientConfig
  onReplace: (file: File) => void
  onDelete: () => void
}

export const ScreenshotFrame = ({
  screenshotUrl,
  format,
  gradientConfig,
  onReplace,
  onDelete,
}: ScreenshotFrameProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleReplaceClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file === undefined || !file.type.startsWith('image/')) {
      return
    }

    onReplace(file)
    event.target.value = ''
  }

  return (
    <Box flexShrink={0}>
      <HStack justify="center" gap={2} mb={2}>
        <ToolbarIconButton aria-label="Replace screenshot" onClick={handleReplaceClick}>
          <FontAwesomeIcon icon={faImage} />
        </ToolbarIconButton>
        <ToolbarIconButton aria-label="Delete screenshot" onClick={onDelete}>
          <FontAwesomeIcon icon={faTrash} />
        </ToolbarIconButton>
      </HStack>
      <FrameCanvas screenshotUrl={screenshotUrl} format={format} gradientConfig={gradientConfig} />
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
    </Box>
  )
}
