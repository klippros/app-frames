import { MAX_FRAMES_PER_PROJECT, MAX_PROJECTS_PER_USER } from '../supabase/schema'

export const PROJECT_LIMIT_MESSAGE = `You can save at most ${MAX_PROJECTS_PER_USER} projects. Delete one to continue.`
export const FRAME_LIMIT_MESSAGE = `A project can have at most ${MAX_FRAMES_PER_PROJECT} frames.`

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readErrorMessage = (error: unknown): string => {
  if (isRecord(error) && typeof error.message === 'string') {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return ''
}

export const mapLimitError = (error: unknown): never => {
  const message = readErrorMessage(error)
  const code = isRecord(error) && typeof error.code === 'string' ? error.code : ''
  const haystack = `${code} ${message}`.toLowerCase()

  if (
    haystack.includes('at most 3 projects') ||
    (haystack.includes('check_violation') && haystack.includes('project'))
  ) {
    throw new Error(PROJECT_LIMIT_MESSAGE)
  }

  if (haystack.includes('project_snapshot_frame_limit') || haystack.includes('at most 10 frames')) {
    throw new Error(FRAME_LIMIT_MESSAGE)
  }

  throw error instanceof Error ? error : new Error(message || 'Request failed')
}
