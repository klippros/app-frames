import { describe, expect, it, vi } from 'vitest'
import { buildAuthRedirectUrl, resolveAuthReturnPath } from './authRedirect'

describe('resolveAuthReturnPath', () => {
  it('accepts relative in-app paths', () => {
    expect(resolveAuthReturnPath('/')).toBe('/')
    expect(resolveAuthReturnPath('/auth/callback')).toBe('/auth/callback')
    expect(resolveAuthReturnPath('/projects/11111111-1111-1111-1111-111111111111')).toBe(
      '/projects/11111111-1111-1111-1111-111111111111',
    )
  })

  it('rejects open redirects', () => {
    expect(resolveAuthReturnPath('https://evil.example')).toBeNull()
    expect(resolveAuthReturnPath('//evil.example')).toBeNull()
    expect(resolveAuthReturnPath('evil')).toBeNull()
    expect(resolveAuthReturnPath(null)).toBeNull()
  })
})

describe('buildAuthRedirectUrl', () => {
  it('builds a callback URL under the app origin with an optional next path', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://klippros.com' },
    })

    const url = new URL(buildAuthRedirectUrl('/'))
    expect(url.origin).toBe('https://klippros.com')
    expect(url.pathname.endsWith('/auth/callback')).toBe(true)
    expect(url.searchParams.get('next')).toBe('/')

    vi.unstubAllGlobals()
  })
})
