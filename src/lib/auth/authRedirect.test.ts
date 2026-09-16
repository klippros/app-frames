import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildAuthRedirectUrl,
  consumeAuthReturnTo,
  rememberAuthReturnTo,
  resolveAuthReturnPath,
} from './authRedirect'

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
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds an allowlist-stable callback URL without query params', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://klippros.com' },
    })

    const url = new URL(buildAuthRedirectUrl())
    expect(url.origin).toBe('https://klippros.com')
    expect(url.pathname.endsWith('/auth/callback')).toBe(true)
    expect(url.search).toBe('')
  })
})

describe('auth return path storage', () => {
  const store = new Map<string, string>()

  afterEach(() => {
    store.clear()
    vi.unstubAllGlobals()
  })

  const stubSessionStorage = () => {
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
      clear: () => {
        store.clear()
      },
    })
  }

  it('remembers and consumes a safe return path', () => {
    stubSessionStorage()
    rememberAuthReturnTo('/projects/11111111-1111-1111-1111-111111111111')
    expect(consumeAuthReturnTo()).toBe('/projects/11111111-1111-1111-1111-111111111111')
    expect(consumeAuthReturnTo()).toBe('/')
  })

  it('ignores unsafe return paths', () => {
    stubSessionStorage()
    rememberAuthReturnTo('https://evil.example')
    expect(consumeAuthReturnTo()).toBe('/')
  })
})
