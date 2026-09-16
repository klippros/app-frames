import { Box } from '@chakra-ui/react'
import type { CSSProperties } from 'react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ExportFormat, TitlePosition } from '../../types'
import {
  constrainTitleInput,
  getFrameLayout,
  layoutTitleLines,
  MAX_LINES,
  TITLE_COLOR,
} from '../../utils/frameTitle'
import { ensureTitleFontLoaded, isTitleFontReady, TITLE_FONT_FAMILY } from '../../utils/titleFont'

export interface FrameTitleOverlayProps {
  title: string
  titlePosition: TitlePosition
  format: ExportFormat
  canvasWidth: number
  isEditing: boolean
  isHovered: boolean
  onTitleChange: (title: string) => void
  onEditEnd: () => void
  onFontReady: () => void
}

const HOVER_FONT_SCALE = 1.06

export const FrameTitleOverlay = ({
  title,
  titlePosition,
  format,
  canvasWidth,
  isEditing,
  isHovered,
  onTitleChange,
  onEditEnd,
  onFontReady,
}: FrameTitleOverlayProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const onFontReadyRef = useRef(onFontReady)
  onFontReadyRef.current = onFontReady
  const [fontReady, setFontReady] = useState(() => isTitleFontReady())

  const layout = useMemo(
    () => getFrameLayout(format.width, format.height, titlePosition, format.renderer),
    [format.height, format.renderer, format.width, titlePosition],
  )

  const scale = canvasWidth / format.width
  const hoverFontScale = isHovered && !isEditing ? HOVER_FONT_SCALE : 1
  const scaledFontSize = layout.fontSize * scale
  const scaledLineHeight = layout.lineHeight * scale
  const horizontalPadding = layout.textHorizontalPadding * scale
  const displayLines = useMemo(
    () => (fontReady ? layoutTitleLines(title, layout.maxTextWidth, layout.fontSize) : ['']),
    [fontReady, layout.fontSize, layout.maxTextWidth, title],
  )
  const displayText = displayLines.map((line) => line || '\u00A0').join('\n')
  const textAreaTop = layout.textContentArea.y * scale
  const textAreaHeight = layout.textContentArea.height * scale
  const isLaidOut = canvasWidth > 0 && fontReady

  useLayoutEffect(() => {
    if (fontReady) {
      onFontReadyRef.current()
      return undefined
    }

    let cancelled = false

    void (async () => {
      await ensureTitleFontLoaded()
      if (!cancelled) {
        setFontReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [fontReady])

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus()
      textareaRef.current?.select()
    }
  }, [isEditing])

  const sharedTextStyle: CSSProperties = {
    color: TITLE_COLOR,
    fontFamily: TITLE_FONT_FAMILY,
    fontSize: `${scaledFontSize}px`,
    lineHeight: `${scaledLineHeight}px`,
    textAlign: 'center',
    width: '100%',
    whiteSpace: 'pre',
    overflow: 'hidden',
    transform: hoverFontScale === 1 ? undefined : `scale(${hoverFontScale})`,
    transition: 'transform 150ms ease',
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

  if (!isLaidOut) {
    return null
  }

  return (
    <Box
      alignItems="center"
      display="flex"
      justifyContent="center"
      left={0}
      pointerEvents={isEditing ? 'auto' : 'none'}
      position="absolute"
      top={`${textAreaTop}px`}
      h={`${textAreaHeight}px`}
      w="100%"
      zIndex={1}
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
            onTitleChange(constrainTitleInput(merged, layout.maxTextWidth, layout.fontSize, title))
          }}
          style={{
            ...sharedTextStyle,
            background: 'transparent',
            border: 'none',
            display: 'block',
            margin: 0,
            minHeight: `${displayLines.length * scaledLineHeight}px`,
            outline: 'none',
            padding: `0 ${horizontalPadding}px`,
            resize: 'none',
            transform: undefined,
            transition: undefined,
          }}
        />
      ) : (
        <Box aria-hidden px={`${horizontalPadding}px`} style={sharedTextStyle}>
          {displayText}
        </Box>
      )}
    </Box>
  )
}
