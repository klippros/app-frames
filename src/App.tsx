import { Box, Flex, Heading, HStack, Stack, Text } from '@chakra-ui/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ContentContainer } from './components/ContentContainer'
import { ExportAssetsModal } from './components/ExportAssetsModal/ExportAssetsModal'
import { HeaderToolbar } from './components/HeaderToolbar'
import { PlatformToggle } from './components/PlatformToggle'
import { ScreenshotFileInput, type ScreenshotFileInputHandle } from './components/ScreenshotFileInput'
import { useBeforeUnload } from './hooks/useBeforeUnload'
import { ScreenshotWorkspace } from './components/ScreenshotWorkspace'
import type { Platform, Screenshot } from './types'
import { exportAssets } from './utils/exportFrames'
import { featureGraphicGradient } from './utils/featureGraphicConfig'

export const App = () => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [platform, setPlatform] = useState<Platform>('ios')
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [gradientBaseColor, setGradientBaseColor] = useState(featureGraphicGradient.baseColor)
  const addScreenshotsInputRef = useRef<ScreenshotFileInputHandle>(null)

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

  const handleAddScreenshots = (nextScreenshots: Screenshot[]) => {
    setScreenshots((prev) => [...prev, ...nextScreenshots])
  }

  const handleExport = async (selectedFormatIds: string[]) => {
    await exportAssets(screenshots, selectedFormatIds, gradientConfig)
  }

  const handleReplaceScreenshot = (id: string, file: File) => {
    setScreenshots((prev) =>
      prev.map((screenshot) => {
        if (screenshot.id !== id) {
          return screenshot
        }

        URL.revokeObjectURL(screenshot.url)
        return {
          ...screenshot,
          file,
          url: URL.createObjectURL(file),
        }
      }),
    )
  }

  const handleDeleteScreenshot = (id: string) => {
    setScreenshots((prev) => {
      const screenshot = prev.find((item) => item.id === id)
      if (screenshot) {
        URL.revokeObjectURL(screenshot.url)
      }

      return prev.filter((item) => item.id !== id)
    })
  }

  const handleSwapScreenshots = (index: number) => {
    setScreenshots((prev) => {
      const next = [...prev]
      const temp = next[index]
      next[index] = next[index + 1]
      next[index + 1] = temp
      return next
    })
  }

  const handleTitleChange = (id: string, title: string) => {
    setScreenshots((prev) =>
      prev.map((screenshot) => (screenshot.id === id ? { ...screenshot, title } : screenshot)),
    )
  }

  const handleToggleTitlePosition = (id: string) => {
    setScreenshots((prev) =>
      prev.map((screenshot) =>
        screenshot.id === id
          ? {
              ...screenshot,
              titlePosition: screenshot.titlePosition === 'top' ? 'bottom' : 'top',
            }
          : screenshot,
      ),
    )
  }

  const hasScreenshots = screenshots.length > 0

  useBeforeUnload(hasScreenshots)

  return (
    <Box bg="bg" display="flex" flexDirection="column" h="100dvh" overflow="hidden">
      <Box as="header" borderBottomWidth="1px" borderColor="border" flexShrink={0}>
        <ContentContainer>
          <Box py={4}>
            <Flex align="center" justify="space-between" gap={4}>
              <HStack gap={3} align="center">
                <Stack gap={0} align="center">
                  <Heading
                    size="3xl"
                    lineHeight="1"
                    fontFamily="'Archivo Black', sans-serif"
                    fontWeight="normal"
                  >
                    App Framer
                  </Heading>
                  <Text fontSize="sm" fontWeight="semibold" lineHeight="1.4" textAlign="center">
                    Klippros Studios
                  </Text>
                </Stack>
                <PlatformToggle platform={platform} onChange={setPlatform} />
              </HStack>
              {hasScreenshots ? (
                <>
                  <ScreenshotFileInput
                    ref={addScreenshotsInputRef}
                    existingScreenshotCount={screenshots.length}
                    onSelect={handleAddScreenshots}
                  />
                  <HeaderToolbar
                    gradientBaseColor={gradientBaseColor}
                    onGradientBaseColorChange={setGradientBaseColor}
                    onAddScreenshotsClick={() => {
                      addScreenshotsInputRef.current?.open()
                    }}
                    onExportClick={() => {
                      setExportModalOpen(true)
                    }}
                  />
                </>
              ) : null}
            </Flex>
          </Box>
        </ContentContainer>
      </Box>

      <ScreenshotWorkspace
        screenshots={screenshots}
        platform={platform}
        gradientConfig={gradientConfig}
        onSelect={handleSelect}
        onReplace={handleReplaceScreenshot}
        onDelete={handleDeleteScreenshot}
        onSwap={handleSwapScreenshots}
        onTitleChange={handleTitleChange}
        onToggleTitlePosition={handleToggleTitlePosition}
      />

      <ExportAssetsModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        onExport={handleExport}
      />
    </Box>
  )
}
