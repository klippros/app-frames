import { describe, expect, it, vi } from 'vitest'

vi.mock('./projectSync', () => ({
  flushProjectSync: vi.fn(async () => undefined),
  stopProjectSync: vi.fn(),
}))

vi.mock('./idb', () => ({
  clearUserData: vi.fn(async () => undefined),
  clearAllAppData: vi.fn(async () => undefined),
}))

describe('performSignOutCleanup', () => {
  it('flushes, stops sync, and clears the user store', async () => {
    const { performSignOutCleanup } = await import('./signOutCleanup')
    const sync = await import('./projectSync')
    const idb = await import('./idb')

    await performSignOutCleanup('user-1')

    expect(sync.flushProjectSync).toHaveBeenCalled()
    expect(sync.stopProjectSync).toHaveBeenCalled()
    expect(idb.clearUserData).toHaveBeenCalledWith('user-1')
  })
})
