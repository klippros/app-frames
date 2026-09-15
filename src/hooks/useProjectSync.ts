import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './authContext'
import { AuthStatus } from '../types/auth'
import { supabaseClient } from '../lib/supabase/client'
import type { Workspace } from '../workspace/types'
import {
  flushProjectSync,
  queueWorkspaceSave,
  retryProjectSync,
  startProjectSync,
  stopProjectSync,
  SyncStatus,
} from '../lib/sync/projectSync'

const AUTOSAVE_MS = 800

export const useProjectSync = (workspace: Workspace) => {
  const { authStatus, user, isConfigured } = useAuth()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.Idle)
  const [syncMessage, setSyncMessage] = useState<string | undefined>()
  const saveTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!isConfigured || authStatus !== AuthStatus.Authenticated || !user || !supabaseClient) {
      stopProjectSync()
      setSyncStatus(SyncStatus.Idle)
      return undefined
    }

    startProjectSync(supabaseClient, user.id, (status, message) => {
      setSyncStatus(status)
      setSyncMessage(message)
    })

    const onOnline = () => {
      void retryProjectSync()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void retryProjectSync()
      }
    }

    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
      stopProjectSync()
    }
  }, [authStatus, isConfigured, user])

  useEffect(() => {
    if (
      workspace.kind !== 'project' ||
      workspace.id === null ||
      !user ||
      authStatus !== AuthStatus.Authenticated
    ) {
      return undefined
    }

    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current)
    }

    saveTimer.current = window.setTimeout(() => {
      void (async () => {
        await queueWorkspaceSave(user.id, workspace)
        await flushProjectSync()
      })()
    }, AUTOSAVE_MS)

    return () => {
      if (saveTimer.current !== null) {
        window.clearTimeout(saveTimer.current)
      }
    }
  }, [authStatus, user, workspace])

  const saveNow = useCallback(async () => {
    if (!user || workspace.kind !== 'project') {
      return
    }
    await queueWorkspaceSave(user.id, workspace)
    await flushProjectSync()
  }, [user, workspace])

  return {
    syncStatus,
    syncMessage,
    saveNow,
  }
}
