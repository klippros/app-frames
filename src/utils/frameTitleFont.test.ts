import { afterEach, describe, expect, it, vi } from 'vitest'
import { ensureTitleFontLoaded, isTitleFontReady, TITLE_FONT_FAMILY } from './titleFont'

describe('title font loading', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps a CSS fallback family', () => {
    expect(TITLE_FONT_FAMILY).toBe("'Archivo Black', sans-serif")
  })

  it('is not ready when the document font set is unavailable', () => {
    expect(isTitleFontReady()).toBe(false)
  })

  it('loads Archivo Black without a fallback family', async () => {
    const load = vi.fn().mockResolvedValue([])
    const check = vi.fn().mockReturnValue(false)
    vi.stubGlobal('document', { fonts: { load, check } })

    await ensureTitleFontLoaded(32)

    expect(load).toHaveBeenCalledWith('32px "Archivo Black"')
  })

  it('reports ready after the named font can be used', () => {
    const check = vi.fn().mockReturnValue(true)
    vi.stubGlobal('document', { fonts: { load: vi.fn(), check } })

    expect(isTitleFontReady(16)).toBe(true)
    expect(check).toHaveBeenCalledWith('16px "Archivo Black"')
  })
})
