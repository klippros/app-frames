import { Box, Flex, Heading } from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import { ExportAssetsModal } from './components/ExportAssetsModal/ExportAssetsModal'
import { HeaderToolbar } from './components/HeaderToolbar'
import { useBeforeUnload } from './hooks/useBeforeUnload'
import { FramesEditor } from './components/FramesEditor'
import { ScreenshotPicker } from './components/ScreenshotPicker'
import type { Platform, Screenshot } from './types'
import { exportAssets } from './utils/exportFrames'
import { featureGraphicGradient } from './utils/featureGraphicConfig'

export const App = () => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [platform, setPlatform] = useState<Platform>('ios')
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [gradientBaseColor, setGradientBaseColor] = useState(featureGraphicGradient.baseColor)

  const gradientConfig = useMemo(
    () => ({
      ...featureGraphicGradient,
      baseColor: gradientBaseColor,
    }),
    [gradientBaseColor],
  )

  useEffect(
    () => () => {
      for (const screenshot of screenshots) {
        URL.revokeObjectURL(screenshot.url)
      }
    },
    [screenshots],
  )

  const handleSelect = (nextScreenshots: Screenshot[]) => {
    for (const screenshot of screenshots) {
      URL.revokeObjectURL(screenshot.url)
    }
    setScreenshots(nextScreenshots)
  }

  const handleExport = async (selectedFormatIds: string[]) => {
    await exportAssets(screenshots, selectedFormatIds, gradientConfig)
  }

  const hasScreenshots = screenshots.length > 0

  useBeforeUnload(hasScreenshots)

  return (
    <Box minH="100vh" bg="bg">
      <Box as="header" borderBottomWidth="1px" borderColor="border" px={6} py={4}>
        <Flex align="center" justify="space-between" gap={4}>
          <Heading size="lg" fontWeight="semibold">
            App Framer
          </Heading>
          {hasScreenshots ? (
            <HeaderToolbar
              platform={platform}
              gradientBaseColor={gradientBaseColor}
              onPlatformChange={setPlatform}
              onGradientBaseColorChange={setGradientBaseColor}
              onExportClick={() => {
                setExportModalOpen(true)
              }}
            />
          ) : null}
        </Flex>
      </Box>

      <Flex flex="1" align="center" justify="center" minH="calc(100vh - 65px)">
        {hasScreenshots ? (
          <FramesEditor
            screenshots={screenshots}
            platform={platform}
            gradientConfig={gradientConfig}
          />
        ) : (
          <ScreenshotPicker onSelect={handleSelect} />
        )}
      </Flex>

      <ExportAssetsModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        onExport={handleExport}
      />
    </Box>
  )
}
