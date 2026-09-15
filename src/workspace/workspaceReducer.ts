import type { Platform, Screenshot, TitlePosition } from '../types'
import type { Workspace, WorkspaceFrame } from './types'
import { createEmptySketch } from './types'

export type WorkspaceAction =
  | { type: 'RESET' }
  | { type: 'LOAD_WORKSPACE'; workspace: Workspace }
  | { type: 'SELECT_FRAMES'; frames: WorkspaceFrame[] }
  | { type: 'ADD_FRAMES'; frames: WorkspaceFrame[] }
  | { type: 'REPLACE_FRAME'; id: string; file: File; url: string }
  | { type: 'DELETE_FRAME'; id: string }
  | { type: 'SWAP_FRAMES'; index: number }
  | { type: 'SET_FRAME_TITLE'; id: string; title: string }
  | { type: 'TOGGLE_FRAME_TITLE_POSITION'; id: string }
  | { type: 'SET_PLATFORM'; platform: Platform }
  | { type: 'SET_GRADIENT_BASE_COLOR'; gradientBaseColor: string }
  | { type: 'SET_SHOW_BEZEL'; showBezel: boolean }
  | { type: 'SET_PROJECT_META'; id: string; name: string; ownerId: string }

const revokeFrameUrls = (frames: WorkspaceFrame[]) => {
  for (const frame of frames) {
    URL.revokeObjectURL(frame.url)
  }
}

const renumberOrders = (frames: WorkspaceFrame[]): WorkspaceFrame[] =>
  frames.map((frame, index) => ({ ...frame, order: index }))

const bumpRevision = (workspace: Workspace): Workspace => ({
  ...workspace,
  revision: workspace.revision + 1,
})

export const workspaceReducer = (state: Workspace, action: WorkspaceAction): Workspace => {
  switch (action.type) {
    case 'RESET': {
      revokeFrameUrls(state.frames)
      return createEmptySketch()
    }
    case 'LOAD_WORKSPACE': {
      revokeFrameUrls(state.frames)
      return action.workspace
    }
    case 'SELECT_FRAMES': {
      revokeFrameUrls(state.frames)
      return bumpRevision({
        ...state,
        frames: renumberOrders(action.frames),
      })
    }
    case 'ADD_FRAMES':
      return bumpRevision({
        ...state,
        frames: renumberOrders([...state.frames, ...action.frames]),
      })
    case 'REPLACE_FRAME':
      return bumpRevision({
        ...state,
        frames: state.frames.map((frame) => {
          if (frame.id !== action.id) {
            return frame
          }

          URL.revokeObjectURL(frame.url)
          return {
            ...frame,
            file: action.file,
            url: action.url,
            image: undefined,
          }
        }),
      })
    case 'DELETE_FRAME': {
      const frame = state.frames.find((item) => item.id === action.id)
      if (frame) {
        URL.revokeObjectURL(frame.url)
      }
      return bumpRevision({
        ...state,
        frames: renumberOrders(state.frames.filter((item) => item.id !== action.id)),
      })
    }
    case 'SWAP_FRAMES': {
      if (action.index < 0 || action.index >= state.frames.length - 1) {
        return state
      }

      const next = [...state.frames]
      const temp = next[action.index]
      next[action.index] = next[action.index + 1]
      next[action.index + 1] = temp
      return bumpRevision({
        ...state,
        frames: renumberOrders(next),
      })
    }
    case 'SET_FRAME_TITLE':
      return bumpRevision({
        ...state,
        frames: state.frames.map((frame) =>
          frame.id === action.id
            ? {
                ...frame,
                settings: { ...frame.settings, title: action.title },
              }
            : frame,
        ),
      })
    case 'TOGGLE_FRAME_TITLE_POSITION':
      return bumpRevision({
        ...state,
        frames: state.frames.map((frame) => {
          if (frame.id !== action.id) {
            return frame
          }

          const titlePosition: TitlePosition =
            frame.settings.titlePosition === 'top' ? 'bottom' : 'top'
          return {
            ...frame,
            settings: { ...frame.settings, titlePosition },
          }
        }),
      })
    case 'SET_PLATFORM':
      return bumpRevision({
        ...state,
        globalSettings: { ...state.globalSettings, platform: action.platform },
      })
    case 'SET_GRADIENT_BASE_COLOR':
      return bumpRevision({
        ...state,
        globalSettings: {
          ...state.globalSettings,
          gradientBaseColor: action.gradientBaseColor,
        },
      })
    case 'SET_SHOW_BEZEL':
      return bumpRevision({
        ...state,
        globalSettings: { ...state.globalSettings, showBezel: action.showBezel },
      })
    case 'SET_PROJECT_META':
      return {
        ...state,
        kind: 'project',
        id: action.id,
        name: action.name,
        ownerId: action.ownerId,
        revision: state.revision + 1,
      }
    default: {
      throw new Error(`Unhandled workspace action: ${(action as { type: string }).type}`)
    }
  }
}

export const frameToScreenshot = (frame: WorkspaceFrame): Screenshot => ({
  id: frame.id,
  file: frame.file,
  url: frame.url,
  title: frame.settings.title,
  titlePosition: frame.settings.titlePosition,
})

export const screenshotToFrame = (screenshot: Screenshot, order: number): WorkspaceFrame => ({
  id: screenshot.id,
  order,
  settings: {
    version: 1,
    title: screenshot.title,
    titlePosition: screenshot.titlePosition,
  },
  file: screenshot.file,
  url: screenshot.url,
})
