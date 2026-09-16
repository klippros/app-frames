import { Box, Drawer } from '@chakra-ui/react'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import type { SyncStatus } from '../../lib/sync/projectSync'
import { createToolbarIconButton } from '../AppHeader/toolbarButtons'
import { MobileNavDrawer } from './MobileNavDrawer'

export interface MobileNavMenuProps {
  syncStatus: SyncStatus
}

export const MobileNavMenu = ({ syncStatus }: MobileNavMenuProps) => {
  const [open, setOpen] = useState(false)

  const closeMenu = () => {
    setOpen(false)
  }

  return (
    <Box display={{ base: 'flex', md: 'none' }}>
      <Drawer.Root
        open={open}
        placement="end"
        onOpenChange={(details) => {
          setOpen(details.open)
        }}
      >
        <Drawer.Trigger asChild>
          {createToolbarIconButton('Open menu', <FontAwesomeIcon icon={faBars} />)}
        </Drawer.Trigger>
        <MobileNavDrawer syncStatus={syncStatus} onNavigate={closeMenu} />
      </Drawer.Root>
    </Box>
  )
}
