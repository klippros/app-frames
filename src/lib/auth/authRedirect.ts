/** Relative in-app path only — rejects open redirects. */
export const resolveAuthReturnPath = (raw: string | null | undefined): string | null => {
  if (raw === undefined || raw === null || raw === '') {
    return null
  }

  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('://')) {
    return null
  }

  return raw
}

const AUTH_RETURN_TO_KEY = 'app-frames-auth-return-to'

/**
 * Exact callback URL for Supabase allowlists. Do not append query params —
 * GoTrue matches redirect URLs exactly, so `?next=` breaks sign-in.
 */
export const buildAuthRedirectUrl = (): string => {
  const baseUrlValue: unknown = import.meta.env.BASE_URL
  const baseUrl = typeof baseUrlValue === 'string' ? baseUrlValue : '/tools/app-frames/'
  return new URL(`${baseUrl}auth/callback`, window.location.origin).toString()
}

export const rememberAuthReturnTo = (returnTo?: string | null): void => {
  const safeReturnTo = resolveAuthReturnPath(returnTo ?? null)
  if (safeReturnTo === null) {
    sessionStorage.removeItem(AUTH_RETURN_TO_KEY)
    return
  }
  sessionStorage.setItem(AUTH_RETURN_TO_KEY, safeReturnTo)
}

export const consumeAuthReturnTo = (): string => {
  const raw = sessionStorage.getItem(AUTH_RETURN_TO_KEY)
  sessionStorage.removeItem(AUTH_RETURN_TO_KEY)
  return resolveAuthReturnPath(raw) ?? '/'
}

export const AUTH_BROADCAST_CHANNEL = 'app-frames-auth'

export const AUTH_POPUP_NAME = 'app-frames-auth'
