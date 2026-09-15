import type { User } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useState } from 'react'
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

const getFallbackDisplayName = (user: User): string => {
  const fullName: unknown = user.user_metadata.full_name
  const name: unknown = user.user_metadata.name
  const metadataName = fullName ?? name

  if (typeof metadataName === 'string' && metadataName.trim() !== '') {
    return metadataName.trim()
  }

  const emailName = user.email?.split('@')[0]
  return emailName !== undefined && emailName !== '' ? emailName : 'You'
}

const toProfile = (user: User): UserProfile => ({
  userId: user.id,
  displayName: getFallbackDisplayName(user),
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authStatus, setAuthStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? AuthStatus.Loading : AuthStatus.Anonymous,
  )

  const applyUser = useCallback((nextUser: User | null) => {
    setUser(nextUser)

    if (nextUser === null) {
      setProfile(null)
      setAuthStatus(AuthStatus.Anonymous)
      return
    }

    setProfile(toProfile(nextUser))
    setAuthStatus(AuthStatus.Authenticated)
  }, [])

  useEffect(() => {
    if (supabaseClient === null) {
      return undefined
    }

    const client = supabaseClient
    const initializeSession = async () => {
      const { data } = await client.auth.getSession()
      applyUser(data.session?.user ?? null)
    }
    void initializeSession()

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null)
    })

    const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL)
    channel.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type !== 'signed-in') {
        return
      }

      void (async () => {
        const { data } = await client.auth.getSession()
        applyUser(data.session?.user ?? null)
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
