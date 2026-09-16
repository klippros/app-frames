import { Drawer, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { useAuth } from '../../hooks/authContext'
import type { SyncStatus } from '../../lib/sync/projectSync'
import { MobileNavDrawerAuthActions } from './MobileNavDrawerAuthActions'
import { MobileNavDrawerLinks } from './MobileNavDrawerLinks'
import { MobileNavDrawerUserHeader } from './MobileNavDrawerUserHeader'

export interface MobileNavDrawerBodyProps {
  syncStatus: SyncStatus
  onNavigate: () => void
}

export const MobileNavDrawerBody = ({ syncStatus, onNavigate }: MobileNavDrawerBodyProps) => {
  const { user, profile } = useAuth()
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const playerName = user === null ? null : (profile?.displayName ?? user.email ?? 'Signed in')

  return (
    <>
      {playerName !== null && (
        <MobileNavDrawerUserHeader
          displayName={playerName}
          signingOut={signingOut}
          onSignOutClick={() => {
            setSignOutDialogOpen(true)
          }}
        />
      )}
      <Drawer.Body px={4} py={4}>
        <VStack as="nav" align="stretch" gap={4} aria-label="Main">
          <MobileNavDrawerLinks onNavigate={onNavigate} />
          <MobileNavDrawerAuthActions
            syncStatus={syncStatus}
            signOutDialogOpen={signOutDialogOpen}
            onSignOutDialogOpenChange={setSignOutDialogOpen}
            onSigningOutChange={setSigningOut}
            onNavigate={onNavigate}
          />
        </VStack>
      </Drawer.Body>
    </>
  )
}
