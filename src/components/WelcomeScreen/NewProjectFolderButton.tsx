import { Button, Text, VStack } from '@chakra-ui/react'
import { faFolderPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export interface NewProjectFolderButtonProps {
  onClick: () => void
}

export const NewProjectFolderButton = ({ onClick }: NewProjectFolderButtonProps) => (
  <Button
    variant="ghost"
    h="auto"
    p={3}
    borderRadius="12px"
    color="white"
    aria-label="New project"
    onClick={onClick}
    _hover={{ bg: 'whiteAlpha.100' }}
    _active={{ bg: 'whiteAlpha.150' }}
  >
    <VStack gap={2} w="7rem">
      <Text fontSize="2.5rem" lineHeight={1} color="whiteAlpha.700" aria-hidden>
        <FontAwesomeIcon icon={faFolderPlus} />
      </Text>
      <Text fontSize="sm" color="whiteAlpha.800" textAlign="center">
        New project
      </Text>
    </VStack>
  </Button>
)
