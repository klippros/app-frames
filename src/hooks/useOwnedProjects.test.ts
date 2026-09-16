// @vitest-environment happy-dom
/* oxlint-disable typescript/no-confusing-void-expression, typescript/unbound-method -- waitFor and spy assertions use imported mock functions. */

import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listProjects } from '../lib/sync/projectSync'
import { AuthStatus } from '../types/auth'
import { useOwnedProjects } from './useOwnedProjects'

let authStatus = AuthStatus.Authenticated
let isConfigured = true

vi.mock('./authContext', () => ({
  useAuth: () => ({ authStatus, isConfigured }),
}))

vi.mock('../lib/supabase/client', () => ({
  supabaseClient: {},
}))

vi.mock('../lib/sync/projectSync', () => ({
  listProjects: vi.fn(async () => []),
}))

describe('useOwnedProjects', () => {
  beforeEach(() => {
    authStatus = AuthStatus.Authenticated
    isConfigured = true
    vi.clearAllMocks()
  })

  it('fails closed without Supabase configuration', async () => {
    isConfigured = false

    const { result } = renderHook(() => useOwnedProjects())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.projects).toEqual([])
    expect(listProjects).not.toHaveBeenCalled()
  })

  it('refreshes projects when the refresh key changes', async () => {
    vi.mocked(listProjects)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: '11111111-1111-4111-8111-111111111111',
          user_id: 'user-a',
          name: 'Refreshed',
          revision: 1,
          global_settings: { version: 1 },
          created_at: '2026-09-16T10:00:00.000Z',
          updated_at: '2026-09-16T10:00:00.000Z',
          client_updated_at: '2026-09-16T10:00:00.000Z',
          last_snapshot_id: null,
        },
      ])

    const { result, rerender } = renderHook(({ refreshKey }) => useOwnedProjects(refreshKey), {
      initialProps: { refreshKey: 0 },
    })
    await waitFor(() => expect(listProjects).toHaveBeenCalledTimes(1))

    rerender({ refreshKey: 1 })

    await waitFor(() => expect(result.current.projects[0]?.name).toBe('Refreshed'))
    expect(listProjects).toHaveBeenCalledTimes(2)
  })
})
