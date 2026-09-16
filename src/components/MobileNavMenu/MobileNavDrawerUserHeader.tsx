import { Button, Drawer, Flex } from '@chakra-ui/react'
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { toolbarControlSize } from '../../layout'

export interface MobileNavDrawerUserHeaderProps {
  displayName: string
  signingOut: boolean
  onSignOutClick: () => void
}

export const MobileNavDrawerUserHeader = ({
  displayName,
  signingOut,
  onSignOutClick,
}: MobileNavDrawerUserHeaderProps) => (
  <Drawer.Header px={4} py={3} borderBottomWidth="1px" borderColor="whiteAlpha.100">
    <Flex align="center" justify="space-between" gap={3} width="full">
      <Drawer.Title
        fontSize="sm"
        fontWeight="semibold"
        color="whiteAlpha.900"
        flex="1"
        minW={0}
        truncate
      >
        {displayName}
      </Drawer.Title>
      <Button
        aria-label="Sign out"
        variant="ghost"
        color="whiteAlpha.800"
        minW={toolbarControlSize}
        w={toolbarControlSize}
        h={toolbarControlSize}
        p={0}
        flexShrink={0}
        disabled={signingOut}
        _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
        onClick={onSignOutClick}
      >
        <FontAwesomeIcon icon={faRightFromBracket} />
      </Button>
    </Flex>
  </Drawer.Header>
)
