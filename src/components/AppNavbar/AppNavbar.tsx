import { HStack } from '@chakra-ui/react'
import { useAuth } from '../../hooks/authContext'
import { AuthStatus } from '../../types/auth'
import { NavItem } from './NavItem'
import { PRIMARY_NAV_PATH, primaryNavLabel } from './navItems'

export const AppNavbar = () => {
  const { authStatus } = useAuth()
  const isAuthenticated = authStatus === AuthStatus.Authenticated
  const label = primaryNavLabel(isAuthenticated)

  return (
    <HStack
      as="nav"
      gap={6}
      flexShrink={0}
      aria-label="Main"
      display={{ base: 'none', md: 'flex' }}
    >
      <NavItem to={PRIMARY_NAV_PATH} label={label} />
    </HStack>
  )
}
