import type { RendererId, TitlePosition } from '../../types'
import type { GradientConfig } from '../featureGraphicConfig'
import { featureGraphicGradient } from '../featureGraphicConfig'
import { getContainedImageRect, drawRadialBackground, drawRoundedImageContain } from '../featureGraphicCanvas'
import { getFrameLayout } from '../frameTitle'
import { drawIphoneBezel, drawIphoneBezelShadow, getBezelLayout, loadIphoneBezelImages } from '../iphoneBezel'
import { drawFrameTitle } from './drawFrameTitle'

export interface StoreScreenshotOptions {
  title?: string
  titlePosition?: TitlePosition
  drawTitle?: boolean
  renderer?: RendererId
  showBezel?: boolean
}

export async function drawStoreScreenshot(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  gradientConfig: GradientConfig = featureGraphicGradient,
  options: StoreScreenshotOptions = {},
) {
  const {
    title = '',
    titlePosition = 'top',
    drawTitle = true,
    renderer,
    showBezel = true,
  } = options

  drawRadialBackground(ctx, { width, height }, gradientConfig)

  const layout = getFrameLayout(width, height, titlePosition, renderer)
  const { screenshotRect } = layout

  const imageLayout = {
    x: screenshotRect.x,
    y: screenshotRect.y,
    width: screenshotRect.width,
    height: screenshotRect.height,
    borderRadius: screenshotRect.borderRadius,
  }

  const containedRect = getContainedImageRect(
    image.naturalWidth,
    image.naturalHeight,
    imageLayout,
  )

  const bezelLayout = showBezel
    ? getBezelLayout(
        containedRect.drawX,
        containedRect.drawY,
        containedRect.drawWidth,
        containedRect.drawHeight,
      )
    : null

  if (bezelLayout) {
    drawIphoneBezelShadow(ctx, bezelLayout)
  }

  drawRoundedImageContain(ctx, image, image.naturalWidth, image.naturalHeight, imageLayout, {
    drawShadow: !showBezel,
  })

  if (bezelLayout) {
    const bezelImages = await loadIphoneBezelImages()
    drawIphoneBezel(ctx, bezelImages, bezelLayout)
  }

  if (drawTitle && title) {
    await drawFrameTitle(
      ctx,
      title,
      layout.textContentArea,
      layout.fontSize,
      layout.lineHeight,
      layout.maxTextWidth,
      width,
    )
  }
}
