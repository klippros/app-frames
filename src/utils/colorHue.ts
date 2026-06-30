import { featureGraphicGradient } from './featureGraphicConfig'

const DEFAULT_BASE_COLOR = featureGraphicGradient.baseColor
const referenceHsl = hexToHsl(DEFAULT_BASE_COLOR)

export function getDefaultGradientHue(): number {
  return referenceHsl.h
}

export function colorWithHue(hue: number): string {
  return hslToHex(hue, referenceHsl.s, referenceHsl.l)
}

export function hueFromHex(hex: string): number | null {
  const rgb = parseHex(hex)
  if (!rgb) {
    return null
  }
  return rgbToHsl(rgb.r, rgb.g, rgb.b).h
}

export function baseColorFromHexInput(hex: string): string | null {
  const hue = hueFromHex(hex)
  if (hue === null) {
    return null
  }
  return colorWithHue(hue)
}

export function normalizeHex(hex: string): string {
  return hex.trim().toLowerCase()
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHex(hex).replace(/^#/u, '')
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/u.test(normalized)) {
    return null
  }

  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  }
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const lightness = (max + min) / 2
  const delta = max - min

  if (delta === 0) {
    return { h: 0, s: 0, l: lightness }
  }

  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)

  let hue = 0
  if (max === rn) {
    hue = ((gn - bn) / delta + (gn < bn ? 6 : 0)) / 6
  } else if (max === gn) {
    hue = ((bn - rn) / delta + 2) / 6
  } else {
    hue = ((rn - gn) / delta + 4) / 6
  }

  return { h: hue * 360, s: saturation, l: lightness }
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const rgb = parseHex(hex)
  if (!rgb) {
    return referenceHsl
  }
  return rgbToHsl(rgb.r, rgb.g, rgb.b)
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0
  let g = 0
  let b = 0

  if (hue < 60) {
    r = c
    g = x
  } else if (hue < 120) {
    r = x
    g = c
  } else if (hue < 180) {
    g = c
    b = x
  } else if (hue < 240) {
    g = x
    b = c
  } else if (hue < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }

  const toByte = (value: number) =>
    Math.round((value + m) * 255)
      .toString(16)
      .padStart(2, '0')

  return `#${toByte(r)}${toByte(g)}${toByte(b)}`
}
