import { describe, expect, it } from 'vitest'
import { buildProjectImagePath, PROJECT_IMAGES_BUCKET } from './schema'

describe('buildProjectImagePath', () => {
  it('scopes immutable object keys by owner, project, and frame', () => {
    expect(
      buildProjectImagePath(
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        '33333333-3333-3333-3333-333333333333',
        'abcdef',
      ),
    ).toBe(
      '11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222/33333333-3333-3333-3333-333333333333/abcdef.webp',
    )
    expect(PROJECT_IMAGES_BUCKET).toBe('project-images')
  })
})
