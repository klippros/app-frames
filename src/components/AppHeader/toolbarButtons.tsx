import { Button } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { toolbarControlSize } from '../../layout'

/** Plain Button element for Chakra `asChild` triggers (must not be a wrapper component). */
export const createToolbarIconButton = (ariaLabel: string, children: ReactNode) => (
  <Button
    aria-label={ariaLabel}
    variant="ghost"
    color="whiteAlpha.800"
    minW={toolbarControlSize}
    w={toolbarControlSize}
    h={toolbarControlSize}
    p={0}
    _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
    _expanded={{ color: 'white', bg: 'whiteAlpha.100' }}
  >
    {children}
  </Button>
)
