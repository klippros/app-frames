import JSZip from 'jszip'
import type { ExportFormat, Screenshot } from '../types'
import type { GradientConfig } from './featureGraphicConfig'
import { featureGraphicGradient } from './featureGraphicConfig'
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
  screenshot: Screenshot,
  image: HTMLImageElement,
  index: number,
  gradientConfig: GradientConfig,
) {
  const canvas = createCanvas(format.width, format.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  await drawFramedScreenshot(
    format.renderer,
    ctx,
    image,
    format.width,
    format.height,
    gradientConfig,
    {
      title: screenshot.title,
      titlePosition: screenshot.titlePosition,
      drawTitle: true,
    },
  )
  const blob = await canvasToJpegBlob(canvas)
  return {
    path: `${format.store}/${format.folderName}/screenshot-${padIndex(index)}.jpg`,
    blob,
  }
}

async function renderFeatureGraphicExport(
  format: ExportFormat,
  images: HTMLImageElement[],
  gradientConfig: GradientConfig,
) {
  const canvas = renderFeatureGraphicCanvas(
    images,
    {
      width: format.width,
      height: format.height,
    },
    gradientConfig,
  )
  const blob = await canvasToJpegBlob(canvas)
  return {
    path: `${format.store}/${format.folderName}.jpg`,
    blob,
  }
}

export async function exportAssets(
  screenshots: Screenshot[],
  selectedFormatIds: string[],
  gradientConfig: GradientConfig = featureGraphicGradient,
) {
  const formats = EXPORT_FORMATS.filter((format) => selectedFormatIds.includes(format.id))
  if (formats.length === 0) {
    return
  }

  const images = await Promise.all(screenshots.map((screenshot) => loadImage(screenshot.url)))
  const zip = new JSZip()
  const entries: { path: string; blob: Blob }[] = []

  for (const format of formats) {
    if (format.kind === 'feature-graphic') {
      entries.push(await renderFeatureGraphicExport(format, images, gradientConfig))
      continue
    }

    for (const [index, screenshot] of screenshots.entries()) {
      entries.push(
        await renderFramedScreenshot(format, screenshot, images[index], index, gradientConfig),
      )
    }
  }

  for (const entry of entries) {
    zip.file(entry.path, entry.blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  triggerDownload(zipBlob, 'app-frames.zip')
}
