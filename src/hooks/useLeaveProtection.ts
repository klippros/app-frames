import { useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'

const LEAVE_MESSAGE = 'You have unsaved changes that are not synced yet. Leave anyway?'

export interface LeaveProtectionControls {
  /** Allow the next in-app navigation without the confirm prompt (e.g. after save). */
  allowNextNavigation: () => void
}

/** Block tab close and in-app navigation while local edits are at risk. */
export const useLeaveProtection = (enabled: boolean): LeaveProtectionControls => {
  const allowNextNavRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      // Chromium still requires returnValue to be set for the leave prompt.
      // oxlint-disable-next-line typescript/no-deprecated
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enabled])

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (allowNextNavRef.current) {
      allowNextNavRef.current = false
      return false
    }
    return enabled && currentLocation.pathname !== nextLocation.pathname
  })

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      return
    }

    if (window.confirm(LEAVE_MESSAGE)) {
      blocker.proceed()
      return
    }

    blocker.reset()
  }, [blocker])

  return {
    allowNextNavigation: () => {
      allowNextNavRef.current = true
    },
  }
}
