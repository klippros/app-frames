import { Flex } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { ContentContainer } from './ContentContainer'

export interface MainContentProps {
  children: ReactNode
}

export const MainContent = ({ children }: MainContentProps) => (
  <Flex align="center" flex="1" justify="center" minH={0} overflowY="auto" w="full">
    <ContentContainer>
      <Flex direction="column" flex="1" justify="center" minH={0}>
        {children}
      </Flex>
    </ContentContainer>
  </Flex>
)
