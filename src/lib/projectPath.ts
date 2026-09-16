export const projectPath = (projectId: string): string => `/projects/${projectId}`

const PROJECT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu

export const isProjectId = (value: string | undefined): value is string =>
  typeof value === 'string' && PROJECT_ID_PATTERN.test(value)
