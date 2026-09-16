import { afterEach, describe, expect, it, vi } from 'vitest'
import type { WorkspaceFrame } from './types'
import { createEmptySketch } from './types'
import { workspaceReducer } from './workspaceReducer'

const createTestFile = (name: string) => new File([name], name, { type: 'image/png' })

const createFrame = (id: string, order: number): WorkspaceFrame => {
  const file = createTestFile(`${id}.png`)
  return {
    id,
    order,
    settings: {
      version: 1,
      title: 'Title',
      titlePosition: order % 2 === 0 ? 'top' : 'bottom',
    },
    file,
    url: `blob:${id}`,
  }
}

describe('workspaceReducer frame limits', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('caps SELECT_FRAMES at the maximum frame count', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const frames = Array.from({ length: 12 }, (_, index) => createFrame(`f${index}`, index))

    const next = workspaceReducer(createEmptySketch(), {
      type: 'SELECT_FRAMES',
      frames,
    })

    expect(next.frames).toHaveLength(10)
    expect(next.frames.map((frame) => frame.id)).toEqual(
      Array.from({ length: 10 }, (_, index) => `f${index}`),
    )
    expect(revoke).toHaveBeenCalledWith('blob:f10')
    expect(revoke).toHaveBeenCalledWith('blob:f11')
  })

  it('caps ADD_FRAMES so the workspace never exceeds the maximum', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const initial = {
      ...createEmptySketch(),
      frames: Array.from({ length: 9 }, (_, index) => createFrame(`a${index}`, index)),
    }

    const next = workspaceReducer(initial, {
      type: 'ADD_FRAMES',
      frames: [createFrame('b0', 0), createFrame('b1', 1)],
    })

    expect(next.frames).toHaveLength(10)
    expect(next.frames.at(-1)?.id).toBe('b0')
    expect(revoke).toHaveBeenCalledWith('blob:b1')
  })
})
