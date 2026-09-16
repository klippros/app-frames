import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './authContext'
import { listProjects } from '../lib/sync/projectSync'
import type { ProjectRow } from '../lib/supabase/schema'
import { MAX_PROJECTS_PER_USER } from '../lib/supabase/schema'
import { supabaseClient } from '../lib/supabase/client'
import { AuthStatus } from '../types/auth'

export const useOwnedProjects = (refreshKey = 0) => {
  const { authStatus, isConfigured } = useAuth()
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!isConfigured || authStatus !== AuthStatus.Authenticated || !supabaseClient) {
      setProjects([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const rows = await listProjects(supabaseClient)
      setProjects(rows)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load projects.')
    } finally {
      setLoading(false)
    }
  }, [authStatus, isConfigured])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      if (!isConfigured || authStatus !== AuthStatus.Authenticated || !supabaseClient) {
        if (!cancelled) {
          setProjects([])
          setError(null)
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(null)
      try {
        const rows = await listProjects(supabaseClient)
        if (!cancelled) {
          setProjects(rows)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load projects.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authStatus, isConfigured, refreshKey])

  const projectCount = projects.length
  const atProjectLimit = projectCount >= MAX_PROJECTS_PER_USER

  return {
    projects,
    projectCount,
    atProjectLimit,
    loading,
    error,
    setError,
    reload,
  }
}
