import {
  featureGraphicConfig,
  featureGraphicGradient,
  type FeatureGraphicConfig,
} from '../featureGraphicConfig'
import {
  createFeatureGraphicCanvas,
  drawRadialBackground,
  drawRoundedImageContain,
} from '../featureGraphicCanvas'

/** Render wider, then downscale to output size to reduce aliasing on scaled / rotated UI screenshots. */
const FEATURE_GRAPHIC_SUPER_SAMPLE = 2

/**
 * With an odd count, one card sits exactly at the arc peak (normalized offset 0) and reads as a tall “hero”.
 * Even counts only have pairs around the middle, which looks more balanced — nudge the sole center card down
 * to roughly match that inner-row height.
 */
const ODD_COUNT_CENTER_ARC_NORMALIZED = 0.28

interface LoadedScreenshot {
  image: HTMLImageElement
  width: number
  height: number
}

function scaleFeatureGraphicConfig(
  config: FeatureGraphicConfig,
  factor: number,
): FeatureGraphicConfig {
  return {
    dimensions: {
      width: Math.round(config.dimensions.width * factor),
      height: Math.round(config.dimensions.height * factor),
    },
    centerX: config.centerX * factor,
    centerY: config.centerY * factor,
    screenshotHeight: config.screenshotHeight * factor,
    screenshotRadius: config.screenshotRadius * factor,
    fanAngleRange: config.fanAngleRange,
    fanSpreadPx: config.fanSpreadPx * factor,
    fanDropPx: config.fanDropPx * factor,
    sidePaddingPx: config.sidePaddingPx * factor,
  }
}

function downscaleFeatureGraphicCanvas(
  source: HTMLCanvasElement,
  outputDimensions: { width: number; height: number },
): HTMLCanvasElement {
  if (source.width === outputDimensions.width && source.height === outputDimensions.height) {
    return source
  }

  const out = createFeatureGraphicCanvas(outputDimensions)
  const ctx = out.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    source,
    0,
    0,
    source.width,
    source.height,
    0,
    0,
    outputDimensions.width,
    outputDimensions.height,
  )
  return out
}

function toLoadedScreenshots(images: HTMLImageElement[]): LoadedScreenshot[] {
  return images.map((image) => ({
    image,
    width: image.naturalWidth,
    height: image.naturalHeight,
  }))
}

export function renderFeatureGraphicCanvas(
  images: HTMLImageElement[],
  outputDimensions = featureGraphicConfig.dimensions,
): HTMLCanvasElement {
  const config = {
    ...featureGraphicConfig,
    dimensions: outputDimensions,
    centerX:
      (outputDimensions.width / featureGraphicConfig.dimensions.width) *
      featureGraphicConfig.centerX,
    centerY:
      (outputDimensions.height / featureGraphicConfig.dimensions.height) *
      featureGraphicConfig.centerY,
    screenshotHeight:
      (outputDimensions.height / featureGraphicConfig.dimensions.height) *
      featureGraphicConfig.screenshotHeight,
    screenshotRadius:
      (outputDimensions.width / featureGraphicConfig.dimensions.width) *
      featureGraphicConfig.screenshotRadius,
    fanSpreadPx:
      (outputDimensions.width / featureGraphicConfig.dimensions.width) *
      featureGraphicConfig.fanSpreadPx,
    fanDropPx:
      (outputDimensions.height / featureGraphicConfig.dimensions.height) *
      featureGraphicConfig.fanDropPx,
    sidePaddingPx:
      (outputDimensions.width / featureGraphicConfig.dimensions.width) *
      featureGraphicConfig.sidePaddingPx,
  }

  const hiConfig = scaleFeatureGraphicConfig(config, FEATURE_GRAPHIC_SUPER_SAMPLE)
  const hiCanvas = createFeatureGraphicCanvas(hiConfig.dimensions)
  const hiContext = hiCanvas.getContext('2d')
  if (!hiContext) {
    throw new Error('Failed to get canvas context')
  }

  hiContext.imageSmoothingEnabled = true
  hiContext.imageSmoothingQuality = 'high'
  drawRadialBackground(hiContext, hiConfig.dimensions, featureGraphicGradient)

  const loaded = toLoadedScreenshots(images)
  if (!loaded.length) {
    return downscaleFeatureGraphicCanvas(hiCanvas, outputDimensions)
  }

  const midpoint = (loaded.length - 1) / 2
  const maxOffset = Math.max(midpoint, 1)
  const targetHeights = loaded.map(() => hiConfig.screenshotHeight)
  const targetWidths = loaded.map((item, index) => {
    const scale = targetHeights[index] / item.height
    return item.width * scale
  })
  const maxHalfWidth = Math.max(...targetWidths) / 2
  const maxSpread =
    (hiConfig.dimensions.width / 2 - hiConfig.sidePaddingPx - maxHalfWidth) / maxOffset
  const spread = Math.min(hiConfig.fanSpreadPx, maxSpread)

  for (let index = 0; index < loaded.length; index += 1) {
    const item = loaded[index]
    const offsetFactor = index - midpoint
    const angleStep = loaded.length > 1 ? hiConfig.fanAngleRange / (loaded.length - 1) : 0
    const angle = offsetFactor * angleStep

    hiContext.save()
    let normalizedOffset = Math.abs(offsetFactor) / maxOffset
    const isOddCount = loaded.length >= 3 && loaded.length % 2 === 1
    if (isOddCount && offsetFactor === 0) {
      normalizedOffset = ODD_COUNT_CENTER_ARC_NORMALIZED
    }
    hiContext.translate(
      hiConfig.centerX + offsetFactor * spread,
      hiConfig.centerY + normalizedOffset * hiConfig.fanDropPx,
    )
    hiContext.rotate((Math.PI / 180) * angle)

    const targetHeight = targetHeights[index]
    const targetWidth = targetWidths[index]
    drawRoundedImageContain(hiContext, item.image, item.width, item.height, {
      x: -targetWidth / 2,
      y: -targetHeight / 2,
      width: targetWidth,
      height: targetHeight,
      borderRadius: hiConfig.screenshotRadius,
    })
    hiContext.restore()
  }

  return downscaleFeatureGraphicCanvas(hiCanvas, outputDimensions)
}

export function drawFeatureGraphic(
  ctx: CanvasRenderingContext2D,
  images: HTMLImageElement[],
  width: number,
  height: number,
) {
  const canvas = renderFeatureGraphicCanvas(images, { width, height })
  ctx.drawImage(canvas, 0, 0, width, height)
}
