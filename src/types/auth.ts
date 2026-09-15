import type { User } from '@supabase/supabase-js'

export interface UserProfile {
  userId: string
  displayName: string
}

export const AuthStatus = {
  Loading: 'loading',
  Anonymous: 'anonymous',
  Authenticated: 'authenticated',
} as const

export type AuthStatus = (typeof AuthStatus)[keyof typeof AuthStatus]

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  authStatus: AuthStatus
}
