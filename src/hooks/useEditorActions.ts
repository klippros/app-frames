import { useCallback } from 'react'
import { useAuth } from '../hooks/authContext'
import { PROJECT_LIMIT_MESSAGE } from '../lib/sync/projectGateway'
import type { Screenshot } from '../types'
import type { GradientConfig } from '../utils/featureGraphicConfig'
import { exportAssets } from '../utils/exportFrames'
import type { Workspace } from '../workspace/types'

export interface UseEditorActionsArgs {
  workspace: Workspace
  screenshots: Screenshot[]
  gradientConfig: GradientConfig
  showBezel: boolean
  isConfigured: boolean
  hasScreenshots: boolean
  atProjectLimit?: boolean
  promoteToProject: (name: string, ownerId: string, screenshots?: Screenshot[]) => Promise<string>
  openProject: (projectId: string) => void
  allowNextNavigation: () => void
  onExportedSketch: () => void
}

export const useEditorActions = ({
  workspace,
  screenshots,
  gradientConfig,
  showBezel,
  isConfigured,
  hasScreenshots,
  atProjectLimit = false,
  promoteToProject,
  openProject,
  allowNextNavigation,
  onExportedSketch,
}: UseEditorActionsArgs) => {
  const { user } = useAuth()

  const handleExport = useCallback(
    async (selectedFormatIds: string[]) => {
      await exportAssets(screenshots, selectedFormatIds, gradientConfig, showBezel)
      if (isConfigured && workspace.kind === 'sketch' && hasScreenshots) {
        onExportedSketch()
      }
    },
    [
      gradientConfig,
      hasScreenshots,
      isConfigured,
      onExportedSketch,
      screenshots,
      showBezel,
      workspace.kind,
    ],
  )

  const handleSaveAsProject = useCallback(
    async (name: string, nextScreenshots?: Screenshot[]) => {
      if (!user) {
        throw new Error('Sign in to save a project.')
      }
      if (atProjectLimit) {
        throw new Error(PROJECT_LIMIT_MESSAGE)
      }
      const projectId = await promoteToProject(name, user.id, nextScreenshots)
      allowNextNavigation()
      openProject(projectId)
    },
    [allowNextNavigation, atProjectLimit, openProject, promoteToProject, user],
  )

  const handleOpenProject = useCallback(
    (projectId: string) => {
      openProject(projectId)
    },
    [openProject],
  )

  return {
    handleExport,
    handleSaveAsProject,
    handleOpenProject,
  }
}
