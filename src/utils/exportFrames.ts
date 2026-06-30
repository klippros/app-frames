import JSZip from 'jszip'
import type { ExportFormat, Screenshot } from '../types'
import { EXPORT_FORMATS } from './exportFormats'
import { canvasToJpegBlob, createCanvas } from './frameRenderers/drawUtils'
import { drawFramedScreenshot, renderFeatureGraphicCanvas } from './frameRenderers'
import { loadImage } from './loadImage'

function padIndex(index: number) {
  return String(index + 1).padStart(2, '0')
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

async function renderFramedScreenshot(
  format: ExportFormat,
  image: HTMLImageElement,
  index: number,
) {
  const canvas = createCanvas(format.width, format.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  drawFramedScreenshot(format.renderer, ctx, image, format.width, format.height)
  const blob = await canvasToJpegBlob(canvas)
  return {
    path: `${format.store}/${format.folderName}/screenshot-${padIndex(index)}.jpg`,
    blob,
  }
}

async function renderFeatureGraphicExport(format: ExportFormat, images: HTMLImageElement[]) {
  const canvas = renderFeatureGraphicCanvas(images, {
    width: format.width,
    height: format.height,
  })
  const blob = await canvasToJpegBlob(canvas)
  return {
    path: `${format.store}/${format.folderName}.jpg`,
    blob,
  }
}

export async function exportAssets(screenshots: Screenshot[], selectedFormatIds: string[]) {
  const formats = EXPORT_FORMATS.filter((format) => selectedFormatIds.includes(format.id))
  if (formats.length === 0) {
    return
  }

  const images = await Promise.all(screenshots.map((screenshot) => loadImage(screenshot.url)))
  const zip = new JSZip()
  const entries: { path: string; blob: Blob }[] = []

  for (const format of formats) {
    if (format.kind === 'feature-graphic') {
      entries.push(await renderFeatureGraphicExport(format, images))
      continue
    }

    for (const [index, image] of images.entries()) {
      entries.push(await renderFramedScreenshot(format, image, index))
    }
  }

  for (const entry of entries) {
    zip.file(entry.path, entry.blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  triggerDownload(zipBlob, 'app-frames.zip')
}
