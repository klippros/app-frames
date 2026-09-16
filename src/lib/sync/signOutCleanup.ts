import { clearAllAppData, clearUserData } from './idb'
import { flushProjectSync, stopProjectSync } from './projectSync'

const FLUSH_TIMEOUT_MS = 4000

export const SignOutFlushOutcome = {
  Succeeded: 'succeeded',
  Failed: 'failed',
  TimedOut: 'timed-out',
} as const

export type SignOutFlushOutcome = (typeof SignOutFlushOutcome)[keyof typeof SignOutFlushOutcome]

const waitForFlush = async (
  promise: Promise<unknown>,
  ms: number,
): Promise<SignOutFlushOutcome> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise.then(
        () => SignOutFlushOutcome.Succeeded,
        () => SignOutFlushOutcome.Failed,
      ),
      new Promise<SignOutFlushOutcome>((resolve) => {
        timeoutId = globalThis.setTimeout(() => {
          resolve(SignOutFlushOutcome.TimedOut)
        }, ms)
      }),
    ])
  } finally {
    if (timeoutId !== undefined) {
      globalThis.clearTimeout(timeoutId)
    }
  }
}

export const performSignOutCleanup = async (
  userId: string | null,
): Promise<SignOutFlushOutcome> => {
  const flushOutcome = await waitForFlush(flushProjectSync(), FLUSH_TIMEOUT_MS)

  stopProjectSync()

  try {
    if (userId === null) {
      await clearAllAppData()
    } else {
      await clearUserData(userId)
    }
  } catch {
    try {
      await clearAllAppData()
    } catch {
      // Best-effort cleanup.
    }
  }

  return flushOutcome
}
