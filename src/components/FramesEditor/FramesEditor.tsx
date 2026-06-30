import { Box, Flex } from '@chakra-ui/react'
import { Fragment } from 'react'
import { useHorizontalScrollGuard } from '../../hooks/useHorizontalScrollGuard'
import type { Platform, Screenshot } from '../../types'
import type { GradientConfig } from '../../utils/featureGraphicConfig'
import { PREVIEW_FORMAT_BY_PLATFORM } from '../../utils/exportFormats'
import { ScreenshotFrame } from './ScreenshotFrame'
import { ScreenshotSwapControls } from './ScreenshotSwapControls'

export interface FramesEditorProps {
  screenshots: Screenshot[]
  platform: Platform
  gradientConfig: GradientConfig
  onReplace: (id: string, file: File) => void
  onDelete: (id: string) => void
  onSwap: (index: number) => void
  onTitleChange: (id: string, title: string) => void
  onToggleTitlePosition: (id: string) => void
}

export const FramesEditor = ({
  screenshots,
  platform,
  gradientConfig,
  onReplace,
  onDelete,
  onSwap,
  onTitleChange,
  onToggleTitlePosition,
}: FramesEditorProps) => {
  const format = PREVIEW_FORMAT_BY_PLATFORM[platform]
  const scrollRef = useHorizontalScrollGuard<HTMLDivElement>()

  return (
    <Box
      ref={scrollRef}
      alignItems="center"
      className="hide-scrollbar preview-scroll-strip"
      display="flex"
      flex="1"
      minH={0}
      overflowX="auto"
      py={8}
    >
      <Flex align="flex-start" flexShrink={0} gap={0} mx="auto" w="max-content">
        {screenshots.map((screenshot, index) => (
          <Fragment key={screenshot.id}>
            <ScreenshotFrame
              screenshotUrl={screenshot.url}
              format={format}
              gradientConfig={gradientConfig}
              title={screenshot.title}
              titlePosition={screenshot.titlePosition}
              onReplace={(file) => {
                onReplace(screenshot.id, file)
              }}
              onDelete={() => {
                onDelete(screenshot.id)
              }}
              onTitleChange={(title) => {
                onTitleChange(screenshot.id, title)
              }}
              onToggleTitlePosition={() => {
                onToggleTitlePosition(screenshot.id)
              }}
            />
            {index < screenshots.length - 1 ? (
              <ScreenshotSwapControls
                onSwap={() => {
                  onSwap(index)
                }}
              />
            ) : null}
          </Fragment>
        ))}
      </Flex>
    </Box>
  )
}
