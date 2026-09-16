// @vitest-environment happy-dom
/* oxlint-disable react/display-name, typescript/no-confusing-void-expression, typescript/strict-void-return, typescript/unbound-method -- Hook harnesses and spy assertions use callback values directly. */

import { renderHook, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import type { PropsWithChildren } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hydrateProjectWorkspace } from '../lib/sync/projectSync'
import { AuthStatus } from '../types/auth'
import type { Workspace } from '../workspace/types'
import { createEmptySketch } from '../workspace/types'
import { useProjectRoute } from './useProjectRoute'

let authUserId: string | null = 'user-a'
let authStatus: AuthStatus = AuthStatus.Authenticated

vi.mock('./authContext', () => ({
  useAuth: () => ({
    authStatus,
    user: authUserId === null ? null : { id: authUserId },
  }),
}))

vi.mock('../lib/supabase/client', () => ({
  supabaseClient: {},
}))

vi.mock('../lib/sync/projectSync', () => ({
  hydrateProjectWorkspace: vi.fn(),
}))

const projectWorkspace = (ownerId = 'user-a'): Workspace => ({
  ...createEmptySketch(),
  kind: 'project',
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Project',
  ownerId,
  revision: 1,
  syncedRevision: 1,
})

const routeWrapper =
  (path: string) =>
  ({ children }: PropsWithChildren) => {
    const routePattern = path.startsWith('/projects/') ? '/projects/:projectId' : '*'
    return createElement(
      MemoryRouter,
      { initialEntries: [path] },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: routePattern,
          element: children,
        }),
      ),
    )
  }

describe('useProjectRoute lifecycle ownership', () => {
  beforeEach(() => {
    authUserId = 'user-a'
    authStatus = AuthStatus.Authenticated
    vi.clearAllMocks()
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
  })

  it('resets a project when the URL enters sketch mode', () => {
    const resetWorkspace = vi.fn()

    renderHook(() => useProjectRoute(projectWorkspace(), vi.fn(), resetWorkspace), {
      wrapper: routeWrapper('/sketch'),
    })

    expect(resetWorkspace).toHaveBeenCalledOnce()
  })

  it('clears editor state on the home route', () => {
    const resetWorkspace = vi.fn()
    const sketch = {
      ...createEmptySketch(),
      revision: 1,
      frames: [
        {
          id: 'frame-a',
          order: 0,
          settings: { version: 1 as const, title: 'Frame', titlePosition: 'top' as const },
          file: new File(['a'], 'a.webp'),
          url: 'blob:frame-a',
        },
      ],
    }

    renderHook(() => useProjectRoute(sketch, vi.fn(), resetWorkspace), {
      wrapper: routeWrapper('/'),
    })

    expect(resetWorkspace).toHaveBeenCalledOnce()
  })

  it('reuses a routed project only for the matching authenticated owner', () => {
    const resetWorkspace = vi.fn()

    renderHook(() => useProjectRoute(projectWorkspace('user-b'), vi.fn(), resetWorkspace), {
      wrapper: routeWrapper('/projects/11111111-1111-4111-8111-111111111111'),
    })

    expect(resetWorkspace).toHaveBeenCalledOnce()
    expect(hydrateProjectWorkspace).not.toHaveBeenCalled()
  })

  it('does not retain a routed project after token expiry', async () => {
    authUserId = null
    authStatus = AuthStatus.Anonymous

    const { result } = renderHook(() => useProjectRoute(projectWorkspace(), vi.fn(), vi.fn()), {
      wrapper: routeWrapper('/projects/11111111-1111-4111-8111-111111111111'),
    })

    await waitFor(() => expect(result.current.routeError).toBe('Sign in to open this project.'))
    expect(hydrateProjectWorkspace).not.toHaveBeenCalled()
  })

  it('revokes a hydration result discarded during an account switch', async () => {
    let resolveFirst = (_workspace: Workspace): void => {
      throw new Error('Hydration did not start.')
    }
    vi.mocked(hydrateProjectWorkspace)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = (workspace) => {
              resolve(workspace)
            }
          }),
      )
      .mockImplementationOnce(() => new Promise(() => {}))
    const hydrated = {
      ...projectWorkspace(),
      frames: [
        {
          id: 'frame-a',
          order: 0,
          settings: { version: 1 as const, title: 'Frame', titlePosition: 'top' as const },
          file: new File(['a'], 'a.webp'),
          url: 'blob:hydrated-a',
        },
      ],
    }
    const loadWorkspace = vi.fn()
    const resetWorkspace = vi.fn()

    const { rerender } = renderHook(
      () => useProjectRoute(createEmptySketch(), loadWorkspace, resetWorkspace),
      {
        wrapper: routeWrapper('/projects/11111111-1111-4111-8111-111111111111'),
      },
    )
    await waitFor(() => expect(hydrateProjectWorkspace).toHaveBeenCalledOnce())

    authUserId = 'user-b'
    rerender()
    resolveFirst(hydrated)

    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:hydrated-a'))
  })
})
