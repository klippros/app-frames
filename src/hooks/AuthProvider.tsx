import type { User } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AUTH_BROADCAST_CHANNEL,
  AUTH_POPUP_NAME,
  buildAuthRedirectUrl,
} from '../lib/auth/authRedirect'
import { isSupabaseConfigured, supabaseClient } from '../lib/supabase/client'
import { AuthStatus } from '../types/auth'
import type { UserProfile } from '../types/auth'
import { AuthContext } from './authContext'
import { performSignOutCleanup } from '../lib/sync/signOutCleanup'

const getFallbackDisplayName = (user: User): string => {
  const metadata = user.user_metadata as Record<string, unknown>
  const fullName = metadata.full_name
  const name = metadata.name
  const metadataName = fullName ?? name

  if (typeof metadataName === 'string' && metadataName.trim() !== '') {
    return metadataName.trim()
  }

  const emailName = user.email?.split('@')[0]
  return emailName !== undefined && emailName !== '' ? emailName : 'You'
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authStatus, setAuthStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? AuthStatus.Loading : AuthStatus.Anonymous,
  )
  const currentUserId = useRef<string | null>(null)

  const applyUser = useCallback(async (nextUser: User | null) => {
    currentUserId.current = nextUser?.id ?? null
    setUser(nextUser)

    if (nextUser === null || supabaseClient === null) {
      setProfile(null)
      setAuthStatus(AuthStatus.Anonymous)
      return
    }

    setAuthStatus(AuthStatus.Authenticated)
    const userId = nextUser.id
    const { data } = await supabaseClient
      .from('profiles')
      .select('user_id, display_name')
      .eq('user_id', userId)
      .maybeSingle()

    if (currentUserId.current !== userId) {
      return
    }

    const displayName =
      typeof data?.display_name === 'string' && data.display_name.trim() !== ''
        ? data.display_name
        : getFallbackDisplayName(nextUser)

    setProfile({
      userId,
      displayName,
    })
  }, [])

  useEffect(() => {
    if (supabaseClient === null) {
      return undefined
    }

    const client = supabaseClient
    const initializeSession = async () => {
      const { data } = await client.auth.getSession()
      void applyUser(data.session?.user ?? null)
    }
    void initializeSession()

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      void applyUser(session?.user ?? null)
    })

    const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL)
    channel.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type !== 'signed-in') {
        return
      }

      void (async () => {
        const { data } = await client.auth.getSession()
        void applyUser(data.session?.user ?? null)
      })()
    }

    return () => {
      subscription.unsubscribe()
      channel.close()
    }
  }, [applyUser])

  const signInWithGoogle = useCallback(async (returnTo?: string): Promise<string | null> => {
    if (supabaseClient === null) {
      return 'Sign-in is not configured.'
    }

    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: buildAuthRedirectUrl(returnTo),
        skipBrowserRedirect: true,
      },
    })

    if (error !== null) {
      return error.message
    }

    if (data.url === null || data.url === undefined || data.url === '') {
      return 'Could not start Google sign-in.'
    }

    const popup = window.open(data.url, AUTH_POPUP_NAME, 'width=480,height=720')
    if (popup === null) {
      return 'Pop-up blocked. Allow pop-ups for this site to sign in.'
    }

    return null
  }, [])

  const signInWithEmail = useCallback(
    async (email: string, returnTo?: string): Promise<string | null> => {
      if (supabaseClient === null) {
        return 'Sign-in is not configured.'
      }

      const normalizedEmail = email.trim()

      if (normalizedEmail === '' || !normalizedEmail.includes('@')) {
        return 'Enter a valid email address.'
      }

      const { error } = await supabaseClient.auth.signInWithOtp({
        email: normalizedEmail,
        options: { emailRedirectTo: buildAuthRedirectUrl(returnTo) },
      })

      return error?.message ?? null
    },
    [],
  )

  const signOut = useCallback(async (): Promise<string | null> => {
    if (supabaseClient === null) {
      return null
    }

    const previousUserId = currentUserId.current
    await performSignOutCleanup(previousUserId)
    const { error } = await supabaseClient.auth.signOut()
    return error?.message ?? null
  }, [])

  const value = useMemo(
    () => ({
      user,
      profile,
      authStatus,
      isConfigured: isSupabaseConfigured,
      signInWithGoogle,
      signInWithEmail,
      signOut,
    }),
    [user, profile, authStatus, signInWithGoogle, signInWithEmail, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
