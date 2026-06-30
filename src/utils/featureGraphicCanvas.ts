import type { GradientConfig, OutputDimensions } from './featureGraphicConfig'

interface ImageLayout {
  x: number
  y: number
  width: number
  height: number
  borderRadius: number
}

interface ContainImageRect {
  drawX: number
  drawY: number
  drawWidth: number
  drawHeight: number
}

export function createFeatureGraphicCanvas(dimensions: OutputDimensions): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = dimensions.width
  canvas.height = dimensions.height
  return canvas
}

export function drawRadialBackground(
  context: CanvasRenderingContext2D,
  dimensions: OutputDimensions,
  gradientConfig: GradientConfig,
): void {
  const { width, height } = dimensions
  const highlightCenterX = width / 2
  const highlightCenterY = height * 0.2

  context.fillStyle = gradientConfig.baseColor
  context.fillRect(0, 0, width, height)

  const highlight = context.createRadialGradient(
    highlightCenterX,
    highlightCenterY,
    Math.min(width, height) * 0.06,
    highlightCenterX,
    highlightCenterY,
    Math.max(width, height) * 0.72,
  )
  highlight.addColorStop(0, `rgba(255,255,255,${gradientConfig.centerHighlightOpacity})`)
  highlight.addColorStop(0.5, gradientConfig.baseColor)
  highlight.addColorStop(1, gradientConfig.baseColor)
  context.fillStyle = highlight
  context.fillRect(0, 0, width, height)

  const vignette = context.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.15,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.9,
  )
  vignette.addColorStop(0.5, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, `rgba(0,0,0,${gradientConfig.edgeDarknessOpacity})`)
  context.fillStyle = vignette
  context.fillRect(0, 0, width, height)

  const bottomFade = context.createLinearGradient(0, 0, 0, height)
  bottomFade.addColorStop(0, 'rgba(0,0,0,0)')
  bottomFade.addColorStop(0.52, 'rgba(0,0,0,0.14)')
  bottomFade.addColorStop(1, 'rgba(0,0,0,0.48)')
  context.fillStyle = bottomFade
  context.fillRect(0, 0, width, height)
}

function getContainedImageRect(
  sourceWidth: number,
  sourceHeight: number,
  layout: ImageLayout,
): ContainImageRect {
  const scale = Math.min(layout.width / sourceWidth, layout.height / sourceHeight)
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale
  return {
    drawX: layout.x + (layout.width - drawWidth) / 2,
    drawY: layout.y + (layout.height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  }
}

export function drawRoundedImageContain(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  layout: ImageLayout,
): void {
  const { drawX, drawY, drawWidth, drawHeight } = getContainedImageRect(
    sourceWidth,
    sourceHeight,
    layout,
  )

  const minSide = Math.min(drawWidth, drawHeight)
  const shadowBlur = Math.max(18, Math.round(minSide * 0.05))
  const shadowOffsetY = Math.max(6, Math.round(shadowBlur * 0.38))

  context.save()
  context.shadowColor = 'rgba(0, 0, 0, 0.33)'
  context.shadowBlur = shadowBlur
  context.shadowOffsetX = 0
  context.shadowOffsetY = shadowOffsetY
  context.fillStyle = '#ffffff'
  context.beginPath()
  context.roundRect(drawX, drawY, drawWidth, drawHeight, layout.borderRadius)
  context.fill()
  context.restore()

  context.save()
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.beginPath()
  context.roundRect(drawX, drawY, drawWidth, drawHeight, layout.borderRadius)
  context.clip()
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight)
  context.restore()
}
