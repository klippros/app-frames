import { Box, Button, Flex, Heading } from '@chakra-ui/react'

function App() {
  return (
    <Box minH="100vh" bg="bg">
      <Box as="header" borderBottomWidth="1px" borderColor="border" px={6} py={4}>
        <Heading size="lg" fontWeight="semibold">
          App Framer
        </Heading>
      </Box>

      <Flex flex="1" align="center" justify="center" minH="calc(100vh - 65px)">
        <Button size="lg">Select Screenshots</Button>
      </Flex>
    </Box>
  )
}

export default App
