import { useCallback } from 'react'
import { useAuth } from '../hooks/authContext'
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
  promoteToProject: (name: string, ownerId: string) => Promise<string>
  openProject: (projectId: string) => void
  onExportedSketch: () => void
}

export const useEditorActions = ({
  workspace,
  screenshots,
  gradientConfig,
  showBezel,
  isConfigured,
  hasScreenshots,
  promoteToProject,
  openProject,
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
    async (name: string) => {
      if (!user) {
        throw new Error('Sign in to save a project.')
      }
      const projectId = await promoteToProject(name, user.id)
      openProject(projectId)
    },
    [openProject, promoteToProject, user],
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
