import type { RendererId, Screenshot, TitlePosition } from '../types'

export const DEFAULT_FRAME_TITLE = 'Click here\nto edit title'
export const TEXT_BAND_HEIGHT_RATIO = 0.2
export const MAX_LINES = 3
export const TITLE_FONT_FAMILY = "'Archivo Black', sans-serif"
export const TITLE_COLOR = '#ffffff'
export const PREVIEW_CANVAS_MAX_WIDTH = 320

const PADDING_RATIO = 0.085
const IOS_PADDING_RATIO = 0.115
const BORDER_RADIUS_RATIO = 0.045
const TEXT_HORIZONTAL_PADDING_RATIO = 0.1
const FONT_SIZE_RATIO = 0.23
const LINE_HEIGHT_RATIO = 1.15

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface FrameLayout {
  textBand: Rect
  textContentArea: Rect
  screenshotRect: Rect & { borderRadius: number }
  fontSize: number
  lineHeight: number
  maxTextWidth: number
  textHorizontalPadding: number
}

let measureCanvas: HTMLCanvasElement | null = null

function getMeasureContext(fontSize: number): CanvasRenderingContext2D {
  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas')
  }

  const ctx = measureCanvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  ctx.font = `${fontSize}px ${TITLE_FONT_FAMILY}`
  return ctx
}

export function measureTitleText(text: string, fontSize: number): number {
  return getMeasureContext(fontSize).measureText(text).width
}

export function getDefaultTitlePosition(index: number): TitlePosition {
  return index % 2 === 0 ? 'top' : 'bottom'
}

function getPaddingRatio(renderer?: RendererId): number {
  if (renderer === 'ios-phone' || renderer === 'ios-tablet') {
    return IOS_PADDING_RATIO
  }

  return PADDING_RATIO
}

export function getFrameLayout(
  width: number,
  height: number,
  titlePosition: TitlePosition,
  renderer?: RendererId,
): FrameLayout {
  const textBandHeight = height * TEXT_BAND_HEIGHT_RATIO
  const textBand: Rect =
    titlePosition === 'top'
      ? { x: 0, y: 0, width, height: textBandHeight }
      : { x: 0, y: height - textBandHeight, width, height: textBandHeight }

  const screenshotRegion: Rect =
    titlePosition === 'top'
      ? { x: 0, y: textBandHeight, width, height: height - textBandHeight }
      : { x: 0, y: 0, width, height: height - textBandHeight }

  const padding = Math.min(width, screenshotRegion.height) * getPaddingRatio(renderer)
  const borderRadius = width * BORDER_RADIUS_RATIO

  const fontSize = textBandHeight * FONT_SIZE_RATIO
  const lineHeight = fontSize * LINE_HEIGHT_RATIO
  const textHorizontalPadding = width * TEXT_HORIZONTAL_PADDING_RATIO
  const maxTextWidth = width - textHorizontalPadding * 2

  const screenshotRect = {
    x: screenshotRegion.x + padding,
    y: screenshotRegion.y + padding,
    width: width - padding * 2,
    height: screenshotRegion.height - padding * 2,
    borderRadius,
  }

  const textContentArea: Rect =
    titlePosition === 'top'
      ? { x: 0, y: 0, width, height: screenshotRect.y }
      : {
          x: 0,
          y: screenshotRect.y + screenshotRect.height,
          width,
          height: height - (screenshotRect.y + screenshotRect.height),
        }

  return {
    textBand,
    textContentArea,
    screenshotRect,
    fontSize,
    lineHeight,
    maxTextWidth,
    textHorizontalPadding,
  }
}

export function getTitleBlockOffset(
  textContentArea: Rect,
  lineCount: number,
  lineHeight: number,
): number {
  const blockHeight = lineCount * lineHeight
  return textContentArea.y + (textContentArea.height - blockHeight) / 2
}

interface WrapResult {
  lines: string[]
  overflow: boolean
}

function wrapSegment(
  text: string,
  maxWidth: number,
  fontSize: number,
  maxLines: number,
): WrapResult {
  if (maxLines <= 0) {
    return { lines: [], overflow: text.length > 0 }
  }

  if (!text) {
    return { lines: [''], overflow: false }
  }

  const ctx = getMeasureContext(fontSize)
  const lines: string[] = []
  let current = ''
  let overflow = false

  const pushCurrent = () => {
    lines.push(current)
    current = ''
  }

  const pushChar = (char: string): boolean => {
    const next = current + char
    if (ctx.measureText(next).width <= maxWidth) {
      current = next
      return true
    }

    if (current) {
      pushCurrent()
      if (lines.length >= maxLines) {
        overflow = true
        return false
      }
      return pushChar(char)
    }

    current = char
    if (ctx.measureText(current).width > maxWidth) {
      overflow = true
      return false
    }

    return lines.length < maxLines
  }

  const words = text.split(/(\s+)/).filter((part) => part.length > 0)

  for (const part of words) {
    if (overflow) {
      break
    }

    if (/^\s+$/.test(part)) {
      if (current && !current.endsWith(' ')) {
        if (!pushChar(' ')) {
          break
        }
      }
      continue
    }

    const candidate = current ? `${current}${current.endsWith(' ') ? '' : ' '}${part}` : part
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
      continue
    }

    if (current) {
      pushCurrent()
      if (lines.length >= maxLines) {
        overflow = true
        break
      }
    }

    if (ctx.measureText(part).width <= maxWidth) {
      current = part
      continue
    }

    for (const char of part) {
      if (!pushChar(char)) {
        break
      }
    }

    if (lines.length >= maxLines && current) {
      overflow = true
      break
    }
  }

  if (!overflow && lines.length < maxLines && (current || lines.length === 0)) {
    if (current && ctx.measureText(current).width > maxWidth) {
      overflow = true
    } else {
      lines.push(current)
    }
  } else if (!overflow && lines.length >= maxLines && current) {
    overflow = true
  }

  return {
    lines: lines.slice(0, maxLines),
    overflow,
  }
}

function layoutTitleLinesInternal(
  rawText: string,
  maxWidth: number,
  fontSize: number,
): WrapResult {
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const explicitLines = normalized.split('\n')

  if (explicitLines.length > MAX_LINES) {
    return { lines: [], overflow: true }
  }

  const displayLines: string[] = []
  let overflow = false

  for (const segment of explicitLines) {
    const remaining = MAX_LINES - displayLines.length
    if (remaining <= 0) {
      overflow = true
      break
    }

    const wrapped = wrapSegment(segment, maxWidth, fontSize, remaining)
    displayLines.push(...wrapped.lines)
    overflow ||= wrapped.overflow

    if (displayLines.length >= MAX_LINES && wrapped.overflow) {
      break
    }
  }

  if (displayLines.length === 0 && !overflow) {
    return { lines: [''], overflow: false }
  }

  return {
    lines: displayLines.slice(0, MAX_LINES),
    overflow,
  }
}

export function layoutTitleLines(
  rawText: string,
  maxWidth: number,
  fontSize: number,
): string[] {
  const { lines } = layoutTitleLinesInternal(rawText, maxWidth, fontSize)
  if (lines.length === 0) {
    return ['']
  }

  return lines
}

export function isTitleInputAcceptable(
  rawText: string,
  maxWidth: number,
  fontSize: number,
): boolean {
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (normalized.split('\n').length > MAX_LINES) {
    return false
  }

  const { overflow, lines } = layoutTitleLinesInternal(normalized, maxWidth, fontSize)
  if (overflow || lines.length > MAX_LINES) {
    return false
  }

  const ctx = getMeasureContext(fontSize)
  return lines.every((line) => ctx.measureText(line).width <= maxWidth)
}

export function canonicalizeTitleInput(
  rawText: string,
  maxWidth: number,
  fontSize: number,
): string {
  return layoutTitleLines(rawText, maxWidth, fontSize).join('\n')
}

export function isTitleInputValid(rawText: string, maxWidth: number, fontSize: number): boolean {
  return rawText === canonicalizeTitleInput(rawText, maxWidth, fontSize)
}

export function constrainTitleInput(
  rawText: string,
  maxWidth: number,
  fontSize: number,
  previousText?: string,
): string {
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  if (!isTitleInputAcceptable(normalized, maxWidth, fontSize)) {
    return previousText ?? canonicalizeTitleInput(normalized, maxWidth, fontSize)
  }

  return canonicalizeTitleInput(normalized, maxWidth, fontSize)
}

export function createScreenshot(file: File, index: number): Screenshot {
  return {
    id: crypto.randomUUID(),
    file,
    url: URL.createObjectURL(file),
    title: DEFAULT_FRAME_TITLE,
    titlePosition: getDefaultTitlePosition(index),
  }
}

export function getPreviewScale(frameWidth: number, renderedWidth: number): number {
  return renderedWidth / frameWidth
}
