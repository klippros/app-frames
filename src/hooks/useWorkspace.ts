import { useCallback, useEffect, useMemo, useReducer } from 'react'
import type { Platform, Screenshot } from '../types'
import { featureGraphicGradient } from '../utils/featureGraphicConfig'
import { createEmptySketch } from '../workspace/types'
import {
  frameToScreenshot,
  screenshotToFrame,
  workspaceReducer,
} from '../workspace/workspaceReducer'

export const useWorkspace = () => {
  const [workspace, dispatch] = useReducer(workspaceReducer, undefined, createEmptySketch)

  useEffect(
    () => () => {
      for (const frame of workspace.frames) {
        URL.revokeObjectURL(frame.url)
      }
    },
    [workspace.frames],
  )

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
    dispatch({
      type: 'REPLACE_FRAME',
      id,
      file,
      url: URL.createObjectURL(file),
    })
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

  return {
    workspace,
    screenshots,
    hasScreenshots: screenshots.length > 0,
    platform: workspace.globalSettings.platform,
    gradientBaseColor: workspace.globalSettings.gradientBaseColor,
    showBezel: workspace.globalSettings.showBezel,
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
    resetWorkspace,
    loadWorkspace,
    setProjectMeta,
  }
}
