import type { RendererId, TitlePosition } from '../../types'
import type { GradientConfig } from '../featureGraphicConfig'
import { featureGraphicGradient } from '../featureGraphicConfig'
import { getFrameLayout } from '../frameTitle'
import { drawRadialBackground, drawRoundedImageContain } from '../featureGraphicCanvas'
import { drawFrameTitle } from './drawFrameTitle'

export interface StoreScreenshotOptions {
  title?: string
  titlePosition?: TitlePosition
  drawTitle?: boolean
  renderer?: RendererId
}

export async function drawStoreScreenshot(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  gradientConfig: GradientConfig = featureGraphicGradient,
  options: StoreScreenshotOptions = {},
) {
  const { title = '', titlePosition = 'top', drawTitle = true, renderer } = options

  drawRadialBackground(ctx, { width, height }, gradientConfig)

  const layout = getFrameLayout(width, height, titlePosition, renderer)
  const { screenshotRect } = layout

  drawRoundedImageContain(ctx, image, image.naturalWidth, image.naturalHeight, {
    x: screenshotRect.x,
    y: screenshotRect.y,
    width: screenshotRect.width,
    height: screenshotRect.height,
    borderRadius: screenshotRect.borderRadius,
  })

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
