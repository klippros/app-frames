import { Flex } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { ContentContainer } from './ContentContainer'

export interface MainContentProps {
  children: ReactNode
  /** Vertical alignment of content within the workspace area. */
  align?: 'center' | 'start'
}

export const MainContent = ({ children, align = 'center' }: MainContentProps) => (
  <Flex
    align={align === 'start' ? 'flex-start' : 'center'}
    flex="1"
    justify={align === 'start' ? 'flex-start' : 'center'}
    minH={0}
    overflowY="auto"
    w="full"
  >
    <ContentContainer>
      <Flex
        direction="column"
        flex="1"
        justify={align === 'start' ? 'flex-start' : 'center'}
        minH={0}
        py={align === 'start' ? 6 : 0}
      >
        {children}
      </Flex>
    </ContentContainer>
  </Flex>
)
