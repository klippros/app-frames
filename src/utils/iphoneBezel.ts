import iphoneBezelBottom from '../assets/iPhone 17 Pro - bottom.png'
import iphoneBezelCenter from '../assets/iPhone 17 Pro - center.png'
import iphoneBezelTop from '../assets/iPhone 17 Pro - top.png'
import { drawDropShadow } from './featureGraphicCanvas'
import { loadImage } from './loadImage'

export const BEZEL_ASSET_WIDTH = 450
export const BEZEL_SCREEN_WIDTH = 402
const BEZEL_SCREEN_HEIGHT = 874
export const BEZEL_TOP_HEIGHT = 440
export const BEZEL_CENTER_HEIGHT = 342
export const BEZEL_BOTTOM_HEIGHT = 138

const BEZEL_CHROME_TOTAL =
  BEZEL_TOP_HEIGHT + BEZEL_CENTER_HEIGHT + BEZEL_BOTTOM_HEIGHT - BEZEL_SCREEN_HEIGHT

export interface BezelLayout {
  bezelLeft: number
  bezelTop: number
  bezelWidth: number
  topHeight: number
  centerHeight: number
  bottomHeight: number
}

export interface IphoneBezelImages {
  top: HTMLImageElement
  center: HTMLImageElement
  bottom: HTMLImageElement
}

let cachedBezelImages: IphoneBezelImages | null = null

export function getBezelLayout(
  drawX: number,
  drawY: number,
  drawWidth: number,
  drawHeight: number,
): BezelLayout {
  const scale = drawWidth / BEZEL_SCREEN_WIDTH
  const bezelWidth = BEZEL_ASSET_WIDTH * scale
  const topHeight = BEZEL_TOP_HEIGHT * scale
  const bottomHeight = BEZEL_BOTTOM_HEIGHT * scale
  const centerHeight = Math.max(
    scale,
    drawHeight - (BEZEL_TOP_HEIGHT + BEZEL_BOTTOM_HEIGHT - BEZEL_CHROME_TOTAL) * scale,
  )
  const bezelTotalHeight = topHeight + centerHeight + bottomHeight

  return {
    bezelLeft: drawX - (bezelWidth - drawWidth) / 2,
    bezelTop: drawY - (bezelTotalHeight - drawHeight) / 2,
    bezelWidth,
    topHeight,
    centerHeight,
    bottomHeight,
  }
}

export async function loadIphoneBezelImages(): Promise<IphoneBezelImages> {
  if (cachedBezelImages) {
    return cachedBezelImages
  }

  const [top, center, bottom] = await Promise.all([
    loadImage(iphoneBezelTop),
    loadImage(iphoneBezelCenter),
    loadImage(iphoneBezelBottom),
  ])

  cachedBezelImages = { top, center, bottom }
  return cachedBezelImages
}

export function drawIphoneBezelShadow(ctx: CanvasRenderingContext2D, layout: BezelLayout): void {
  const bezelTotalHeight = layout.topHeight + layout.centerHeight + layout.bottomHeight

  drawDropShadow(
    ctx,
    layout.bezelLeft,
    layout.bezelTop,
    layout.bezelWidth,
    bezelTotalHeight,
    layout.bezelWidth * 0.105,
  )
}

export function drawIphoneBezel(
  ctx: CanvasRenderingContext2D,
  images: IphoneBezelImages,
  layout: BezelLayout,
): void {
  const { bezelLeft, bezelTop, bezelWidth, topHeight, centerHeight, bottomHeight } = layout

  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.drawImage(images.top, bezelLeft, bezelTop, bezelWidth, topHeight)

  const centerY = bezelTop + topHeight
  ctx.drawImage(images.center, bezelLeft, centerY, bezelWidth, centerHeight)

  const bottomY = centerY + centerHeight
  ctx.drawImage(images.bottom, bezelLeft, bottomY, bezelWidth, bottomHeight)

  ctx.restore()
}
