import type { Platform, TitlePosition } from '../types'
import { featureGraphicGradient } from '../utils/featureGraphicConfig'

export const WORKSPACE_SCHEMA_VERSION = 1 as const

export type WorkspaceKind = 'sketch' | 'project'

export interface GlobalSettingsV1 {
  version: 1
  platform: Platform
  gradientBaseColor: string
  showBezel: boolean
}

export interface FrameSettingsV1 {
  version: 1
  title: string
  titlePosition: TitlePosition
}

export interface WorkspaceImageMeta {
  contentType: string
  byteSize: number
  width?: number
  height?: number
  contentHash?: string
  storagePath?: string
}

/** Runtime frame: serializable settings plus in-memory image handles. */
export interface WorkspaceFrame {
  id: string
  order: number
  settings: FrameSettingsV1
  file: File
  url: string
  image?: WorkspaceImageMeta
}

export interface Workspace {
  schemaVersion: typeof WORKSPACE_SCHEMA_VERSION
  kind: WorkspaceKind
  /** Null for unnamed sketches; UUID for saved projects. */
  id: string | null
  name: string | null
  ownerId: string | null
  revision: number
  updatedAt: string | null
  globalSettings: GlobalSettingsV1
  frames: WorkspaceFrame[]
}

export const createDefaultGlobalSettings = (): GlobalSettingsV1 => ({
  version: 1,
  platform: 'ios',
  gradientBaseColor: featureGraphicGradient.baseColor,
  showBezel: true,
})

export const createEmptySketch = (): Workspace => ({
  schemaVersion: WORKSPACE_SCHEMA_VERSION,
  kind: 'sketch',
  id: null,
  name: null,
  ownerId: null,
  revision: 0,
  updatedAt: null,
  globalSettings: createDefaultGlobalSettings(),
  frames: [],
})
