import { Box, Flex, Heading, HStack, Stack, Text } from '@chakra-ui/react'
import { useMemo, useRef, useState } from 'react'
import { ContentContainer } from './components/ContentContainer'
import { ExportAssetsModal } from './components/ExportAssetsModal/ExportAssetsModal'
import { Footer } from './components/Footer'
import { HeaderToolbar } from './components/HeaderToolbar'
import { PlatformToggle } from './components/PlatformToggle'
import {
  ScreenshotFileInput,
  type ScreenshotFileInputHandle,
} from './components/ScreenshotFileInput'
import { useBeforeUnload } from './hooks/useBeforeUnload'
import { useScreenshots } from './hooks/useScreenshots'
import { ScreenshotWorkspace } from './components/ScreenshotWorkspace'
import type { Platform } from './types'
import { footerHeight } from './layout'
import { exportAssets } from './utils/exportFrames'
import { featureGraphicGradient } from './utils/featureGraphicConfig'

export const App = () => {
  const {
    screenshots,
    hasScreenshots,
    selectScreenshots,
    addScreenshots,
    replaceScreenshot,
    deleteScreenshot,
    swapScreenshots,
    setTitle,
    toggleTitlePosition,
  } = useScreenshots()
  const [platform, setPlatform] = useState<Platform>('ios')
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [gradientBaseColor, setGradientBaseColor] = useState(featureGraphicGradient.baseColor)
  const [showBezel, setShowBezel] = useState(true)
  const addScreenshotsInputRef = useRef<ScreenshotFileInputHandle>(null)

  const gradientConfig = useMemo(
    () => ({
      ...featureGraphicGradient,
      baseColor: gradientBaseColor,
    }),
    [gradientBaseColor],
  )

  const handleExport = async (selectedFormatIds: string[]) => {
    await exportAssets(screenshots, selectedFormatIds, gradientConfig, showBezel)
  }

  useBeforeUnload(hasScreenshots)

  return (
    <Box display="flex" flexDirection="column" h="100dvh" overflow="hidden" position="relative">
      <Box as="header" flexShrink={0} position="relative" zIndex={1}>
        <ContentContainer>
          <Box pt={10} pb={4}>
            <Flex align="center" gap={4}>
              <HStack flex="1" gap={3} align="center" minW={0}>
                <Stack gap={0} align="center">
                  <Heading
                    size="3xl"
                    lineHeight="1"
                    fontFamily="'Archivo Black', sans-serif"
                    fontWeight="normal"
                  >
                    App Frames
                  </Heading>
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    lineHeight="1.4"
                    textAlign="center"
                    color="whiteAlpha.700"
                  >
                    Klippros Studios
                  </Text>
                </Stack>
              </HStack>
              <HStack flexShrink={0} gap={2} justify="center">
                <PlatformToggle
                  disabled={!hasScreenshots}
                  platform={platform}
                  onChange={setPlatform}
                />
              </HStack>
              <HStack flex="1" gap={2} align="center" justify="flex-end" minW={0}>
                <ScreenshotFileInput
                  ref={addScreenshotsInputRef}
                  existingScreenshotCount={screenshots.length}
                  onSelect={addScreenshots}
                />
                <HeaderToolbar
                  disabled={!hasScreenshots}
                  gradientBaseColor={gradientBaseColor}
                  showBezel={showBezel}
                  onGradientBaseColorChange={setGradientBaseColor}
                  onShowBezelChange={setShowBezel}
                  onAddScreenshotsClick={() => {
                    addScreenshotsInputRef.current?.open()
                  }}
                  onExportClick={() => {
                    setExportModalOpen(true)
                  }}
                />
              </HStack>
            </Flex>
          </Box>
        </ContentContainer>
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        flex="1"
        minH={0}
        pb={footerHeight}
        position="relative"
        zIndex={1}
      >
        <ScreenshotWorkspace
          screenshots={screenshots}
          platform={platform}
          gradientConfig={gradientConfig}
          showBezel={showBezel}
          onSelect={selectScreenshots}
          onReplace={replaceScreenshot}
          onDelete={deleteScreenshot}
          onSwap={swapScreenshots}
          onTitleChange={setTitle}
          onToggleTitlePosition={toggleTitlePosition}
        />
      </Box>

      <Footer />

      <ExportAssetsModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        onExport={handleExport}
      />
    </Box>
  )
}
