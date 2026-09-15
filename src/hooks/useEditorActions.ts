import { useCallback } from 'react'
import { useAuth } from '../hooks/authContext'
import { hydrateProjectWorkspace } from '../lib/sync/projectSync'
import { supabaseClient } from '../lib/supabase/client'
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
  loadWorkspace: (workspace: Workspace) => void
  promoteToProject: (name: string, ownerId: string) => Promise<void>
  onExportedSketch: () => void
}

export const useEditorActions = ({
  workspace,
  screenshots,
  gradientConfig,
  showBezel,
  isConfigured,
  hasScreenshots,
  loadWorkspace,
  promoteToProject,
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
      await promoteToProject(name, user.id)
    },
    [promoteToProject, user],
  )

  const handleOpenProject = useCallback(
    async (projectId: string) => {
      if (!user || !supabaseClient) {
        return
      }
      const next = await hydrateProjectWorkspace(supabaseClient, user.id, projectId)
      if (next) {
        loadWorkspace(next)
      }
    },
    [loadWorkspace, user],
  )

  return {
    handleExport,
    handleSaveAsProject,
    handleOpenProject,
  }
}
