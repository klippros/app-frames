import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from './authContext'
import { AuthStatus } from '../types/auth'
import { hydrateProjectWorkspace } from '../lib/sync/projectSync'
import { supabaseClient } from '../lib/supabase/client'
import { isProjectId, projectPath } from '../lib/projectPath'
import { SKETCH_PATH, isSketchPath } from '../lib/sketchPath'
import type { Workspace } from '../workspace/types'

export const useProjectRoute = (
  workspace: Workspace,
  loadWorkspace: (workspace: Workspace) => void,
  resetWorkspace: () => void,
) => {
  const { projectId: rawProjectId } = useParams<{ projectId?: string }>()
  const routeProjectId = isProjectId(rawProjectId) ? rawProjectId : undefined
  const location = useLocation()
  const isSketchRoute = isSketchPath(location.pathname)
  const isHomeRoute = routeProjectId === undefined && !isSketchRoute
  const navigate = useNavigate()
  const { user, authStatus } = useAuth()
  const authenticatedUserId = authStatus === AuthStatus.Authenticated ? (user?.id ?? null) : null
  const [routeError, setRouteError] = useState<string | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const loadingKeyRef = useRef<string | null>(null)
  const authIdentityRef = useRef<string | null>(authenticatedUserId)
  authIdentityRef.current = authenticatedUserId
  const activeWorkspaceId = workspace.kind === 'project' ? workspace.id : null
  const hasWorkspaceState =
    workspace.kind === 'project' || workspace.frames.length > 0 || workspace.revision !== 0

  // URL is the source of truth: hydrate on project routes, clear when leaving editor routes.
  useEffect(() => {
    if (rawProjectId !== undefined && routeProjectId === undefined) {
      setRouteError('Invalid project link.')
      void navigate('/', { replace: true })
      return undefined
    }

    if (isHomeRoute) {
      if (hasWorkspaceState) {
        resetWorkspace()
      }
      setRouteError(null)
      loadingKeyRef.current = null
      setIsOpening(false)
      return undefined
    }

    if (isSketchRoute) {
      if (workspace.kind === 'project') {
        resetWorkspace()
      }
      setRouteError(null)
      loadingKeyRef.current = null
      setIsOpening(false)
      return undefined
    }

    if (routeProjectId === undefined) {
      return undefined
    }

    const projectId = routeProjectId

    if (authStatus === AuthStatus.Loading) {
      return undefined
    }

    if (authenticatedUserId === null || !supabaseClient) {
      setRouteError('Sign in to open this project.')
      loadingKeyRef.current = null
      setIsOpening(false)
      return undefined
    }

    // Already showing this project for the current authenticated owner.
    if (activeWorkspaceId === projectId && workspace.ownerId === authenticatedUserId) {
      setRouteError(null)
      setIsOpening(false)
      loadingKeyRef.current = null
      return undefined
    }

    if (workspace.kind === 'project') {
      resetWorkspace()
      return undefined
    }

    const loadingKey = `${authenticatedUserId}/${projectId}`
    if (loadingKeyRef.current === loadingKey) {
      return undefined
    }

    let cancelled = false
    loadingKeyRef.current = loadingKey
    setIsOpening(true)
    setRouteError(null)

    void (async () => {
      let next: Workspace | null = null
      try {
        next = await hydrateProjectWorkspace(supabaseClient, authenticatedUserId, projectId)
        if (cancelled || authIdentityRef.current !== authenticatedUserId) {
          if (next !== null) {
            for (const frame of next.frames) {
              URL.revokeObjectURL(frame.url)
            }
          }
          return
        }
        if (!next) {
          setRouteError('Project not found.')
          void navigate('/', { replace: true })
          return
        }
        loadWorkspace(next)
        setRouteError(null)
      } catch (error) {
        if (cancelled) {
          return
        }
        setRouteError(error instanceof Error ? error.message : 'Could not open project.')
      } finally {
        if (!cancelled && loadingKeyRef.current === loadingKey) {
          loadingKeyRef.current = null
          setIsOpening(false)
        }
      }
    })()

    return () => {
      cancelled = true
      if (loadingKeyRef.current === loadingKey) {
        loadingKeyRef.current = null
      }
    }
  }, [
    activeWorkspaceId,
    authenticatedUserId,
    authStatus,
    isHomeRoute,
    isSketchRoute,
    hasWorkspaceState,
    loadWorkspace,
    navigate,
    rawProjectId,
    resetWorkspace,
    routeProjectId,
    workspace.kind,
    workspace.ownerId,
  ])

  const openProject = useCallback(
    (projectId: string) => {
      void navigate(projectPath(projectId))
    },
    [navigate],
  )

  const openSketch = useCallback(() => {
    void navigate(SKETCH_PATH)
  }, [navigate])

  return {
    routeProjectId,
    isSketchRoute,
    isHomeRoute,
    routeError,
    isOpening,
    openProject,
    openSketch,
  }
}
