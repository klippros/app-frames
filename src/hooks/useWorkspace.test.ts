// @vitest-environment happy-dom
/* oxlint-disable typescript/no-confusing-void-expression, typescript/unbound-method -- Hook actions and URL spies intentionally return void. */

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthStatus } from '../types/auth'
import type { Workspace } from '../workspace/types'
import { createEmptySketch } from '../workspace/types'
import { useWorkspace } from './useWorkspace'

let authUserId: string | null = 'user-a'
let authStatus: AuthStatus = AuthStatus.Authenticated

vi.mock('./authContext', () => ({
  useAuth: () => ({
    authStatus,
    user: authUserId === null ? null : { id: authUserId },
  }),
}))

vi.mock('./useProjectSync', () => ({
  useProjectSync: () => ({
    syncStatus: 'idle',
    syncMessage: undefined,
    saveNow: vi.fn(),
  }),
}))

vi.mock('../lib/sync/projectSync', () => ({
  getProjectSyncGeneration: vi.fn(() => null),
  stopProjectSync: vi.fn(),
  syncWorkspace: vi.fn(),
}))

const projectWorkspace = (): Workspace => ({
  ...createEmptySketch(),
  kind: 'project',
  id: 'project-a',
  name: 'Project A',
  ownerId: 'user-a',
  revision: 1,
  syncedRevision: 1,
  frames: [
    {
      id: 'frame-a',
      order: 0,
      settings: { version: 1, title: 'Frame', titlePosition: 'top' },
      file: new File(['a'], 'a.webp', { type: 'image/webp' }),
      url: 'blob:user-a-frame',
    },
  ],
})

describe('useWorkspace session transitions', () => {
  beforeEach(() => {
    authUserId = 'user-a'
    authStatus = AuthStatus.Authenticated
    vi.restoreAllMocks()
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
  })

  it('clears and revokes the old workspace on direct account replacement', async () => {
    const { result, rerender } = renderHook(() => useWorkspace())
    act(() => result.current.loadWorkspace(projectWorkspace()))

    authUserId = 'user-b'
    rerender()

    await waitFor(() => expect(result.current.workspace.kind).toBe('sketch'))
    expect(result.current.workspace.frames).toHaveLength(0)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:user-a-frame')
  })

  it('clears and revokes the old workspace on token expiry', async () => {
    const { result, rerender } = renderHook(() => useWorkspace())
    act(() => result.current.loadWorkspace(projectWorkspace()))

    authUserId = null
    authStatus = AuthStatus.Anonymous
    rerender()

    await waitFor(() => expect(result.current.workspace.kind).toBe('sketch'))
    expect(result.current.workspace.frames).toHaveLength(0)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:user-a-frame')
  })
})
