import { Box } from '@chakra-ui/react'
import { useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { ExportAssetsModal } from './components/ExportAssetsModal/ExportAssetsModal'
import { Footer } from './components/Footer'
import { ScreenshotWorkspace } from './components/ScreenshotWorkspace'
import { useBeforeUnload } from './hooks/useBeforeUnload'
import { useWorkspace } from './hooks/useWorkspace'
import { footerHeight } from './layout'
import { exportAssets } from './utils/exportFrames'

export const App = () => {
  const {
    screenshots,
    hasScreenshots,
    platform,
    gradientBaseColor,
    showBezel,
    gradientConfig,
    selectScreenshots,
    addScreenshots,
    replaceScreenshot,
    deleteScreenshot,
    swapScreenshots,
    setTitle,
    toggleTitlePosition,
    setPlatform,
    setGradientBaseColor,
    setShowBezel,
  } = useWorkspace()
  const [exportModalOpen, setExportModalOpen] = useState(false)

  const handleExport = async (selectedFormatIds: string[]) => {
    await exportAssets(screenshots, selectedFormatIds, gradientConfig, showBezel)
  }

  useBeforeUnload(hasScreenshots)

  return (
    <Box display="flex" flexDirection="column" h="100dvh" overflow="hidden" position="relative">
      <Box as="header" flexShrink={0} position="relative" zIndex={1}>
        <AppHeader
          hasScreenshots={hasScreenshots}
          screenshotCount={screenshots.length}
          platform={platform}
          gradientBaseColor={gradientBaseColor}
          showBezel={showBezel}
          onPlatformChange={setPlatform}
          onGradientBaseColorChange={setGradientBaseColor}
          onShowBezelChange={setShowBezel}
          onAddScreenshots={addScreenshots}
          onExportClick={() => {
            setExportModalOpen(true)
          }}
        />
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
