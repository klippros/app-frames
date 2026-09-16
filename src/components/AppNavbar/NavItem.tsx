import { Link, Text } from '@chakra-ui/react'
import { NavLink } from 'react-router-dom'
import { PRIMARY_NAV_PATH } from './navItems'

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
  fontWeight: isActive ? 600 : 400,
  fontSize: '1.125rem',
  textDecoration: 'none',
  transition: 'color 0.15s ease',
})

export interface NavItemProps {
  to: string
  label: string
  onNavigate?: () => void
}

export const NavItem = ({ to, label, onNavigate }: NavItemProps) => (
  <Link asChild>
    <NavLink
      to={to}
      end={to === PRIMARY_NAV_PATH}
      style={navLinkStyle}
      onClick={() => {
        onNavigate?.()
      }}
    >
      <Text as="span">{label}</Text>
    </NavLink>
  </Link>
)
