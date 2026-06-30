import type { RendererId } from '../../types'
import { drawFeatureGraphic } from './featureGraphic'
import { drawStoreScreenshot } from './screenshot'

export function drawFramedScreenshot(
  renderer: RendererId,
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  if (renderer === 'feature-graphic') {
    drawFeatureGraphic(ctx, [image], width, height)
    return
  }

  drawStoreScreenshot(ctx, image, width, height)
}

export { drawFeatureGraphic, renderFeatureGraphicCanvas } from './featureGraphic'
export { drawStoreScreenshot } from './screenshot'
