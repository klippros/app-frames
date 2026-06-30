import { Box } from '@chakra-ui/react'
import { useEffect, useMemo, useRef } from 'react'
import type { ExportFormat, TitlePosition } from '../../types'
import {
  constrainTitleInput,
  getFrameLayout,
  getTitleBlockOffset,
  layoutTitleLines,
  MAX_LINES,
  TITLE_COLOR,
  TITLE_FONT_FAMILY,
} from '../../utils/frameTitle'

export interface FrameTitleOverlayProps {
  title: string
  titlePosition: TitlePosition
  format: ExportFormat
  canvasWidth: number
  isEditing: boolean
  isHovered: boolean
  onTitleChange: (title: string) => void
  onEditEnd: () => void
}

export const FrameTitleOverlay = ({
  title,
  titlePosition,
  format,
  canvasWidth,
  isEditing,
  isHovered,
  onTitleChange,
  onEditEnd,
}: FrameTitleOverlayProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const layout = useMemo(
    () => getFrameLayout(format.width, format.height, titlePosition, format.renderer),
    [format.height, format.renderer, format.width, titlePosition],
  )

  const scale = canvasWidth / format.width
  const scaledFontSize = layout.fontSize * scale
  const scaledLineHeight = layout.lineHeight * scale
  const displayLines = useMemo(
    () => layoutTitleLines(title, layout.maxTextWidth, layout.fontSize),
    [layout.fontSize, layout.maxTextWidth, title],
  )
  const blockOffsetY =
    getTitleBlockOffset(layout.textContentArea, displayLines.length, layout.lineHeight) * scale
  const textAreaTop = layout.textContentArea.y * scale
  const textAreaHeight = layout.textContentArea.height * scale

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus()
      textareaRef.current?.select()
    }
  }, [isEditing])

  const sharedTextStyle = {
    color: TITLE_COLOR,
    fontFamily: TITLE_FONT_FAMILY,
    fontSize: `${scaledFontSize}px`,
    lineHeight: `${scaledLineHeight}px`,
    textAlign: 'center' as const,
    width: '100%',
    whiteSpace: 'pre' as const,
    overflow: 'hidden' as const,
  }

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = constrainTitleInput(
      event.target.value,
      layout.maxTextWidth,
      layout.fontSize,
      title,
    )
    onTitleChange(next)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onEditEnd()
      return
    }

    if (event.key === 'Enter' && title.split('\n').length >= MAX_LINES) {
      event.preventDefault()
    }
  }

  return (
    <Box
      left={0}
      pointerEvents={isEditing ? 'auto' : 'none'}
      position="absolute"
      top={`${textAreaTop}px`}
      h={`${textAreaHeight}px`}
      w="100%"
      zIndex={1}
    >
      <Box
        left={0}
        position="absolute"
        top={`${blockOffsetY - textAreaTop}px`}
        transform={isHovered && !isEditing ? 'scale(1.06)' : 'scale(1)'}
        transition="transform 150ms ease"
        transformOrigin="center center"
        w="100%"
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            rows={Math.min(displayLines.length, MAX_LINES)}
            value={title}
            onBlur={onEditEnd}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={(event) => {
              event.preventDefault()
              const pasted = event.clipboardData.getData('text')
              const textarea = textareaRef.current
              if (!textarea) {
                return
              }

              const start = textarea.selectionStart
              const end = textarea.selectionEnd
              const merged = `${title.slice(0, start)}${pasted}${title.slice(end)}`
              onTitleChange(
                constrainTitleInput(merged, layout.maxTextWidth, layout.fontSize, title),
              )
            }}
            style={{
              ...sharedTextStyle,
              background: 'transparent',
              border: 'none',
              display: 'block',
              margin: 0,
              minHeight: `${displayLines.length * scaledLineHeight}px`,
              outline: 'none',
              padding: `0 ${layout.textHorizontalPadding * scale}px`,
              resize: 'none',
            }}
          />
        ) : (
          <Box
            aria-hidden
            px={`${layout.textHorizontalPadding * scale}px`}
            {...sharedTextStyle}
          >
            {displayLines.map((line, index) => (
              <Box key={`${index}-${line}`} h={`${scaledLineHeight}px`}>
                {line || '\u00A0'}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}
