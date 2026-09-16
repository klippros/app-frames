import { Button } from '@chakra-ui/react'
import { useState } from 'react'
import { useAuth } from '../../hooks/authContext'
import type { SyncStatus } from '../../lib/sync/projectSync'
import { SyncStatus as SyncStatusEnum } from '../../lib/sync/projectSync'
import { AuthStatus } from '../../types/auth'
import { SignInDialog } from '../SignInDialog/SignInDialog'
import { SignOutConfirmDialog } from '../SignOutConfirmDialog/SignOutConfirmDialog'

export interface MobileNavDrawerAuthActionsProps {
  syncStatus: SyncStatus
  signOutDialogOpen: boolean
  onSignOutDialogOpenChange: (open: boolean) => void
  onSigningOutChange: (signingOut: boolean) => void
  onNavigate: () => void
}

export const MobileNavDrawerAuthActions = ({
  syncStatus,
  signOutDialogOpen,
  onSignOutDialogOpenChange,
  onSigningOutChange,
  onNavigate,
}: MobileNavDrawerAuthActionsProps) => {
  const { isConfigured, authStatus, signOut } = useAuth()
  const [signInDialogOpen, setSignInDialogOpen] = useState(false)

  return (
    <>
      {isConfigured && authStatus === AuthStatus.Anonymous && (
        <Button
          variant="cta"
          onClick={() => {
            setSignInDialogOpen(true)
          }}
        >
          Sign in
        </Button>
      )}
      <SignInDialog open={signInDialogOpen} onOpenChange={setSignInDialogOpen} />
      <SignOutConfirmDialog
        open={signOutDialogOpen}
        onOpenChange={onSignOutDialogOpenChange}
        hasUnsyncedChanges={
          syncStatus === SyncStatusEnum.Syncing ||
          syncStatus === SyncStatusEnum.Error ||
          syncStatus === SyncStatusEnum.Conflict
        }
        onConfirm={() => {
          onSignOutDialogOpenChange(false)
          onNavigate()
          onSigningOutChange(true)
          void (async () => {
            try {
              await signOut()
            } finally {
              onSigningOutChange(false)
            }
          })()
        }}
      />
    </>
  )
}
