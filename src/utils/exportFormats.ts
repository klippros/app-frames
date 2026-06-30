import type { ExportFormat, Platform } from '../types'

export const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'ios-6.9',
    label: 'iPhone 6.9" display',
    width: 1290,
    height: 2796,
    store: 'app-store',
    recommended: true,
    defaultChecked: true,
    kind: 'framed-phone',
    renderer: 'ios-phone',
    folderName: 'iphone-6.9',
  },
  {
    id: 'ios-6.5',
    label: 'iPhone 6.5" display',
    width: 1284,
    height: 2778,
    store: 'app-store',
    kind: 'framed-phone',
    renderer: 'ios-phone',
    folderName: 'iphone-6.5',
  },
  {
    id: 'ios-6.1',
    label: 'iPhone 6.1" display',
    width: 1170,
    height: 2532,
    store: 'app-store',
    kind: 'framed-phone',
    renderer: 'ios-phone',
    folderName: 'iphone-6.1',
  },
  {
    id: 'ipad-13',
    label: 'iPad 13" display',
    width: 2064,
    height: 2752,
    store: 'app-store',
    kind: 'framed-tablet',
    renderer: 'ios-tablet',
    folderName: 'ipad-13',
  },
  {
    id: 'android-phone',
    label: 'Phone screenshots',
    width: 1080,
    height: 1920,
    store: 'google-play',
    recommended: true,
    defaultChecked: true,
    kind: 'framed-phone',
    renderer: 'android-phone',
    folderName: 'phone',
  },
  {
    id: 'android-feature',
    label: 'Feature graphic',
    width: 1024,
    height: 500,
    store: 'google-play',
    recommended: true,
    defaultChecked: true,
    kind: 'feature-graphic',
    renderer: 'feature-graphic',
    folderName: 'feature-graphic',
    description: 'Required listing banner on Google Play',
  },
  {
    id: 'android-tablet',
    label: 'Tablet screenshots',
    width: 1600,
    height: 2560,
    store: 'google-play',
    kind: 'framed-tablet',
    renderer: 'android-tablet',
    folderName: 'tablet',
  },
]

export const PREVIEW_FORMAT_BY_PLATFORM: Record<Platform, ExportFormat> = {
  ios: EXPORT_FORMATS.find((format) => format.id === 'ios-6.9')!,
  android: EXPORT_FORMATS.find((format) => format.id === 'android-phone')!,
}

export const DEFAULT_SELECTED_FORMAT_IDS = EXPORT_FORMATS.filter(
  (format) => format.defaultChecked === true,
).map((format) => format.id)

export function getFormatsByStore(store: ExportFormat['store']) {
  return EXPORT_FORMATS.filter((format) => format.store === store)
}
