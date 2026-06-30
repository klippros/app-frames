import { IconButton } from '@chakra-ui/react'
import type { ReactNode } from 'react'

// Matches GradientHueSelector: Input sm (sizes.9) + vertical padding (spacing.2 * 2)
export const toolbarControlHeight = 'calc(var(--chakra-sizes-9) + var(--chakra-spacing-2) * 2)'

export interface ToolbarIconButtonProps {
  'aria-label': string
  'aria-pressed'?: boolean
  children: ReactNode
  onClick?: () => void
  variant?: 'outline' | 'solid'
}

export const ToolbarIconButton = ({
  'aria-label': ariaLabel,
  'aria-pressed': ariaPressed,
  children,
  onClick,
  variant = 'outline',
}: ToolbarIconButtonProps) => (
  <IconButton
    aria-label={ariaLabel}
    aria-pressed={ariaPressed}
    borderRadius="full"
    h={toolbarControlHeight}
    minW={toolbarControlHeight}
    variant={variant}
    w={toolbarControlHeight}
    onClick={onClick}
  >
    {children}
  </IconButton>
)
