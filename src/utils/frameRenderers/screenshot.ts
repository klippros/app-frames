import type { GradientConfig } from '../featureGraphicConfig'
import { featureGraphicGradient } from '../featureGraphicConfig'
import { drawRadialBackground, drawRoundedImageContain } from '../featureGraphicCanvas'

const PADDING_RATIO = 0.06
const BORDER_RADIUS_RATIO = 0.028

export function drawStoreScreenshot(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  gradientConfig: GradientConfig = featureGraphicGradient,
) {
  drawRadialBackground(ctx, { width, height }, gradientConfig)

  const padding = Math.min(width, height) * PADDING_RATIO
  const borderRadius = width * BORDER_RADIUS_RATIO

  drawRoundedImageContain(ctx, image, image.naturalWidth, image.naturalHeight, {
    x: padding,
    y: padding,
    width: width - padding * 2,
    height: height - padding * 2,
    borderRadius,
  })
}
