import { useCallback, useEffect, useRef, useState } from 'react'
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
import { useAuth } from './authContext'

const AUTOSAVE_MS = 800

export const useProjectSync = (workspace: Workspace, onSynced?: (revision: number) => void) => {
  const { authStatus, user, isConfigured } = useAuth()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.Idle)
  const [syncMessage, setSyncMessage] = useState<string | undefined>()
  const saveTimer = useRef<number | null>(null)
  const lastQueuedRevision = useRef<number | null>(null)

  useEffect(() => {
    if (!isConfigured || authStatus !== AuthStatus.Authenticated || !user || !supabaseClient) {
      stopProjectSync()
      setSyncStatus(SyncStatus.Idle)
      return undefined
    }

    startProjectSync(supabaseClient, user.id, (status, message) => {
      setSyncStatus(status)
      setSyncMessage(message)
      if (status === SyncStatus.Synced && lastQueuedRevision.current !== null) {
        onSynced?.(lastQueuedRevision.current)
      }
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
  }, [authStatus, isConfigured, onSynced, user])

  useEffect(() => {
    if (
      workspace.kind !== 'project' ||
      workspace.id === null ||
      !user ||
      authStatus !== AuthStatus.Authenticated
    ) {
      return undefined
    }

    // Skip autosave until the local revision diverges from the last synced one.
    if (workspace.revision === workspace.syncedRevision) {
      return undefined
    }

    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current)
    }

    saveTimer.current = window.setTimeout(() => {
      void (async () => {
        lastQueuedRevision.current = workspace.revision
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
    lastQueuedRevision.current = workspace.revision
    await queueWorkspaceSave(user.id, workspace)
    await flushProjectSync()
    // MARK_SYNCED is driven by the SyncStatus.Synced callback, not assumed success.
  }, [user, workspace])

  return {
    syncStatus,
    syncMessage,
    saveNow,
  }
}
