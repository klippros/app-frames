import { clearAllAppData, clearUserData } from './idb'
import { flushProjectSync, stopProjectSync } from './projectSync'

const FLUSH_TIMEOUT_MS = 4000

const withTimeout = async (promise: Promise<unknown>, ms: number): Promise<void> => {
  let timeoutId = 0
  try {
    await Promise.race([
      promise,
      new Promise<void>((resolve) => {
        timeoutId = window.setTimeout(() => {
          resolve()
        }, ms)
      }),
    ])
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export const performSignOutCleanup = async (userId: string | null): Promise<void> => {
  try {
    await withTimeout(flushProjectSync(), FLUSH_TIMEOUT_MS)
  } catch {
    // Local cleanup still proceeds when the final flush fails.
  }

  stopProjectSync()

  try {
    if (userId !== null) {
      await clearUserData(userId)
    } else {
      await clearAllAppData()
    }
  } catch {
    try {
      await clearAllAppData()
    } catch {
      // Best-effort cleanup.
    }
  }
}
