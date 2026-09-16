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
  onRendered?: () => void
}

export const FrameCanvas = ({
  screenshotUrl,
  format,
  gradientConfig,
  showBezel,
  title,
  titlePosition,
  onRendered,
}: FrameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onRenderedRef = useRef(onRendered)
  onRenderedRef.current = onRendered

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return undefined
    }

    let cancelled = false

    void (async () => {
      try {
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

        if (!cancelled) {
          onRenderedRef.current?.()
        }
      } catch {
        // Keep the previous canvas contents when drawing fails.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [screenshotUrl, format, gradientConfig, title, titlePosition, showBezel])

  return (
    <canvas
      ref={canvasRef}
      width={format.width}
      height={format.height}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  )
}
