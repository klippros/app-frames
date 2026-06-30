import type { RendererId } from '../../types'
import type { GradientConfig } from '../featureGraphicConfig'
import { featureGraphicGradient } from '../featureGraphicConfig'
import { drawFeatureGraphic } from './featureGraphic'
import { drawStoreScreenshot } from './screenshot'

export function drawFramedScreenshot(
  renderer: RendererId,
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  gradientConfig: GradientConfig = featureGraphicGradient,
) {
  if (renderer === 'feature-graphic') {
    drawFeatureGraphic(ctx, [image], width, height, gradientConfig)
    return
  }

  drawStoreScreenshot(ctx, image, width, height, gradientConfig)
}

export { drawFeatureGraphic, renderFeatureGraphicCanvas } from './featureGraphic'
export { drawStoreScreenshot } from './screenshot'
