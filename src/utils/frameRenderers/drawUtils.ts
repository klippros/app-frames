export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export function drawContainedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  rect: Rect,
) {
  const imageAspect = image.naturalWidth / image.naturalHeight
  const rectAspect = rect.width / rect.height

  let drawWidth = rect.width
  let drawHeight = rect.height
  let drawX = rect.x
  let drawY = rect.y

  if (imageAspect > rectAspect) {
    drawHeight = rect.width / imageAspect
    drawY = rect.y + (rect.height - drawHeight) / 2
  } else {
    drawWidth = rect.height * imageAspect
    drawX = rect.x + (rect.width - drawWidth) / 2
  }

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)
}

export function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

export function canvasToJpegBlob(canvas: HTMLCanvasElement, quality = 0.92) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to export canvas as JPEG'))
        }
      },
      'image/jpeg',
      quality,
    )
  })
}
