import { useEffect, useRef } from 'react'
import type { ExportFormat, TitlePosition } from '../types'
import type { GradientConfig } from '../utils/featureGraphicConfig'
import { drawFramedScreenshot } from '../utils/frameRenderers'
import { loadImage } from '../utils/loadImage'

export interface FrameCanvasProps {
  screenshotUrl: string
  format: ExportFormat
  gradientConfig: GradientConfig
  showBezel: boolean
  title: string
  titlePosition: TitlePosition
}

export const FrameCanvas = ({
  screenshotUrl,
  format,
  gradientConfig,
  showBezel,
  title,
  titlePosition,
}: FrameCanvasProps) => {
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

      await drawFramedScreenshot(
        format.renderer,
        ctx,
        image,
        format.width,
        format.height,
        gradientConfig,
        {
          title,
          titlePosition,
          drawTitle: false,
          showBezel,
        },
      )
    })()

    return () => {
      cancelled = true
    }
  }, [screenshotUrl, format, gradientConfig, title, titlePosition, showBezel])

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
