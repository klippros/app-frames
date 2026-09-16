import { createContext, useContext } from 'react'
import type { AuthState } from '../types/auth'

export interface AuthContextValue extends AuthState {
  isConfigured: boolean
  signInWithGoogle: (returnTo?: string) => Promise<string | null>
  signInWithEmail: (email: string, returnTo?: string) => Promise<string | null>
  signOut: () => Promise<string | null>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = (): AuthContextValue => {
  const value = useContext(AuthContext)

  if (value === null) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return value
}
