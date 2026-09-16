import { Drawer, Portal } from '@chakra-ui/react'
import type { SyncStatus } from '../../lib/sync/projectSync'
import { darkDialogContentProps } from '../darkDialogContentProps'
import { MobileNavDrawerBody } from './MobileNavDrawerBody'

export interface MobileNavDrawerProps {
  syncStatus: SyncStatus
  onNavigate: () => void
}

export const MobileNavDrawer = ({ syncStatus, onNavigate }: MobileNavDrawerProps) => (
  <Portal>
    <Drawer.Backdrop />
    <Drawer.Positioner>
      <Drawer.Content
        bg={darkDialogContentProps.bg}
        borderWidth={darkDialogContentProps.borderWidth}
        borderColor={darkDialogContentProps.borderColor}
        color={darkDialogContentProps.color}
        shadow={darkDialogContentProps.shadow}
        maxW="280px"
        aria-label="Menu"
      >
        <MobileNavDrawerBody syncStatus={syncStatus} onNavigate={onNavigate} />
      </Drawer.Content>
    </Drawer.Positioner>
  </Portal>
)
