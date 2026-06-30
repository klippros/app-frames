import type { RendererId } from '../../types'
import type { GradientConfig } from '../featureGraphicConfig'
import { featureGraphicGradient } from '../featureGraphicConfig'
import { drawFeatureGraphic } from './featureGraphic'
import { drawStoreScreenshot, type StoreScreenshotOptions } from './screenshot'

export interface FramedScreenshotOptions extends StoreScreenshotOptions {}

export async function drawFramedScreenshot(
  renderer: RendererId,
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  gradientConfig: GradientConfig = featureGraphicGradient,
  options: FramedScreenshotOptions = {},
) {
  if (renderer === 'feature-graphic') {
    drawFeatureGraphic(ctx, [image], width, height, gradientConfig)
    return
  }

  await drawStoreScreenshot(ctx, image, width, height, gradientConfig, {
    ...options,
    renderer,
  })
}

export { drawFeatureGraphic, renderFeatureGraphicCanvas } from './featureGraphic'
export { drawStoreScreenshot } from './screenshot'
