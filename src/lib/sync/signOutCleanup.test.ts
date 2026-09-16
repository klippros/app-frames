import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./projectSync', () => ({
  flushProjectSync: vi.fn(async () => undefined),
  stopProjectSync: vi.fn(),
}))

vi.mock('./idb', () => ({
  clearUserData: vi.fn(async () => undefined),
  clearAllAppData: vi.fn(async () => undefined),
}))

describe('performSignOutCleanup', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const sync = await import('./projectSync')
    vi.mocked(sync.flushProjectSync).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('flushes, stops sync, and clears the user store', async () => {
    const { performSignOutCleanup, SignOutFlushOutcome } = await import('./signOutCleanup')
    const sync = await import('./projectSync')
    const idb = await import('./idb')

    const outcome = await performSignOutCleanup('user-1')

    expect(outcome).toBe(SignOutFlushOutcome.Succeeded)
    expect(sync.flushProjectSync).toHaveBeenCalled()
    expect(sync.stopProjectSync).toHaveBeenCalled()
    expect(idb.clearUserData).toHaveBeenCalledWith('user-1')
  })

  it('reports a failed flush but continues logout cleanup', async () => {
    const { performSignOutCleanup, SignOutFlushOutcome } = await import('./signOutCleanup')
    const sync = await import('./projectSync')
    const idb = await import('./idb')
    vi.mocked(sync.flushProjectSync).mockRejectedValueOnce(new Error('sync failed'))

    const outcome = await performSignOutCleanup('user-1')

    expect(outcome).toBe(SignOutFlushOutcome.Failed)
    expect(sync.stopProjectSync).toHaveBeenCalled()
    expect(idb.clearUserData).toHaveBeenCalledWith('user-1')
  })

  it('bounds the flush wait and continues logout cleanup after timeout', async () => {
    vi.useFakeTimers()
    const { performSignOutCleanup, SignOutFlushOutcome } = await import('./signOutCleanup')
    const sync = await import('./projectSync')
    const idb = await import('./idb')
    vi.mocked(sync.flushProjectSync).mockReturnValueOnce(new Promise(() => {}))

    const cleanup = performSignOutCleanup('user-1')
    await vi.advanceTimersByTimeAsync(4000)

    await expect(cleanup).resolves.toBe(SignOutFlushOutcome.TimedOut)
    expect(sync.stopProjectSync).toHaveBeenCalled()
    expect(idb.clearUserData).toHaveBeenCalledWith('user-1')
  })

  it('does not flush old writes during account replacement or token expiry', async () => {
    const { performSessionTransitionCleanup } = await import('./signOutCleanup')
    const sync = await import('./projectSync')
    const idb = await import('./idb')

    await performSessionTransitionCleanup('user-1')

    expect(sync.stopProjectSync).toHaveBeenCalledBefore(vi.mocked(idb.clearUserData))
    expect(sync.flushProjectSync).not.toHaveBeenCalled()
    expect(idb.clearUserData).toHaveBeenCalledWith('user-1')
  })
})
