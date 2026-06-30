import { Box, Button } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { toolbarControlSize } from '../layout'

export interface OutlineCircleIconButtonProps {
  'aria-label': string
  'aria-pressed'?: boolean
  children: ReactNode
  cursor?: string
  disabled?: boolean
  onClick?: () => void
  opacity?: number
  tone?: 'default' | 'destructive'
}

export const OutlineCircleIconButton = ({
  'aria-label': ariaLabel,
  'aria-pressed': ariaPressed,
  tone = 'default',
  children,
  disabled = false,
  onClick,
  opacity,
  cursor,
}: OutlineCircleIconButtonProps) => {
  const fillBg = tone === 'destructive' ? 'red.500' : 'white'

  return (
    <Button
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      size="sm"
      variant="ghost"
      position="relative"
      overflow="visible"
      w={toolbarControlSize}
      h={toolbarControlSize}
      minW={toolbarControlSize}
      minH={toolbarControlSize}
      maxW={toolbarControlSize}
      maxH={toolbarControlSize}
      p="0"
      borderRadius="full"
      bg="transparent"
      border="1px solid"
      borderColor="transparent"
      color="white"
      flexShrink={0}
      justifyContent="center"
      alignItems="center"
      lineHeight={1}
      transform="scale(1)"
      transformOrigin="center"
      transitionProperty="transform"
      transitionDuration="0.15s"
      transitionTimingFunction="ease-out"
      disabled={disabled}
      opacity={opacity}
      cursor={cursor}
      onClick={onClick}
      _hover={{ transform: 'scale(1.06)', opacity: 1 }}
      _active={{ transform: 'scale(0.98)' }}
    >
      <Box
        position="absolute"
        inset={0}
        borderRadius="full"
        bg={fillBg}
        pointerEvents="none"
        aria-hidden
      />
      <Box
        position="relative"
        zIndex={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
        css={
          tone === 'destructive'
            ? {
                '& svg': {
                  color: '#fff !important',
                },
              }
            : {
                '& svg': {
                  mixBlendMode: 'destination-out',
                  color: '#000 !important',
                },
              }
        }
      >
        {children}
      </Box>
    </Button>
  )
}
