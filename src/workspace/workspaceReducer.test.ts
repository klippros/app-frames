import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_FRAME_TITLE } from '../utils/frameTitle'
import type { WorkspaceFrame } from './types'
import { createEmptySketch } from './types'
import { frameToScreenshot, screenshotToFrame, workspaceReducer } from './workspaceReducer'

const createTestFile = (name: string) => new File([name], name, { type: 'image/png' })

const createFrame = (id: string, order: number, title = DEFAULT_FRAME_TITLE): WorkspaceFrame => {
  const file = createTestFile(`${id}.png`)
  return {
    id,
    order,
    settings: {
      version: 1,
      title,
      titlePosition: order % 2 === 0 ? 'top' : 'bottom',
    },
    file,
    url: `blob:${id}`,
  }
}

describe('createEmptySketch', () => {
  it('creates an unnamed in-memory sketch workspace', () => {
    const workspace = createEmptySketch()

    expect(workspace.schemaVersion).toBe(1)
    expect(workspace.kind).toBe('sketch')
    expect(workspace.id).toBeNull()
    expect(workspace.name).toBeNull()
    expect(workspace.ownerId).toBeNull()
    expect(workspace.frames).toEqual([])
    expect(workspace.globalSettings).toMatchObject({
      version: 1,
      platform: 'ios',
      showBezel: true,
    })
  })
})

describe('workspaceReducer', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('selects frames and revokes previous object URLs', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const initial = {
      ...createEmptySketch(),
      frames: [createFrame('old', 0)],
    }

    const next = workspaceReducer(initial, {
      type: 'SELECT_FRAMES',
      frames: [createFrame('a', 0), createFrame('b', 1)],
    })

    expect(revoke).toHaveBeenCalledWith('blob:old')
    expect(next.frames.map((frame) => frame.id)).toEqual(['a', 'b'])
    expect(next.revision).toBe(1)
  })

  it('adds frames and renumbers order', () => {
    const initial = {
      ...createEmptySketch(),
      frames: [createFrame('a', 0)],
    }

    const next = workspaceReducer(initial, {
      type: 'ADD_FRAMES',
      frames: [createFrame('b', 99)],
    })

    expect(next.frames.map((frame) => ({ id: frame.id, order: frame.order }))).toEqual([
      { id: 'a', order: 0 },
      { id: 'b', order: 1 },
    ])
  })

  it('replaces a frame image and revokes the previous URL', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const initial = {
      ...createEmptySketch(),
      frames: [createFrame('a', 0)],
    }
    const file = createTestFile('replacement.png')

    const next = workspaceReducer(initial, {
      type: 'REPLACE_FRAME',
      id: 'a',
      file,
      url: 'blob:new',
    })

    expect(revoke).toHaveBeenCalledWith('blob:a')
    expect(next.frames[0]?.file).toBe(file)
    expect(next.frames[0]?.url).toBe('blob:new')
  })

  it('deletes a frame and renumbers remaining frames', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const initial = {
      ...createEmptySketch(),
      frames: [createFrame('a', 0), createFrame('b', 1), createFrame('c', 2)],
    }

    const next = workspaceReducer(initial, { type: 'DELETE_FRAME', id: 'b' })

    expect(revoke).toHaveBeenCalledWith('blob:b')
    expect(next.frames.map((frame) => ({ id: frame.id, order: frame.order }))).toEqual([
      { id: 'a', order: 0 },
      { id: 'c', order: 1 },
    ])
  })

  it('swaps adjacent frames', () => {
    const initial = {
      ...createEmptySketch(),
      frames: [createFrame('a', 0), createFrame('b', 1)],
    }

    const next = workspaceReducer(initial, { type: 'SWAP_FRAMES', index: 0 })

    expect(next.frames.map((frame) => frame.id)).toEqual(['b', 'a'])
    expect(next.frames.map((frame) => frame.order)).toEqual([0, 1])
  })

  it('updates frame title and title position', () => {
    const initial = {
      ...createEmptySketch(),
      frames: [createFrame('a', 0)],
    }

    const titled = workspaceReducer(initial, {
      type: 'SET_FRAME_TITLE',
      id: 'a',
      title: 'Hello',
    })
    const toggled = workspaceReducer(titled, {
      type: 'TOGGLE_FRAME_TITLE_POSITION',
      id: 'a',
    })

    expect(titled.frames[0]?.settings.title).toBe('Hello')
    expect(toggled.frames[0]?.settings.titlePosition).toBe('bottom')
  })

  it('updates global settings', () => {
    let next = workspaceReducer(createEmptySketch(), {
      type: 'SET_PLATFORM',
      platform: 'android',
    })
    next = workspaceReducer(next, {
      type: 'SET_GRADIENT_BASE_COLOR',
      gradientBaseColor: '#ff0000',
    })
    next = workspaceReducer(next, { type: 'SET_SHOW_BEZEL', showBezel: false })

    expect(next.globalSettings).toMatchObject({
      platform: 'android',
      gradientBaseColor: '#ff0000',
      showBezel: false,
    })
    expect(next.revision).toBe(3)
  })

  it('promotes a sketch to a named project', () => {
    const next = workspaceReducer(createEmptySketch(), {
      type: 'SET_PROJECT_META',
      id: '11111111-1111-1111-1111-111111111111',
      name: 'My App',
      ownerId: 'user-1',
    })

    expect(next.kind).toBe('project')
    expect(next.id).toBe('11111111-1111-1111-1111-111111111111')
    expect(next.name).toBe('My App')
    expect(next.ownerId).toBe('user-1')
  })

  it('resets to an empty sketch and revokes frame URLs', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const initial = {
      ...createEmptySketch(),
      frames: [createFrame('a', 0)],
      globalSettings: {
        version: 1 as const,
        platform: 'android' as const,
        gradientBaseColor: '#000000',
        showBezel: false,
      },
    }

    const next = workspaceReducer(initial, { type: 'RESET' })

    expect(revoke).toHaveBeenCalledWith('blob:a')
    expect(next).toEqual(createEmptySketch())
  })
})

describe('screenshot adapters', () => {
  it('round-trips screenshot and frame shapes', () => {
    const frame = createFrame('a', 2, 'Title')
    const screenshot = frameToScreenshot(frame)
    const restored = screenshotToFrame(screenshot, 2)

    expect(screenshot).toEqual({
      id: 'a',
      file: frame.file,
      url: 'blob:a',
      title: 'Title',
      titlePosition: 'top',
    })
    expect(restored.settings).toEqual(frame.settings)
    expect(restored.order).toBe(2)
  })
})
