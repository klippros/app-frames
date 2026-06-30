import {
  getTitleBlockOffset,
  layoutTitleLines,
  TITLE_COLOR,
  TITLE_FONT_FAMILY,
} from '../frameTitle'
import type { Rect } from '../frameTitle'

export async function ensureTitleFontLoaded(fontSize: number): Promise<void> {
  await document.fonts.load(`${fontSize}px ${TITLE_FONT_FAMILY}`)
}

export async function drawFrameTitle(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  textContentArea: Rect,
  fontSize: number,
  lineHeight: number,
  maxTextWidth: number,
  frameWidth: number,
): Promise<void> {
  await ensureTitleFontLoaded(fontSize)

  const lines = layoutTitleLines(rawText, maxTextWidth, fontSize)
  const startY = getTitleBlockOffset(textContentArea, lines.length, lineHeight)

  ctx.save()
  ctx.fillStyle = TITLE_COLOR
  ctx.font = `${fontSize}px ${TITLE_FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  for (const [index, line] of lines.entries()) {
    ctx.fillText(line, frameWidth / 2, startY + index * lineHeight)
  }

  ctx.restore()
}
