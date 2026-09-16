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
  const [routeError, setRouteError] = useState<string | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const loadingIdRef = useRef<string | null>(null)
  const previousRouteProjectId = useRef<string | undefined>(routeProjectId)
  const previousIsSketchRoute = useRef(isSketchRoute)
  const activeWorkspaceId = workspace.kind === 'project' ? workspace.id : null

  // URL is the source of truth: hydrate on project routes, clear when leaving editor routes.
  useEffect(() => {
    const leftProjectRoute =
      previousRouteProjectId.current !== undefined && routeProjectId === undefined
    const leftSketchRoute = previousIsSketchRoute.current && !isSketchRoute
    previousRouteProjectId.current = routeProjectId
    previousIsSketchRoute.current = isSketchRoute

    if (rawProjectId !== undefined && routeProjectId === undefined) {
      setRouteError('Invalid project link.')
      void navigate('/', { replace: true })
      return undefined
    }

    if (isHomeRoute) {
      if (leftProjectRoute || leftSketchRoute) {
        resetWorkspace()
      }
      setRouteError(null)
      loadingIdRef.current = null
      setIsOpening(false)
      return undefined
    }

    if (isSketchRoute) {
      setRouteError(null)
      loadingIdRef.current = null
      setIsOpening(false)
      return undefined
    }

    // Already showing this project (e.g. just created / saved).
    if (activeWorkspaceId === routeProjectId) {
      setRouteError(null)
      setIsOpening(false)
      loadingIdRef.current = null
      return undefined
    }

    if (authStatus === AuthStatus.Loading) {
      return undefined
    }

    if (authStatus !== AuthStatus.Authenticated || !user || !supabaseClient) {
      setRouteError('Sign in to open this project.')
      return undefined
    }

    if (loadingIdRef.current === routeProjectId) {
      return undefined
    }

    let cancelled = false
    loadingIdRef.current = routeProjectId
    setIsOpening(true)
    setRouteError(null)

    void (async () => {
      try {
        const next = await hydrateProjectWorkspace(supabaseClient, user.id, routeProjectId)
        if (cancelled) {
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
        if (!cancelled && loadingIdRef.current === routeProjectId) {
          loadingIdRef.current = null
          setIsOpening(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    activeWorkspaceId,
    authStatus,
    isHomeRoute,
    isSketchRoute,
    loadWorkspace,
    navigate,
    rawProjectId,
    resetWorkspace,
    routeProjectId,
    user,
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
