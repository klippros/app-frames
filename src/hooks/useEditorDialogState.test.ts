// @vitest-environment happy-dom
/* oxlint-disable typescript/no-confusing-void-expression -- waitFor assertions return Vitest expectations. */

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthStatus } from '../types/auth'
import { useEditorDialogState } from './useEditorDialogState'

let authStatus: AuthStatus = AuthStatus.Anonymous

vi.mock('../hooks/authContext', () => ({
  useAuth: () => ({ authStatus }),
}))

describe('useEditorDialogState', () => {
  beforeEach(() => {
    authStatus = AuthStatus.Anonymous
  })

  it('resumes a pending save after authentication', async () => {
    const { result, rerender } = renderHook(() => useEditorDialogState())

    act(() => {
      result.current.setPendingSaveAfterAuth(true)
      result.current.setSignInOpen(true)
    })

    authStatus = AuthStatus.Authenticated
    rerender()

    await waitFor(() => expect(result.current.saveDialogOpen).toBe(true))
    expect(result.current.pendingSaveAfterAuth).toBe(false)
    expect(result.current.signInOpen).toBe(false)
  })

  it('fails closed at the project limit after authentication', async () => {
    const { result, rerender } = renderHook(({ atLimit }) => useEditorDialogState(atLimit), {
      initialProps: { atLimit: true },
    })

    act(() => {
      result.current.setPendingSaveAfterAuth(true)
      result.current.setSignInOpen(true)
    })

    authStatus = AuthStatus.Authenticated
    rerender({ atLimit: true })

    await waitFor(() => expect(result.current.pendingSaveAfterAuth).toBe(false))
    expect(result.current.saveDialogOpen).toBe(false)
    expect(result.current.signInOpen).toBe(false)
  })

  it('keeps post-export dismissal deterministic', () => {
    const { result } = renderHook(() => useEditorDialogState())

    act(() => {
      result.current.setPostExportOpen(true)
    })
    expect(result.current.postExportOpen).toBe(true)

    act(() => {
      result.current.setPostExportOpen(false)
    })
    expect(result.current.postExportOpen).toBe(false)
  })
})
