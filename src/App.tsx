import { Box, Flex, Heading, HStack, IconButton } from '@chakra-ui/react'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { ExportAssetsModal } from './components/ExportAssetsModal/ExportAssetsModal'
import { useBeforeUnload } from './hooks/useBeforeUnload'
import { FramesEditor } from './components/FramesEditor'
import { PlatformToggle } from './components/PlatformToggle'
import { ScreenshotPicker } from './components/ScreenshotPicker'
import type { Platform, Screenshot } from './types'
import { exportAssets } from './utils/exportFrames'

export const App = () => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [platform, setPlatform] = useState<Platform>('ios')
  const [exportModalOpen, setExportModalOpen] = useState(false)

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
    await exportAssets(screenshots, selectedFormatIds)
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
            <HStack gap={2}>
              <PlatformToggle platform={platform} onChange={setPlatform} />
              <IconButton
                aria-label="Export assets"
                variant="outline"
                onClick={() => {
                  setExportModalOpen(true)
                }}
              >
                <FontAwesomeIcon icon={faDownload} />
              </IconButton>
            </HStack>
          ) : null}
        </Flex>
      </Box>

      <Flex flex="1" align="center" justify="center" minH="calc(100vh - 65px)">
        {hasScreenshots ? (
          <FramesEditor screenshots={screenshots} platform={platform} />
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
