import { Box, HStack } from '@chakra-ui/react'
import { faImage, faTextHeight, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useLayoutEffect, useRef, useState } from 'react'
import { previewFrameMaxWidth, toolbarControlSize } from '../../layout'
import type { ExportFormat, TitlePosition } from '../../types'
import { DeleteFrameDialog } from '../DeleteFrameDialog/DeleteFrameDialog'
import type { FrameCanvasProps } from '../FrameCanvas'
import { FrameCanvas } from '../FrameCanvas'
import { ToolbarIconButton } from '../ToolbarIconButton'
import { FrameTitleOverlay } from './FrameTitleOverlay'

const frameActionsRightOffset = `calc(${toolbarControlSize} / 2 + var(--chakra-spacing-2))`

export interface ScreenshotFrameProps {
  screenshotUrl: string
  fileName: string
  format: ExportFormat
  gradientConfig: FrameCanvasProps['gradientConfig']
  showBezel: boolean
  title: string
  titlePosition: TitlePosition
  onReplace: (file: File) => Promise<void> | void
  onDelete: () => void
  onTitleChange: (title: string) => void
  onToggleTitlePosition: () => void
}

export const ScreenshotFrame = ({
  screenshotUrl,
  fileName,
  format,
  gradientConfig,
  showBezel,
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [canvasWidth, setCanvasWidth] = useState(0)
  const [fontReady, setFontReady] = useState(false)
  const [canvasRendered, setCanvasRendered] = useState(false)

  useLayoutEffect(() => {
    const preview = previewRef.current
    if (!preview) {
      return undefined
    }

    const updateWidth = () => {
      const width = preview.clientWidth
      if (width > 0) {
        setCanvasWidth(width)
      }
    }

    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(preview)

    return () => {
      observer.disconnect()
    }
  }, [format.height, format.width])

  useLayoutEffect(() => {
    setCanvasRendered(false)
  }, [format, gradientConfig.baseColor, screenshotUrl, showBezel])

  const isPreviewReady = canvasWidth > 0 && fontReady && canvasRendered

  const handleReplaceClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (file === undefined) {
      return
    }

    void onReplace(file)
  }

  const handlePreviewClick = () => {
    setIsEditing(true)
  }

  const handleEditEnd = () => {
    setIsEditing(false)
  }

  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true)
  }

  return (
    <Box display="flex" flexShrink={0} h="full" alignItems="center">
      <Box
        aspectRatio={`${format.width} / ${format.height}`}
        flexShrink={0}
        h="full"
        maxH={`calc(${previewFrameMaxWidth} * ${format.height} / ${format.width})`}
        opacity={isPreviewReady ? 1 : 0}
        pointerEvents={isPreviewReady ? 'auto' : 'none'}
        position="relative"
        visibility={isPreviewReady ? 'visible' : 'hidden'}
      >
        <DeleteFrameDialog
          open={deleteDialogOpen}
          fileName={fileName}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={onDelete}
        />
        <Box
          ref={previewRef}
          borderRadius="14px"
          cursor={isEditing ? 'text' : 'pointer'}
          h="full"
          overflow="hidden"
          position="relative"
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
            showBezel={showBezel}
            title={title}
            titlePosition={titlePosition}
            onRendered={() => {
              setCanvasRendered(true)
            }}
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
            onFontReady={() => {
              setFontReady(true)
            }}
          />
        </Box>
        <HStack
          gap={2}
          position="absolute"
          right={frameActionsRightOffset}
          top={0}
          transform="translateY(-50%)"
          zIndex={2}
        >
          <ToolbarIconButton aria-label="Toggle title position" onClick={onToggleTitlePosition}>
            <FontAwesomeIcon icon={faTextHeight} />
          </ToolbarIconButton>
          <ToolbarIconButton aria-label="Replace screenshot" onClick={handleReplaceClick}>
            <FontAwesomeIcon icon={faImage} />
          </ToolbarIconButton>
        </HStack>
        <Box position="absolute" right={0} top={0} transform="translate(50%, -50%)" zIndex={2}>
          <ToolbarIconButton
            aria-label="Delete screenshot"
            tone="destructive"
            onClick={handleOpenDeleteDialog}
          >
            <FontAwesomeIcon icon={faTrash} />
          </ToolbarIconButton>
        </Box>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
      </Box>
    </Box>
  )
}
