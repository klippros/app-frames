import { useCallback, useEffect, useReducer } from 'react'
import type { Screenshot } from '../types'

type ScreenshotAction =
  | { type: 'SELECT'; screenshots: Screenshot[] }
  | { type: 'ADD'; screenshots: Screenshot[] }
  | { type: 'REPLACE'; id: string; file: File }
  | { type: 'DELETE'; id: string }
  | { type: 'SWAP'; index: number }
  | { type: 'SET_TITLE'; id: string; title: string }
  | { type: 'TOGGLE_TITLE_POSITION'; id: string }

function screenshotReducer(state: Screenshot[], action: ScreenshotAction): Screenshot[] {
  switch (action.type) {
    case 'SELECT': {
      for (const screenshot of state) {
        URL.revokeObjectURL(screenshot.url)
      }
      return action.screenshots
    }
    case 'ADD':
      return [...state, ...action.screenshots]
    case 'REPLACE':
      return state.map((screenshot) => {
        if (screenshot.id !== action.id) {
          return screenshot
        }

        URL.revokeObjectURL(screenshot.url)
        return {
          ...screenshot,
          file: action.file,
          url: URL.createObjectURL(action.file),
        }
      })
    case 'DELETE': {
      const screenshot = state.find((item) => item.id === action.id)
      if (screenshot) {
        URL.revokeObjectURL(screenshot.url)
      }
      return state.filter((item) => item.id !== action.id)
    }
    case 'SWAP': {
      const next = [...state]
      const temp = next[action.index]
      next[action.index] = next[action.index + 1]
      next[action.index + 1] = temp
      return next
    }
    case 'SET_TITLE':
      return state.map((screenshot) =>
        screenshot.id === action.id ? { ...screenshot, title: action.title } : screenshot,
      )
    case 'TOGGLE_TITLE_POSITION':
      return state.map((screenshot) =>
        screenshot.id === action.id
          ? {
              ...screenshot,
              titlePosition: screenshot.titlePosition === 'top' ? 'bottom' : 'top',
            }
          : screenshot,
      )
  }
}

export function useScreenshots() {
  const [screenshots, dispatch] = useReducer(screenshotReducer, [])

  useEffect(
    () => () => {
      for (const screenshot of screenshots) {
        URL.revokeObjectURL(screenshot.url)
      }
    },
    [screenshots],
  )

  const selectScreenshots = useCallback((nextScreenshots: Screenshot[]) => {
    dispatch({ type: 'SELECT', screenshots: nextScreenshots })
  }, [])

  const addScreenshots = useCallback((nextScreenshots: Screenshot[]) => {
    dispatch({ type: 'ADD', screenshots: nextScreenshots })
  }, [])

  const replaceScreenshot = useCallback((id: string, file: File) => {
    dispatch({ type: 'REPLACE', id, file })
  }, [])

  const deleteScreenshot = useCallback((id: string) => {
    dispatch({ type: 'DELETE', id })
  }, [])

  const swapScreenshots = useCallback((index: number) => {
    dispatch({ type: 'SWAP', index })
  }, [])

  const setTitle = useCallback((id: string, title: string) => {
    dispatch({ type: 'SET_TITLE', id, title })
  }, [])

  const toggleTitlePosition = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_TITLE_POSITION', id })
  }, [])

  return {
    screenshots,
    hasScreenshots: screenshots.length > 0,
    selectScreenshots,
    addScreenshots,
    replaceScreenshot,
    deleteScreenshot,
    swapScreenshots,
    setTitle,
    toggleTitlePosition,
  }
}
