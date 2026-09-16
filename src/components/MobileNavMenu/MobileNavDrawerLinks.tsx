import { useAuth } from '../../hooks/authContext'
import { AuthStatus } from '../../types/auth'
import { NavItem } from '../AppNavbar/NavItem'
import { PRIMARY_NAV_PATH, primaryNavLabel } from '../AppNavbar/navItems'

export interface MobileNavDrawerLinksProps {
  onNavigate: () => void
}

export const MobileNavDrawerLinks = ({ onNavigate }: MobileNavDrawerLinksProps) => {
  const { authStatus } = useAuth()
  const label = primaryNavLabel(authStatus === AuthStatus.Authenticated)

  return <NavItem to={PRIMARY_NAV_PATH} label={label} onNavigate={onNavigate} />
}
