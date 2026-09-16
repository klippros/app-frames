import { TITLE_FONT_FAMILY } from './titleFont'

export const MAX_LINES = 3

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface WrapResult {
  lines: string[]
  overflow: boolean
}

let measureCanvas: HTMLCanvasElement | null = null

const getMeasureContext = (fontSize: number): CanvasRenderingContext2D => {
  measureCanvas ??= document.createElement('canvas')

  const context = measureCanvas.getContext('2d')
  if (!context) {
    throw new Error('Failed to get canvas context')
  }

  context.font = `${fontSize}px ${TITLE_FONT_FAMILY}`
  return context
}

export const measureTitleText = (text: string, fontSize: number): number =>
  getMeasureContext(fontSize).measureText(text).width

export const getTitleBlockOffset = (
  textContentArea: Rect,
  lineCount: number,
  lineHeight: number,
): number => {
  const blockHeight = lineCount * lineHeight
  return textContentArea.y + (textContentArea.height - blockHeight) / 2
}

const wrapSegment = (
  text: string,
  maxWidth: number,
  fontSize: number,
  maxLines: number,
): WrapResult => {
  if (maxLines <= 0) {
    return { lines: [], overflow: text.length > 0 }
  }

  if (!text) {
    return { lines: [''], overflow: false }
  }

  const context = getMeasureContext(fontSize)
  const lines: string[] = []
  let current = ''
  let overflow = false

  const pushCurrent = () => {
    lines.push(current)
    current = ''
  }

  const pushChar = (char: string): boolean => {
    const next = current + char
    if (context.measureText(next).width <= maxWidth) {
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
    if (context.measureText(current).width > maxWidth) {
      overflow = true
      return false
    }

    return lines.length < maxLines
  }

  const words = text.match(/\S+|\s+/gu) ?? []

  for (const part of words) {
    if (overflow) {
      break
    }

    if (/^\s+$/u.test(part)) {
      if (current && !current.endsWith(' ') && !pushChar(' ')) {
        break
      }
      continue
    }

    const candidate = current ? `${current}${current.endsWith(' ') ? '' : ' '}${part}` : part
    if (context.measureText(candidate).width <= maxWidth) {
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

    if (context.measureText(part).width <= maxWidth) {
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
    if (current && context.measureText(current).width > maxWidth) {
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

const layoutTitleLinesInternal = (
  rawText: string,
  maxWidth: number,
  fontSize: number,
): WrapResult => {
  const normalized = rawText.replace(/\r\n/gu, '\n').replace(/\r/gu, '\n')
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

export const layoutTitleLines = (rawText: string, maxWidth: number, fontSize: number): string[] => {
  const { lines } = layoutTitleLinesInternal(rawText, maxWidth, fontSize)
  return lines.length === 0 ? [''] : lines
}

export const isTitleInputAcceptable = (
  rawText: string,
  maxWidth: number,
  fontSize: number,
): boolean => {
  const normalized = rawText.replace(/\r\n/gu, '\n').replace(/\r/gu, '\n')
  if (normalized.split('\n').length > MAX_LINES) {
    return false
  }

  const { overflow, lines } = layoutTitleLinesInternal(normalized, maxWidth, fontSize)
  if (overflow || lines.length > MAX_LINES) {
    return false
  }

  const context = getMeasureContext(fontSize)
  return lines.every((line) => context.measureText(line).width <= maxWidth)
}

export const canonicalizeTitleInput = (
  rawText: string,
  maxWidth: number,
  fontSize: number,
): string => layoutTitleLines(rawText, maxWidth, fontSize).join('\n')

export const isTitleInputValid = (rawText: string, maxWidth: number, fontSize: number): boolean =>
  rawText === canonicalizeTitleInput(rawText, maxWidth, fontSize)

export const constrainTitleInput = (
  rawText: string,
  maxWidth: number,
  fontSize: number,
  previousText?: string,
): string => {
  const normalized = rawText.replace(/\r\n/gu, '\n').replace(/\r/gu, '\n')

  if (!isTitleInputAcceptable(normalized, maxWidth, fontSize)) {
    return previousText ?? canonicalizeTitleInput(normalized, maxWidth, fontSize)
  }

  return canonicalizeTitleInput(normalized, maxWidth, fontSize)
}
