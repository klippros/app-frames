import { Box, Flex, Spinner, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/authContext'
import { useLeaveProtection } from '../hooks/useLeaveProtection'
import { useEditorActions } from '../hooks/useEditorActions'
import { useEditorDialogState } from '../hooks/useEditorDialogState'
import { useOwnedProjects } from '../hooks/useOwnedProjects'
import { useProjectRoute } from '../hooks/useProjectRoute'
import { useWorkspace } from '../hooks/useWorkspace'
import { footerHeight } from '../layout'
import { PROJECT_LIMIT_MESSAGE } from '../lib/sync/projectGateway'
import { flushProjectSync, queueProjectDelete, SyncStatus } from '../lib/sync/projectSync'
import type { Screenshot } from '../types'
import { AuthStatus } from '../types/auth'
import { AppHeader } from './AppHeader'
import { EditorDialogs } from './EditorDialogs'
import { Footer } from './Footer'
import { ScreenshotWorkspace } from './ScreenshotWorkspace'

export const EditorApp = () => {
  const workspaceState = useWorkspace()
  const { workspace, hasScreenshots, syncStatus, syncMessage } = workspaceState
  const { authStatus, isConfigured, user } = useAuth()
  const navigate = useNavigate()
  const [projectsListKey, setProjectsListKey] = useState(0)
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)
  const [screenshotError, setScreenshotError] = useState<string | null>(null)
  const ownedProjects = useOwnedProjects(projectsListKey)
  const dialogs = useEditorDialogState(ownedProjects.atProjectLimit)
  const { routeError, isOpening, openProject, openSketch, routeProjectId, isSketchRoute } =
    useProjectRoute(workspace, workspaceState.loadWorkspace, workspaceState.resetWorkspace)

  const hasUnsyncedProject =
    workspace.kind === 'project' && workspace.revision !== workspace.syncedRevision
  const hasUnsavedSketch = workspace.kind === 'sketch' && hasScreenshots
  const isActivelySyncing = syncStatus === SyncStatus.Syncing
  const syncFailed = syncStatus === SyncStatus.Error || syncStatus === SyncStatus.Conflict

  const { allowNextNavigation } = useLeaveProtection(
    hasUnsavedSketch || hasUnsyncedProject || isActivelySyncing || syncFailed,
  )

  const { handleExport, handleSaveAsProject, handleOpenProject } = useEditorActions({
    workspace,
    screenshots: workspaceState.screenshots,
    gradientConfig: workspaceState.gradientConfig,
    showBezel: workspaceState.showBezel,
    isConfigured,
    hasScreenshots,
    atProjectLimit: ownedProjects.atProjectLimit,
    promoteToProject: workspaceState.promoteToProject,
    openProject,
    allowNextNavigation,
    onExportedSketch: () => {
      dialogs.setPostExportOpen(true)
    },
  })

  const isSketch = workspace.kind === 'sketch'
  const isProject = workspace.kind === 'project' && workspace.id !== null
  const showSaveProject = isConfigured && hasScreenshots && isSketch
  const saveProjectDisabled = ownedProjects.atProjectLimit
  const isEditingRoute = isSketchRoute || routeProjectId !== undefined
  const projectName = isProject ? workspace.name : null

  const handleStartSketch = (screenshots: Screenshot[]) => {
    setScreenshotError(null)
    workspaceState.selectScreenshots(screenshots)
    openSketch()
  }

  const handleCreateProject = async (name: string, screenshots: Screenshot[]) => {
    await handleSaveAsProject(name, screenshots)
    setProjectsListKey((key) => key + 1)
  }

  const handleDeleteProject = async () => {
    if (!user || workspace.kind !== 'project' || workspace.id === null) {
      return
    }

    const projectId = workspace.id
    setDeletingProjectId(projectId)
    ownedProjects.setError(null)
    try {
      await queueProjectDelete(user.id, projectId)
      await flushProjectSync()
      allowNextNavigation()
      workspaceState.resetWorkspace()
      void navigate('/', { replace: true })
      setProjectsListKey((key) => key + 1)
    } catch (deleteError) {
      ownedProjects.setError(
        deleteError instanceof Error ? deleteError.message : 'Could not delete project.',
      )
    } finally {
      setDeletingProjectId(null)
    }
  }

  return (
    <Box display="flex" flexDirection="column" h="100dvh" overflow="hidden" position="relative">
      <Box as="header" flexShrink={0} position="relative" zIndex={2}>
        <AppHeader
          hasScreenshots={hasScreenshots}
          screenshotCount={workspaceState.screenshots.length}
          platform={workspaceState.platform}
          gradientBaseColor={workspaceState.gradientBaseColor}
          showBezel={workspaceState.showBezel}
          projectName={projectName}
          syncStatus={syncStatus}
          syncMessage={syncMessage}
          showSaveProject={showSaveProject}
          saveProjectDisabled={saveProjectDisabled}
          deleteProjectDisabled={deletingProjectId !== null}
          onPlatformChange={workspaceState.setPlatform}
          onGradientBaseColorChange={workspaceState.setGradientBaseColor}
          onShowBezelChange={workspaceState.setShowBezel}
          onAddScreenshots={workspaceState.addScreenshots}
          onExportClick={() => {
            dialogs.setExportModalOpen(true)
          }}
          onSaveProjectClick={() => {
            if (ownedProjects.atProjectLimit) {
              return
            }
            if (authStatus === AuthStatus.Authenticated) {
              dialogs.setSaveDialogOpen(true)
              return
            }
            dialogs.setPendingSaveAfterAuth(true)
            dialogs.setSignInOpen(true)
          }}
          onDeleteProjectClick={
            isProject
              ? () => {
                  dialogs.setDeleteProjectOpen(true)
                }
              : undefined
          }
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
        {routeError !== null && (
          <Text px={4} pt={2} fontSize="sm" color="red.300">
            {routeError}
          </Text>
        )}
        {isOpening ? (
          <Flex flex="1" align="center" justify="center" w="full">
            <Spinner color="white" />
          </Flex>
        ) : (
          <ScreenshotWorkspace
            screenshots={workspaceState.screenshots}
            platform={workspaceState.platform}
            gradientConfig={workspaceState.gradientConfig}
            showBezel={workspaceState.showBezel}
            isEditingRoute={isEditingRoute}
            projects={ownedProjects.projects}
            projectsLoading={ownedProjects.loading}
            projectsError={ownedProjects.error}
            screenshotError={screenshotError}
            onSelect={handleStartSketch}
            onReplace={async (id, file) => {
              setScreenshotError(null)
              try {
                await workspaceState.replaceScreenshot(id, file)
              } catch (replaceError) {
                const message =
                  replaceError instanceof Error
                    ? replaceError.message
                    : 'Could not process screenshot.'
                setScreenshotError(`${file.name}: ${message}`)
              }
            }}
            onDelete={workspaceState.deleteScreenshot}
            onSwap={workspaceState.swapScreenshots}
            onTitleChange={workspaceState.setTitle}
            onToggleTitlePosition={workspaceState.toggleTitlePosition}
            onOpenProject={handleOpenProject}
            onCreateProject={handleCreateProject}
            onScreenshotErrors={(message) => {
              setScreenshotError(message)
            }}
          />
        )}
      </Box>

      <Footer />

      <EditorDialogs
        exportOpen={dialogs.exportModalOpen}
        saveOpen={dialogs.saveDialogOpen}
        postExportOpen={dialogs.postExportOpen}
        signInOpen={dialogs.signInOpen}
        deleteProjectOpen={dialogs.deleteProjectOpen}
        deleteProjectName={projectName ?? ''}
        atProjectLimit={ownedProjects.atProjectLimit}
        onExportOpenChange={dialogs.setExportModalOpen}
        onSaveOpenChange={dialogs.setSaveDialogOpen}
        onPostExportOpenChange={dialogs.setPostExportOpen}
        onSignInOpenChange={dialogs.setSignInOpen}
        onDeleteProjectOpenChange={dialogs.setDeleteProjectOpen}
        onExport={handleExport}
        onSaveConfirm={async (name) => {
          if (ownedProjects.atProjectLimit) {
            throw new Error(PROJECT_LIMIT_MESSAGE)
          }
          await handleSaveAsProject(name)
          setProjectsListKey((key) => key + 1)
        }}
        onDeleteProjectConfirm={handleDeleteProject}
        onRequestSignInAndSave={() => {
          if (ownedProjects.atProjectLimit) {
            return
          }
          dialogs.setPendingSaveAfterAuth(true)
          dialogs.setSignInOpen(true)
        }}
      />
    </Box>
  )
}
