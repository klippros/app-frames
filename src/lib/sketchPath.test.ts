import { describe, expect, it } from 'vitest'
import { SKETCH_PATH, isSketchPath } from './sketchPath'

describe('sketchPath', () => {
  it('uses /sketch', () => {
    expect(SKETCH_PATH).toBe('/sketch')
  })

  it('detects the sketch route', () => {
    expect(isSketchPath('/sketch')).toBe(true)
    expect(isSketchPath('/')).toBe(false)
    expect(isSketchPath('/projects/11111111-1111-4111-8111-111111111111')).toBe(false)
  })
})
