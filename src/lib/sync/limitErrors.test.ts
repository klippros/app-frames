import { describe, expect, it } from 'vitest'
import { FRAME_LIMIT_MESSAGE, mapLimitError } from './limitErrors'

describe('mapLimitError', () => {
  it('maps the explicit snapshot frame-limit signal', () => {
    expect(() => mapLimitError({ code: '23514', message: 'project_snapshot_frame_limit' })).toThrow(
      FRAME_LIMIT_MESSAGE,
    )
  })

  it('does not misreport reorder uniqueness failures as frame-limit errors', () => {
    const error = new Error(
      'duplicate key value violates unique constraint project_frames_user_id_project_id_frame_order_key',
    )

    expect(() => mapLimitError(error)).toThrow(error)
  })
})
