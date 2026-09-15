import { Box } from '@chakra-ui/react'
import { useAuth } from '../hooks/authContext'
import { useBeforeUnload } from '../hooks/useBeforeUnload'
import { useEditorActions } from '../hooks/useEditorActions'
import { useWorkspace } from '../hooks/useWorkspace'
import { footerHeight } from '../layout'
import { AuthStatus } from '../types/auth'
import { AppHeader } from './AppHeader'
import { EditorDialogs } from './EditorDialogs'
import { Footer } from './Footer'
import { ScreenshotWorkspace } from './ScreenshotWorkspace'
import { useEditorDialogState } from '../hooks/useEditorDialogState'

export const EditorApp = () => {
  const workspaceState = useWorkspace()
  const { authStatus, isConfigured } = useAuth()
  const dialogs = useEditorDialogState()
  const { handleExport, handleSaveAsProject, handleOpenProject } = useEditorActions({
    workspace: workspaceState.workspace,
    screenshots: workspaceState.screenshots,
    gradientConfig: workspaceState.gradientConfig,
    showBezel: workspaceState.showBezel,
    isConfigured,
    hasScreenshots: workspaceState.hasScreenshots,
    loadWorkspace: workspaceState.loadWorkspace,
    promoteToProject: workspaceState.promoteToProject,
    onExportedSketch: () => {
      dialogs.setPostExportOpen(true)
    },
  })

  useBeforeUnload(workspaceState.hasScreenshots)

  const isSketch = workspaceState.workspace.kind === 'sketch'
  const showSaveProject = isConfigured && workspaceState.hasScreenshots && isSketch

  return (
    <Box display="flex" flexDirection="column" h="100dvh" overflow="hidden" position="relative">
      <Box as="header" flexShrink={0} position="relative" zIndex={1}>
        <AppHeader
          hasScreenshots={workspaceState.hasScreenshots}
          screenshotCount={workspaceState.screenshots.length}
          platform={workspaceState.platform}
          gradientBaseColor={workspaceState.gradientBaseColor}
          showBezel={workspaceState.showBezel}
          projectName={
            workspaceState.workspace.kind === 'project' ? workspaceState.workspace.name : null
          }
          syncStatus={workspaceState.syncStatus}
          syncMessage={workspaceState.syncMessage}
          showSaveProject={showSaveProject}
          onPlatformChange={workspaceState.setPlatform}
          onGradientBaseColorChange={workspaceState.setGradientBaseColor}
          onShowBezelChange={workspaceState.setShowBezel}
          onAddScreenshots={workspaceState.addScreenshots}
          onExportClick={() => {
            dialogs.setExportModalOpen(true)
          }}
          onSaveProjectClick={() => {
            if (authStatus === AuthStatus.Authenticated) {
              dialogs.setSaveDialogOpen(true)
              return
            }
            dialogs.setPendingSaveAfterAuth(true)
            dialogs.setSignInOpen(true)
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
          screenshots={workspaceState.screenshots}
          platform={workspaceState.platform}
          gradientConfig={workspaceState.gradientConfig}
          showBezel={workspaceState.showBezel}
          onSelect={workspaceState.selectScreenshots}
          onReplace={workspaceState.replaceScreenshot}
          onDelete={workspaceState.deleteScreenshot}
          onSwap={workspaceState.swapScreenshots}
          onTitleChange={workspaceState.setTitle}
          onToggleTitlePosition={workspaceState.toggleTitlePosition}
          onOpenProject={handleOpenProject}
          onCreateProject={() => {
            dialogs.setSaveDialogOpen(true)
          }}
        />
      </Box>

      <Footer />

      <EditorDialogs
        exportOpen={dialogs.exportModalOpen}
        saveOpen={dialogs.saveDialogOpen}
        postExportOpen={dialogs.postExportOpen}
        signInOpen={dialogs.signInOpen}
        hasScreenshots={workspaceState.hasScreenshots}
        onExportOpenChange={dialogs.setExportModalOpen}
        onSaveOpenChange={dialogs.setSaveDialogOpen}
        onPostExportOpenChange={dialogs.setPostExportOpen}
        onSignInOpenChange={dialogs.setSignInOpen}
        onExport={handleExport}
        onSaveConfirm={handleSaveAsProject}
        onRequestSignInAndSave={() => {
          dialogs.setPendingSaveAfterAuth(true)
          dialogs.setSignInOpen(true)
        }}
      />
    </Box>
  )
}
