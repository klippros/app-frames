import type { ReactNode } from 'react'
import { OutlineCircleIconButton } from './OutlineCircleIconButton'

export interface ToolbarIconButtonProps {
  'aria-label': string
  'aria-pressed'?: boolean
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  tone?: 'default' | 'destructive'
}

const resolveOpacity = (disabled: boolean, ariaPressed: boolean | undefined): number => {
  if (disabled) {
    return 0.45
  }

  if (ariaPressed === undefined) {
    return 1
  }

  return ariaPressed ? 1 : 0.45
}

export const ToolbarIconButton = ({
  'aria-label': ariaLabel,
  'aria-pressed': ariaPressed,
  children,
  disabled = false,
  onClick,
  tone = 'default',
}: ToolbarIconButtonProps) => (
  <OutlineCircleIconButton
    aria-label={ariaLabel}
    aria-pressed={ariaPressed}
    disabled={disabled}
    tone={tone}
    opacity={resolveOpacity(disabled, ariaPressed)}
    cursor={disabled ? 'not-allowed' : undefined}
    onClick={onClick}
  >
    {children}
  </OutlineCircleIconButton>
)
