export type Platform = 'ios' | 'android'

export type Store = 'app-store' | 'google-play'

export type ExportFormatKind = 'framed-phone' | 'framed-tablet' | 'feature-graphic'

export type RendererId =
  'ios-phone' | 'android-phone' | 'ios-tablet' | 'android-tablet' | 'feature-graphic'

export interface Screenshot {
  id: string
  file: File
  url: string
}

export interface ExportFormat {
  id: string
  label: string
  width: number
  height: number
  store: Store
  recommended?: boolean
  defaultChecked?: boolean
  kind: ExportFormatKind
  renderer: RendererId
  folderName: string
  description?: string
}
