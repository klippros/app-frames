import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthStatus } from '../types/auth'
import { supabaseClient } from '../lib/supabase/client'
import type { Workspace, WorkspaceImageMeta } from '../workspace/types'
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
  const lastQueuedRevision = useRef<number | null>(null)
  const lastQueuedFrameImages = useRef<Record<string, WorkspaceImageMeta>>({})
  const knownFramesRef = useRef<KnownFrame[]>([])
  const pendingFramesRef = useRef<KnownFrame[] | null>(null)
  const knownProjectIdRef = useRef<string | null>(null)

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
        if (pendingFramesRef.current !== null) {
          knownFramesRef.current = pendingFramesRef.current
          pendingFramesRef.current = null
        }
        onSynced?.(lastQueuedRevision.current, lastQueuedFrameImages.current)
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

        lastQueuedRevision.current = workspace.revision
        pendingFramesRef.current = nextKnown
        lastQueuedFrameImages.current = await queueWorkspaceSave(user.id, workspace, deletedFrames)
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
    const currentIds = new Set(workspace.frames.map((frame) => frame.id))
    const deletedFrames = knownFramesRef.current.filter((frame) => !currentIds.has(frame.id))
    const nextKnown = framesSnapshot(workspace)

    lastQueuedRevision.current = workspace.revision
    pendingFramesRef.current = nextKnown
    lastQueuedFrameImages.current = await queueWorkspaceSave(user.id, workspace, deletedFrames)
    await flushProjectSync()
    // MARK_SYNCED / known-frame advance is driven by SyncStatus.Synced.
  }, [user, workspace])

  return {
    syncStatus,
    syncMessage,
    saveNow,
  }
}
