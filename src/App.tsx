import { Box, Flex, Heading, HStack, Stack, Text } from '@chakra-ui/react'
import { useMemo, useRef, useState } from 'react'
import { ContentContainer } from './components/ContentContainer'
import { ExportAssetsModal } from './components/ExportAssetsModal/ExportAssetsModal'
import { HeaderToolbar } from './components/HeaderToolbar'
import { PlatformToggle } from './components/PlatformToggle'
import { ScreenshotFileInput, type ScreenshotFileInputHandle } from './components/ScreenshotFileInput'
import { useBeforeUnload } from './hooks/useBeforeUnload'
import { useScreenshots } from './hooks/useScreenshots'
import { ScreenshotWorkspace } from './components/ScreenshotWorkspace'
import type { Platform } from './types'
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
  const addScreenshotsInputRef = useRef<ScreenshotFileInputHandle>(null)

  const gradientConfig = useMemo(
    () => ({
      ...featureGraphicGradient,
      baseColor: gradientBaseColor,
    }),
    [gradientBaseColor],
  )

  const handleExport = async (selectedFormatIds: string[]) => {
    await exportAssets(screenshots, selectedFormatIds, gradientConfig)
  }

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
                    onSelect={addScreenshots}
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
        onSelect={selectScreenshots}
        onReplace={replaceScreenshot}
        onDelete={deleteScreenshot}
        onSwap={swapScreenshots}
        onTitleChange={setTitle}
        onToggleTitlePosition={toggleTitlePosition}
      />

      <ExportAssetsModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        onExport={handleExport}
      />
    </Box>
  )
}
