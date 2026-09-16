// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProjectFolderTile } from './ProjectFolderTile'

describe('ProjectFolderTile', () => {
  it('renders malicious project names as inert text', () => {
    const name = '<img src=x onerror="globalThis.projectNameExecuted=true">'
    const onClick = vi.fn()
    const { container } = render(
      <ProjectFolderTile
        name={name}
        onClick={() => {
          onClick()
        }}
      />,
    )

    expect(screen.getByText(name)).toBeTruthy()
    expect(container.querySelector('img')).toBeNull()
    expect((globalThis as Record<string, unknown>).projectNameExecuted).toBeUndefined()
  })
})
