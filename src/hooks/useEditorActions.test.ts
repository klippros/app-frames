// @vitest-environment happy-dom

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { featureGraphicGradient } from '../utils/featureGraphicConfig'
import { createEmptySketch } from '../workspace/types'
import { useEditorActions } from './useEditorActions'

vi.mock('../hooks/authContext', () => ({
  useAuth: () => ({ user: { id: 'user-a' } }),
}))

describe('useEditorActions', () => {
  it('routes to an empty project after it is created and synced', async () => {
    const promoteToProject = vi.fn(async () => '11111111-1111-4111-8111-111111111111')
    const openProject = vi.fn(() => undefined)
    const allowNextNavigation = vi.fn(() => undefined)
    const { result } = renderHook(() =>
      useEditorActions({
        workspace: createEmptySketch(),
        screenshots: [],
        gradientConfig: featureGraphicGradient,
        showBezel: true,
        isConfigured: true,
        hasScreenshots: false,
        promoteToProject,
        openProject,
        allowNextNavigation,
        onExportedSketch: vi.fn(() => undefined),
      }),
    )

    await act(async () => {
      await result.current.handleSaveAsProject('Empty project', [])
    })

    expect(promoteToProject).toHaveBeenCalledWith('Empty project', 'user-a', [])
    expect(allowNextNavigation).toHaveBeenCalledOnce()
    expect(openProject).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111')
  })
})
