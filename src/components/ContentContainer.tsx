import { Box } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { mainContentMaxWidth } from '../layout'

export interface ContentContainerProps {
  children: ReactNode
}

export const ContentContainer = ({ children }: ContentContainerProps) => (
  <Box maxW={mainContentMaxWidth} mx="auto" px={6} w="full">
    {children}
  </Box>
)
