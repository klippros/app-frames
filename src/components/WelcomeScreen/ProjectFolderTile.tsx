import { Button, Text, VStack } from '@chakra-ui/react'
import { faFolder } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export interface ProjectFolderTileProps {
  name: string
  disabled?: boolean
  opening?: boolean
  onClick: () => void
}

export const ProjectFolderTile = ({
  name,
  disabled = false,
  opening = false,
  onClick,
}: ProjectFolderTileProps) => (
  <Button
    variant="ghost"
    h="auto"
    p={3}
    borderRadius="12px"
    color="white"
    disabled={disabled}
    title={name}
    onClick={onClick}
    _hover={{ bg: 'whiteAlpha.100' }}
    _active={{ bg: 'whiteAlpha.150' }}
  >
    <VStack gap={2} w="7rem">
      <Text fontSize="2.5rem" lineHeight={1} color="whiteAlpha.900" aria-hidden>
        <FontAwesomeIcon icon={faFolder} />
      </Text>
      <Text
        fontSize="sm"
        color="white"
        w="full"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        textAlign="center"
      >
        {opening ? 'Opening…' : name}
      </Text>
    </VStack>
  </Button>
)
