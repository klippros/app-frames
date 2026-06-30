import { useEffect, useRef } from 'react'
import type { ExportFormat } from '../types'
import { drawFramedScreenshot } from '../utils/frameRenderers'
import { loadImage } from '../utils/loadImage'

export interface FrameCanvasProps {
  screenshotUrl: string
  format: ExportFormat
}

export const FrameCanvas = ({ screenshotUrl, format }: FrameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return undefined
    }

    let cancelled = false

    void (async () => {
      const image = await loadImage(screenshotUrl)
      if (cancelled) {
        return
      }

      canvas.width = format.width
      canvas.height = format.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return
      }

      drawFramedScreenshot(format.renderer, ctx, image, format.width, format.height)
    })()

    return () => {
      cancelled = true
    }
  }, [screenshotUrl, format])

  return (
    <canvas
      ref={canvasRef}
      style={{
        maxWidth: '320px',
        width: '100%',
        height: 'auto',
        display: 'block',
      }}
    />
  )
}
