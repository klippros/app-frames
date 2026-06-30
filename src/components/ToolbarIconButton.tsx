import { IconButton } from '@chakra-ui/react'
import type { ReactNode } from 'react'

// Matches GradientHueSelector: Input sm (sizes.9) + vertical padding (spacing.2 * 2)
export const toolbarControlHeight = 'calc(var(--chakra-sizes-9) + var(--chakra-spacing-2) * 2)'

const outlineToolbarStyles = {
  bg: 'bg',
  _hover: { bg: 'colorPalette.subtle' },
} as const

export interface ToolbarIconButtonProps {
  'aria-label': string
  'aria-pressed'?: boolean
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  variant?: 'outline' | 'solid'
}

export const ToolbarIconButton = ({
  'aria-label': ariaLabel,
  'aria-pressed': ariaPressed,
  children,
  disabled = false,
  onClick,
  variant = 'outline',
}: ToolbarIconButtonProps) => (
  <IconButton
    aria-label={ariaLabel}
    aria-pressed={ariaPressed}
    borderRadius="full"
    cursor={disabled ? 'not-allowed' : undefined}
    disabled={disabled}
    h={toolbarControlHeight}
    minW={toolbarControlHeight}
    opacity={disabled ? 0.45 : undefined}
    variant={variant}
    w={toolbarControlHeight}
    {...(variant === 'outline' ? outlineToolbarStyles : {})}
    onClick={onClick}
  >
    {children}
  </IconButton>
)
