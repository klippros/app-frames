import type { RendererId, Screenshot, TitlePosition } from '../types'
import type { Rect } from './titleTextLayout'

export const DEFAULT_FRAME_TITLE = 'Click here\nto edit title'
export const TEXT_BAND_HEIGHT_RATIO = 0.2
export const TITLE_COLOR = '#ffffff'
export const PREVIEW_CANVAS_MAX_WIDTH = 320

export {
  canonicalizeTitleInput,
  constrainTitleInput,
  getTitleBlockOffset,
  isTitleInputAcceptable,
  isTitleInputValid,
  layoutTitleLines,
  MAX_LINES,
  measureTitleText,
} from './titleTextLayout'
export type { Rect } from './titleTextLayout'

const PADDING_RATIO = 0.085
const IOS_PADDING_RATIO = 0.115
const BORDER_RADIUS_RATIO = 0.045
const TEXT_HORIZONTAL_PADDING_RATIO = 0.1
const FONT_SIZE_RATIO = 0.23
const LINE_HEIGHT_RATIO = 1.15

export interface FrameLayout {
  textBand: Rect
  textContentArea: Rect
  screenshotRect: Rect & { borderRadius: number }
  fontSize: number
  lineHeight: number
  maxTextWidth: number
  textHorizontalPadding: number
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
