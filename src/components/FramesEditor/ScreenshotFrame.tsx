import { Box, HStack } from '@chakra-ui/react'
import { faImage, faTextHeight, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useRef, useState } from 'react'
import type { ExportFormat, TitlePosition } from '../../types'
import type { GradientConfig } from '../../utils/featureGraphicConfig'
import { FrameCanvas } from '../FrameCanvas'
import { ToolbarIconButton } from '../ToolbarIconButton'
import { FrameTitleOverlay } from './FrameTitleOverlay'

export interface ScreenshotFrameProps {
  screenshotUrl: string
  format: ExportFormat
  gradientConfig: GradientConfig
  title: string
  titlePosition: TitlePosition
  onReplace: (file: File) => void
  onDelete: () => void
  onTitleChange: (title: string) => void
  onToggleTitlePosition: () => void
}

export const ScreenshotFrame = ({
  screenshotUrl,
  format,
  gradientConfig,
  title,
  titlePosition,
  onReplace,
  onDelete,
  onTitleChange,
  onToggleTitlePosition,
}: ScreenshotFrameProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [canvasWidth, setCanvasWidth] = useState(format.width)

  useEffect(() => {
    const preview = previewRef.current
    if (!preview) {
      return undefined
    }

    const updateWidth = () => {
      const canvas = preview.querySelector('canvas')
      if (canvas) {
        setCanvasWidth(canvas.clientWidth)
      }
    }

    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(preview)

    return () => {
      observer.disconnect()
    }
  }, [format.width, screenshotUrl, title, titlePosition])

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

  const handlePreviewClick = () => {
    setIsEditing(true)
  }

  const handleEditEnd = () => {
    setIsEditing(false)
  }

  return (
    <Box flexShrink={0}>
      <HStack justify="center" gap={2} mb={2}>
        <ToolbarIconButton
          aria-label="Toggle title position"
          aria-pressed={titlePosition === 'bottom'}
          onClick={onToggleTitlePosition}
        >
          <FontAwesomeIcon icon={faTextHeight} />
        </ToolbarIconButton>
        <ToolbarIconButton aria-label="Replace screenshot" onClick={handleReplaceClick}>
          <FontAwesomeIcon icon={faImage} />
        </ToolbarIconButton>
        <ToolbarIconButton aria-label="Delete screenshot" onClick={onDelete}>
          <FontAwesomeIcon icon={faTrash} />
        </ToolbarIconButton>
      </HStack>
      <Box
        ref={previewRef}
        borderRadius="14px"
        cursor={isEditing ? 'text' : 'pointer'}
        overflow="hidden"
        position="relative"
        role="group"
        onClick={handlePreviewClick}
        onMouseEnter={() => {
          setIsHovered(true)
        }}
        onMouseLeave={() => {
          setIsHovered(false)
        }}
      >
        <FrameCanvas
          screenshotUrl={screenshotUrl}
          format={format}
          gradientConfig={gradientConfig}
          title={title}
          titlePosition={titlePosition}
        />
        <FrameTitleOverlay
          title={title}
          titlePosition={titlePosition}
          format={format}
          canvasWidth={canvasWidth}
          isEditing={isEditing}
          isHovered={isHovered}
          onTitleChange={onTitleChange}
          onEditEnd={handleEditEnd}
        />
      </Box>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
    </Box>
  )
}
