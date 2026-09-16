import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthStatus } from '../types/auth'
import { supabaseClient } from '../lib/supabase/client'
import type { Workspace, WorkspaceImageMeta } from '../workspace/types'
import {
  getProjectSyncGeneration,
  retryProjectSync,
  startProjectSync,
  stopProjectSync,
  syncWorkspace,
  SyncStatus,
} from '../lib/sync/projectSync'
import type { SyncedWorkspaceRevision } from '../lib/sync/projectSync'
import { useAuth } from './authContext'

const AUTOSAVE_MS = 800

export const useProjectSync = (
  workspace: Workspace,
  onSynced?: (revision: number, frameImages?: Record<string, WorkspaceImageMeta>) => void,
) => {
  const { authStatus, user, isConfigured } = useAuth()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.Idle)
  const [syncMessage, setSyncMessage] = useState<string | undefined>()
  const saveTimer = useRef<number | null>(null)
  const pendingSyncRef = useRef<SyncedWorkspaceRevision | null>(null)

  useEffect(() => {
    if (!isConfigured || authStatus !== AuthStatus.Authenticated || !user || !supabaseClient) {
      stopProjectSync()
      pendingSyncRef.current = null
      setSyncStatus(SyncStatus.Idle)
      return undefined
    }

    startProjectSync(supabaseClient, user.id, (status, message) => {
      setSyncStatus(status)
      setSyncMessage(message)
      if (status === SyncStatus.Synced && pendingSyncRef.current !== null) {
        const pending = pendingSyncRef.current
        pendingSyncRef.current = null
        onSynced?.(pending.revision, pending.frameImages)
      }
    })

    const retry = async () => {
      try {
        await retryProjectSync()
      } catch {
        // Status and queued writes are retained for another retry.
      }
    }
    const onOnline = () => {
      void retry()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void retry()
      }
    }

    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
      stopProjectSync()
      pendingSyncRef.current = null
    }
  }, [authStatus, isConfigured, onSynced, user])

  useEffect(() => {
    if (
      workspace.kind !== 'project' ||
      workspace.id === null ||
      !user ||
      workspace.ownerId !== user.id ||
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
        const generation = getProjectSyncGeneration(user.id)
        if (generation === null) {
          return
        }
        try {
          await syncWorkspace(
            user.id,
            workspace,
            (queued) => {
              pendingSyncRef.current = queued
            },
            generation,
          )
        } catch {
          // The queued writes and unsynced revision are retained for a later retry.
        }
      })()
    }, AUTOSAVE_MS)

    return () => {
      if (saveTimer.current !== null) {
        window.clearTimeout(saveTimer.current)
      }
    }
  }, [authStatus, user, workspace])

  const saveNow = useCallback(async () => {
    if (!user || workspace.kind !== 'project' || workspace.ownerId !== user.id) {
      return
    }
    const generation = getProjectSyncGeneration(user.id)
    if (generation === null) {
      throw new Error('Project sync is not active for the authenticated user.')
    }
    await syncWorkspace(
      user.id,
      workspace,
      (queued) => {
        pendingSyncRef.current = queued
      },
      generation,
    )
  }, [user, workspace])

  return {
    syncStatus,
    syncMessage,
    saveNow,
  }
}
