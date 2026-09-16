import { describe, expect, it } from 'vitest'
import { isProjectId, projectPath } from './projectPath'

describe('projectPath', () => {
  it('builds a projects route', () => {
    expect(projectPath('11111111-1111-1111-1111-111111111111')).toBe(
      '/projects/11111111-1111-1111-1111-111111111111',
    )
  })
})

describe('isProjectId', () => {
  it('accepts UUID v4-shaped ids', () => {
    expect(isProjectId('11111111-1111-4111-8111-111111111111')).toBe(true)
  })

  it('rejects invalid values', () => {
    expect(isProjectId(undefined)).toBe(false)
    expect(isProjectId('not-a-uuid')).toBe(false)
    expect(isProjectId('11111111-1111-1111-1111-111111111111')).toBe(false)
  })
})
