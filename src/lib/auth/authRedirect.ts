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

export const buildAuthRedirectUrl = (returnTo?: string | null): string => {
  const baseUrlValue: unknown = import.meta.env.BASE_URL
  const baseUrl = typeof baseUrlValue === 'string' ? baseUrlValue : '/tools/app-frames/'
  const callbackUrl = new URL(`${baseUrl}auth/callback`, window.location.origin)
  const safeReturnTo = resolveAuthReturnPath(returnTo ?? null)

  if (safeReturnTo !== null) {
    callbackUrl.searchParams.set('next', safeReturnTo)
  }

  return callbackUrl.toString()
}

export const AUTH_BROADCAST_CHANNEL = 'app-frames-auth'

export const AUTH_POPUP_NAME = 'app-frames-auth'
