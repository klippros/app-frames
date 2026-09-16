import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import type { Platform, Screenshot } from '../types'
import { featureGraphicGradient } from '../utils/featureGraphicConfig'
import { clearImageCache } from '../utils/loadImage'
import { normalizeImageFile } from '../utils/normalizeImage'
import {
  FRAME_LIMIT_MESSAGE,
  PROJECT_LIMIT_MESSAGE,
  countProjects,
} from '../lib/sync/projectGateway'
import { getProjectSyncGeneration, stopProjectSync, syncWorkspace } from '../lib/sync/projectSync'
import { supabaseClient } from '../lib/supabase/client'
import { MAX_FRAMES_PER_PROJECT, MAX_PROJECTS_PER_USER } from '../lib/supabase/schema'
import { createEmptySketch } from '../workspace/types'
import type { WorkspaceImageMeta } from '../workspace/types'
import {
  frameToScreenshot,
  screenshotToFrame,
  workspaceReducer,
} from '../workspace/workspaceReducer'
import { useAuth } from './authContext'
import { AuthStatus } from '../types/auth'
import { useProjectSync } from './useProjectSync'

export const useWorkspace = () => {
  const [workspace, dispatch] = useReducer(workspaceReducer, undefined, createEmptySketch)
  const { authStatus, user } = useAuth()
  const previousUserId = useRef<string | null>(null)
  const framesRef = useRef(workspace.frames)
  framesRef.current = workspace.frames

  // Only revoke leftover blob URLs on unmount. Tying this effect to `frames`
  // Also revoked still-used URLs whenever MARK_SYNCED replaced the array.
  useEffect(
    () => () => {
      for (const frame of framesRef.current) {
        URL.revokeObjectURL(frame.url)
      }
    },
    [],
  )

  useEffect(() => {
    const nextUserId = user?.id ?? null
    const previous = previousUserId.current

    if (previous !== null && previous !== nextUserId) {
      stopProjectSync()
      dispatch({ type: 'RESET' })
      clearImageCache()
    }

    if (previous !== null && authStatus === AuthStatus.Anonymous && nextUserId === null) {
      stopProjectSync()
      dispatch({ type: 'RESET' })
      clearImageCache()
    }

    previousUserId.current = nextUserId
  }, [authStatus, user?.id])

  const screenshots = useMemo(() => workspace.frames.map(frameToScreenshot), [workspace.frames])

  const gradientConfig = useMemo(
    () => ({
      ...featureGraphicGradient,
      baseColor: workspace.globalSettings.gradientBaseColor,
    }),
    [workspace.globalSettings.gradientBaseColor],
  )

  const selectScreenshots = useCallback((nextScreenshots: Screenshot[]) => {
    dispatch({
      type: 'SELECT_FRAMES',
      frames: nextScreenshots.map((screenshot, index) => screenshotToFrame(screenshot, index)),
    })
  }, [])

  const addScreenshots = useCallback((nextScreenshots: Screenshot[]) => {
    dispatch({
      type: 'ADD_FRAMES',
      frames: nextScreenshots.map((screenshot, index) => screenshotToFrame(screenshot, index)),
    })
  }, [])

  const replaceScreenshot = useCallback((id: string, file: File) => {
    void (async () => {
      try {
        const normalized = await normalizeImageFile(file)
        dispatch({
          type: 'REPLACE_FRAME',
          id,
          file: normalized.file,
          url: URL.createObjectURL(normalized.file),
        })
      } catch {
        // Keep the existing frame when replacement normalization fails.
      }
    })()
  }, [])

  const deleteScreenshot = useCallback((id: string) => {
    dispatch({ type: 'DELETE_FRAME', id })
  }, [])

  const swapScreenshots = useCallback((index: number) => {
    dispatch({ type: 'SWAP_FRAMES', index })
  }, [])

  const setTitle = useCallback((id: string, title: string) => {
    dispatch({ type: 'SET_FRAME_TITLE', id, title })
  }, [])

  const toggleTitlePosition = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_FRAME_TITLE_POSITION', id })
  }, [])

  const setPlatform = useCallback((platform: Platform) => {
    dispatch({ type: 'SET_PLATFORM', platform })
  }, [])

  const setGradientBaseColor = useCallback((gradientBaseColor: string) => {
    dispatch({ type: 'SET_GRADIENT_BASE_COLOR', gradientBaseColor })
  }, [])

  const setShowBezel = useCallback((showBezel: boolean) => {
    dispatch({ type: 'SET_SHOW_BEZEL', showBezel })
  }, [])

  const resetWorkspace = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const loadWorkspace = useCallback((next: typeof workspace) => {
    dispatch({ type: 'LOAD_WORKSPACE', workspace: next })
  }, [])

  const setProjectMeta = useCallback((id: string, name: string, ownerId: string) => {
    dispatch({ type: 'SET_PROJECT_META', id, name, ownerId })
  }, [])

  const markSynced = useCallback(
    (revision: number, frameImages?: Record<string, WorkspaceImageMeta>) => {
      dispatch({ type: 'MARK_SYNCED', revision, frameImages })
    },
    [],
  )

  const promoteToProject = useCallback(
    async (name: string, ownerId: string, initialScreenshots?: Screenshot[]) => {
      if (!supabaseClient) {
        throw new Error('Cloud sync is not configured.')
      }

      const existingCount = await countProjects(supabaseClient)
      if (existingCount >= MAX_PROJECTS_PER_USER) {
        throw new Error(PROJECT_LIMIT_MESSAGE)
      }

      if (initialScreenshots !== undefined && initialScreenshots.length > MAX_FRAMES_PER_PROJECT) {
        throw new Error(FRAME_LIMIT_MESSAGE)
      }

      if (initialScreenshots === undefined && workspace.frames.length > MAX_FRAMES_PER_PROJECT) {
        throw new Error(FRAME_LIMIT_MESSAGE)
      }

      const projectId = crypto.randomUUID()
      let next = workspace

      if (initialScreenshots !== undefined) {
        const selectAction = {
          type: 'SELECT_FRAMES' as const,
          frames: initialScreenshots.map((screenshot, index) =>
            screenshotToFrame(screenshot, index),
          ),
        }
        next = workspaceReducer(next, selectAction)
        dispatch(selectAction)
      }

      const metaAction = {
        type: 'SET_PROJECT_META' as const,
        id: projectId,
        name,
        ownerId,
      }
      next = workspaceReducer(next, metaAction)
      dispatch(metaAction)
      const generation = getProjectSyncGeneration(ownerId)
      if (generation === null) {
        throw new Error('Project sync is not active for the authenticated user.')
      }
      const synced = await syncWorkspace(ownerId, next, undefined, generation)
      markSynced(synced.revision, synced.frameImages)
      return projectId
    },
    [markSynced, workspace],
  )

  const { syncStatus, syncMessage, saveNow } = useProjectSync(workspace, markSynced)

  return {
    workspace,
    screenshots,
    hasScreenshots: screenshots.length > 0,
    platform: workspace.globalSettings.platform,
    gradientBaseColor: workspace.globalSettings.gradientBaseColor,
    showBezel: workspace.globalSettings.showBezel,
    gradientConfig,
    syncStatus,
    syncMessage,
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
    resetWorkspace,
    loadWorkspace,
    setProjectMeta,
    promoteToProject,
    saveNow,
  }
}
