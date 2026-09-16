// @vitest-environment happy-dom
/* oxlint-disable typescript/no-confusing-void-expression, typescript/unbound-method -- Hook actions and URL spies intentionally return void. */

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { countProjects } from '../lib/sync/projectGateway'
import { getProjectSyncGeneration, syncWorkspace } from '../lib/sync/projectSync'
import { AuthStatus } from '../types/auth'
import { ImageNormalizationError, normalizeImageFile } from '../utils/normalizeImage'
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

vi.mock('../lib/supabase/client', () => ({
  supabaseClient: {},
}))

vi.mock('../lib/sync/projectGateway', () => ({
  FRAME_LIMIT_MESSAGE: 'A project can have at most 10 frames.',
  PROJECT_LIMIT_MESSAGE: 'You can save at most 3 projects. Delete one to continue.',
  countProjects: vi.fn(),
}))

vi.mock('../lib/sync/projectSync', () => ({
  getProjectSyncGeneration: vi.fn(),
  stopProjectSync: vi.fn(),
  syncWorkspace: vi.fn(),
}))

vi.mock('../utils/normalizeImage', () => {
  class MockImageNormalizationError extends Error {
    readonly fileName: string

    constructor(fileName: string, message: string) {
      super(message)
      this.fileName = fileName
    }
  }

  return {
    ImageNormalizationError: MockImageNormalizationError,
    normalizeImageFile: vi.fn(),
  }
})

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
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:replacement')
    vi.mocked(countProjects).mockResolvedValue(0)
    vi.mocked(getProjectSyncGeneration).mockReturnValue(1)
    vi.mocked(syncWorkspace).mockImplementation(async (_ownerId, workspace) => ({
      revision: workspace.revision,
      frameImages: {},
    }))
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

describe('useWorkspace project and replacement workflows', () => {
  beforeEach(() => {
    authUserId = 'user-a'
    authStatus = AuthStatus.Authenticated
    vi.restoreAllMocks()
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:replacement')
    vi.mocked(countProjects).mockResolvedValue(0)
    vi.mocked(getProjectSyncGeneration).mockReturnValue(1)
    vi.mocked(syncWorkspace).mockImplementation(async (_ownerId, workspace) => ({
      revision: workspace.revision,
      frameImages: {},
    }))
  })

  it('creates and syncs a named project with no frames', async () => {
    const { result } = renderHook(() => useWorkspace())

    let projectId = ''
    await act(async () => {
      projectId = await result.current.promoteToProject('  Empty project  ', 'user-a', [])
    })

    expect(projectId).not.toBe('')
    expect(result.current.workspace).toMatchObject({
      kind: 'project',
      id: projectId,
      name: 'Empty project',
      ownerId: 'user-a',
      frames: [],
    })
    expect(syncWorkspace).toHaveBeenCalledWith(
      'user-a',
      expect.objectContaining({ id: projectId, name: 'Empty project', frames: [] }),
      undefined,
      1,
    )
  })

  it('enforces project name and project-count limits downstream', async () => {
    const { result } = renderHook(() => useWorkspace())

    await expect(result.current.promoteToProject('   ', 'user-a', [])).rejects.toThrow(
      'Enter a project name',
    )
    await expect(result.current.promoteToProject('x'.repeat(101), 'user-a', [])).rejects.toThrow(
      '100 characters or fewer',
    )

    vi.mocked(countProjects).mockResolvedValue(3)
    await expect(result.current.promoteToProject('Fourth', 'user-a', [])).rejects.toThrow(
      'at most 3 projects',
    )

    vi.mocked(countProjects).mockResolvedValue(0)
    const tooManyFrames = Array.from({ length: 11 }, (_, index) => ({
      id: `frame-${index}`,
      file: new File(['frame'], `${index}.webp`, { type: 'image/webp' }),
      url: `blob:${index}`,
      title: `Frame ${index + 1}`,
      titlePosition: 'top' as const,
    }))
    await expect(
      result.current.promoteToProject('Too many', 'user-a', tooManyFrames),
    ).rejects.toThrow('at most 10 frames')
    expect(syncWorkspace).not.toHaveBeenCalled()
  })

  it('surfaces replacement errors without changing or revoking the old frame', async () => {
    vi.mocked(normalizeImageFile).mockRejectedValue(
      new ImageNormalizationError('bad.png', 'Could not decode image'),
    )
    const { result } = renderHook(() => useWorkspace())
    act(() => result.current.loadWorkspace(projectWorkspace()))
    vi.mocked(URL.revokeObjectURL).mockClear()

    await expect(
      result.current.replaceScreenshot(
        'frame-a',
        new File(['bad'], 'bad.png', { type: 'image/png' }),
      ),
    ).rejects.toThrow('Could not decode image')

    expect(result.current.workspace.frames[0]?.file.name).toBe('a.webp')
    expect(result.current.workspace.frames[0]?.url).toBe('blob:user-a-frame')
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })
})
