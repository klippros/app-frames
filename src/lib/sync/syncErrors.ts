export const SyncFailureKind = {
  Offline: 'offline',
  Timeout: 'timeout',
  Conflict: 'conflict',
  Error: 'error',
} as const

export type SyncFailureKind = (typeof SyncFailureKind)[keyof typeof SyncFailureKind]

export class ProjectSyncError extends Error {
  readonly kind: SyncFailureKind

  constructor(kind: SyncFailureKind, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ProjectSyncError'
    this.kind = kind
  }
}

const fieldText = (value: unknown): string =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : ''

const errorText = (error: unknown): string => {
  if (error instanceof Error) {
    return `${error.name} ${error.message}`
  }
  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>
    return [
      fieldText(record.code),
      fieldText(record.status ?? record.statusCode),
      fieldText(record.message),
    ].join(' ')
  }
  return fieldText(error)
}

export const toProjectSyncError = (error: unknown): ProjectSyncError => {
  if (error instanceof ProjectSyncError) {
    return error
  }

  const normalized = errorText(error).toLowerCase()
  const cause = error instanceof Error ? error : undefined

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return new ProjectSyncError(
      SyncFailureKind.Offline,
      'Offline — changes remain saved on this device.',
      { cause },
    )
  }
  if (
    normalized.includes('aborterror') ||
    normalized.includes('timeout') ||
    normalized.includes('timed out') ||
    normalized.includes('etimedout')
  ) {
    return new ProjectSyncError(
      SyncFailureKind.Timeout,
      'Sync timed out — changes remain queued.',
      { cause },
    )
  }
  if (normalized.includes('conflict') || /\b409\b/u.test(normalized)) {
    return new ProjectSyncError(
      SyncFailureKind.Conflict,
      cause?.message ?? 'Sync conflict — refresh the project.',
      { cause },
    )
  }

  return new ProjectSyncError(
    SyncFailureKind.Error,
    cause?.message ?? 'Sync failed — changes remain queued.',
    { cause },
  )
}
