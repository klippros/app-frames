export const PRIMARY_NAV_PATH = '/' as const

export const primaryNavLabel = (isAuthenticated: boolean): string =>
  isAuthenticated ? 'Projects' : 'Home'
