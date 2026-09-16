import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthStatus } from '../types/auth'
import { supabaseClient } from '../lib/supabase/client'
import type { Workspace, WorkspaceImageMeta } from '../workspace/types'
import {
  retryProjectSync,
  startProjectSync,
  stopProjectSync,
  syncWorkspace,
  SyncStatus,
} from '../lib/sync/projectSync'
import type { SyncedWorkspaceRevision } from '../lib/sync/projectSync'
import { useAuth } from './authContext'

const AUTOSAVE_MS = 800

interface KnownFrame {
  id: string
  imagePath?: string
}

const framesSnapshot = (workspace: Workspace): KnownFrame[] =>
  workspace.frames.map((frame) => ({
    id: frame.id,
    imagePath: frame.image?.storagePath,
  }))

export const useProjectSync = (
  workspace: Workspace,
  onSynced?: (revision: number, frameImages?: Record<string, WorkspaceImageMeta>) => void,
) => {
  const { authStatus, user, isConfigured } = useAuth()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.Idle)
  const [syncMessage, setSyncMessage] = useState<string | undefined>()
  const saveTimer = useRef<number | null>(null)
  const knownFramesRef = useRef<KnownFrame[]>([])
  const pendingSyncRef = useRef<(SyncedWorkspaceRevision & { knownFrames: KnownFrame[] }) | null>(
    null,
  )
  const knownProjectIdRef = useRef<string | null>(null)

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
        knownFramesRef.current = pending.knownFrames
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

  // Seed known frames from a clean server-backed workspace (hydrate / after sync).
  useEffect(() => {
    if (workspace.kind !== 'project' || workspace.id === null) {
      knownFramesRef.current = []
      knownProjectIdRef.current = null
      return
    }

    if (workspace.id !== knownProjectIdRef.current) {
      knownProjectIdRef.current = workspace.id
      knownFramesRef.current = framesSnapshot(workspace)
      pendingSyncRef.current = null
      return
    }

    if (workspace.revision === workspace.syncedRevision) {
      knownFramesRef.current = framesSnapshot(workspace)
    }
  }, [workspace])

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
        const currentIds = new Set(workspace.frames.map((frame) => frame.id))
        const deletedFrames = knownFramesRef.current.filter((frame) => !currentIds.has(frame.id))
        const nextKnown = framesSnapshot(workspace)

        try {
          await syncWorkspace(user.id, workspace, deletedFrames, (queued) => {
            pendingSyncRef.current = { ...queued, knownFrames: nextKnown }
          })
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
    if (!user || workspace.kind !== 'project') {
      return
    }
    const currentIds = new Set(workspace.frames.map((frame) => frame.id))
    const deletedFrames = knownFramesRef.current.filter((frame) => !currentIds.has(frame.id))
    const nextKnown = framesSnapshot(workspace)

    await syncWorkspace(user.id, workspace, deletedFrames, (queued) => {
      pendingSyncRef.current = { ...queued, knownFrames: nextKnown }
    })
  }, [user, workspace])

  return {
    syncStatus,
    syncMessage,
    saveNow,
  }
}
