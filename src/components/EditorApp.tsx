import { Box, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useAuth } from '../hooks/authContext'
import { useLeaveProtection } from '../hooks/useLeaveProtection'
import { useEditorActions } from '../hooks/useEditorActions'
import { useEditorDialogState } from '../hooks/useEditorDialogState'
import { useProjectRoute } from '../hooks/useProjectRoute'
import { useWorkspace } from '../hooks/useWorkspace'
import { footerHeight } from '../layout'
import { SyncStatus } from '../lib/sync/projectSync'
import { AuthStatus } from '../types/auth'
import { AppHeader } from './AppHeader'
import { EditorDialogs } from './EditorDialogs'
import { Footer } from './Footer'
import { ScreenshotWorkspace } from './ScreenshotWorkspace'

export const EditorApp = () => {
  const workspaceState = useWorkspace()
  const { workspace, hasScreenshots, syncStatus, syncMessage } = workspaceState
  const { authStatus, isConfigured } = useAuth()
  const dialogs = useEditorDialogState()
  const [projectsListKey, setProjectsListKey] = useState(0)
  const { routeError, isOpening, openProject, routeProjectId } = useProjectRoute(
    workspace,
    workspaceState.loadWorkspace,
    workspaceState.resetWorkspace,
  )
  const { handleExport, handleSaveAsProject, handleOpenProject } = useEditorActions({
    workspace,
    screenshots: workspaceState.screenshots,
    gradientConfig: workspaceState.gradientConfig,
    showBezel: workspaceState.showBezel,
    isConfigured,
    hasScreenshots,
    promoteToProject: workspaceState.promoteToProject,
    openProject,
    onExportedSketch: () => {
      dialogs.setPostExportOpen(true)
    },
  })

  const hasUnsyncedProject =
    workspace.kind === 'project' && workspace.revision !== workspace.syncedRevision
  const hasUnsavedSketch = workspace.kind === 'sketch' && hasScreenshots
  const isActivelySyncing = syncStatus === SyncStatus.Syncing
  const syncFailed = syncStatus === SyncStatus.Error || syncStatus === SyncStatus.Conflict

  useLeaveProtection(hasUnsavedSketch || hasUnsyncedProject || isActivelySyncing || syncFailed)

  const isSketch = workspace.kind === 'sketch'
  const showSaveProject = isConfigured && hasScreenshots && isSketch

  return (
    <Box display="flex" flexDirection="column" h="100dvh" overflow="hidden" position="relative">
      <Box as="header" flexShrink={0} position="relative" zIndex={2}>
        <AppHeader
          hasScreenshots={hasScreenshots}
          screenshotCount={workspaceState.screenshots.length}
          platform={workspaceState.platform}
          gradientBaseColor={workspaceState.gradientBaseColor}
          showBezel={workspaceState.showBezel}
          projectName={workspace.kind === 'project' ? workspace.name : null}
          syncStatus={syncStatus}
          syncMessage={syncMessage}
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
        {(isOpening || routeError !== null) && (
          <Text px={4} pt={2} fontSize="sm" color={isOpening ? 'whiteAlpha.600' : 'red.300'}>
            {isOpening ? 'Opening project…' : routeError}
          </Text>
        )}
        <ScreenshotWorkspace
          screenshots={workspaceState.screenshots}
          platform={workspaceState.platform}
          gradientConfig={workspaceState.gradientConfig}
          showBezel={workspaceState.showBezel}
          projectsListKey={projectsListKey}
          openingProjectId={isOpening ? (routeProjectId ?? null) : null}
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
        hasScreenshots={hasScreenshots}
        onExportOpenChange={dialogs.setExportModalOpen}
        onSaveOpenChange={dialogs.setSaveDialogOpen}
        onPostExportOpenChange={dialogs.setPostExportOpen}
        onSignInOpenChange={dialogs.setSignInOpen}
        onExport={handleExport}
        onSaveConfirm={async (name) => {
          await handleSaveAsProject(name)
          setProjectsListKey((key) => key + 1)
        }}
        onRequestSignInAndSave={() => {
          dialogs.setPendingSaveAfterAuth(true)
          dialogs.setSignInOpen(true)
        }}
      />
    </Box>
  )
}
