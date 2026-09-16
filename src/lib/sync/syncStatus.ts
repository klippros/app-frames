export const SyncStatus = {
  Idle: 'idle',
  Syncing: 'syncing',
  Synced: 'synced',
  Error: 'error',
  Conflict: 'conflict',
} as const

export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus]
