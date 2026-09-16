// @vitest-environment happy-dom
/* oxlint-disable typescript/strict-void-return -- Hook mocks intentionally return Vitest spies. */

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { featureGraphicGradient } from '../utils/featureGraphicConfig'
import { createEmptySketch } from '../workspace/types'
import { exportAssets } from '../utils/exportFrames'
import { useEditorActions } from './useEditorActions'

let authUser: { id: string } | null = { id: 'user-a' }

vi.mock('../hooks/authContext', () => ({
  useAuth: () => ({ user: authUser }),
}))

vi.mock('../utils/exportFrames', () => ({
  exportAssets: vi.fn(async () => undefined),
}))

describe('useEditorActions', () => {
  beforeEach(() => {
    authUser = { id: 'user-a' }
    vi.clearAllMocks()
  })

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

  it('opens an existing project at the route boundary', () => {
    const openProject = vi.fn()
    const { result } = renderHook(() =>
      useEditorActions({
        workspace: createEmptySketch(),
        screenshots: [],
        gradientConfig: featureGraphicGradient,
        showBezel: true,
        isConfigured: true,
        hasScreenshots: false,
        promoteToProject: vi.fn(),
        openProject,
        allowNextNavigation: vi.fn(),
        onExportedSketch: vi.fn(),
      }),
    )

    result.current.handleOpenProject('11111111-1111-4111-8111-111111111111')

    expect(openProject).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111')
  })

  it('keeps unconfigured exports in sketch-only mode', async () => {
    const onExportedSketch = vi.fn()
    const { result } = renderHook(() =>
      useEditorActions({
        workspace: createEmptySketch(),
        screenshots: [],
        gradientConfig: featureGraphicGradient,
        showBezel: true,
        isConfigured: false,
        hasScreenshots: true,
        promoteToProject: vi.fn(),
        openProject: vi.fn(),
        allowNextNavigation: vi.fn(),
        onExportedSketch,
      }),
    )

    await act(async () => {
      await result.current.handleExport(['app-store'])
    })

    expect(exportAssets).toHaveBeenCalledOnce()
    expect(onExportedSketch).not.toHaveBeenCalled()
  })

  it('prompts to save a configured sketch after export', async () => {
    const onExportedSketch = vi.fn()
    const { result } = renderHook(() =>
      useEditorActions({
        workspace: createEmptySketch(),
        screenshots: [],
        gradientConfig: featureGraphicGradient,
        showBezel: true,
        isConfigured: true,
        hasScreenshots: true,
        promoteToProject: vi.fn(),
        openProject: vi.fn(),
        allowNextNavigation: vi.fn(),
        onExportedSketch,
      }),
    )

    await act(async () => {
      await result.current.handleExport(['app-store'])
    })

    expect(onExportedSketch).toHaveBeenCalledOnce()
  })
})
