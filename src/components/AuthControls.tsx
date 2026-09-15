import { Button, HStack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useAuth } from '../hooks/authContext'
import { SyncStatus } from '../lib/sync/projectSync'
import { AuthStatus } from '../types/auth'
import { SignInDialog } from './SignInDialog/SignInDialog'
import { SignOutConfirmDialog } from './SignOutConfirmDialog/SignOutConfirmDialog'

export interface AuthControlsProps {
  syncStatus?: SyncStatus
}

export const AuthControls = ({ syncStatus = SyncStatus.Idle }: AuthControlsProps) => {
  const { isConfigured, authStatus, profile, signOut } = useAuth()
  const [signInOpen, setSignInOpen] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  if (!isConfigured) {
    return null
  }

  if (authStatus === AuthStatus.Loading) {
    return (
      <Text fontSize="sm" color="whiteAlpha.600" whiteSpace="nowrap">
        …
      </Text>
    )
  }

  if (authStatus === AuthStatus.Authenticated) {
    return (
      <>
        <HStack gap={2} flexShrink={0}>
          <Text
            fontSize="sm"
            color="whiteAlpha.800"
            maxW="10rem"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            title={profile?.displayName}
          >
            {profile?.displayName ?? 'Signed in'}
          </Text>
          <Button
            size="sm"
            variant="cancel"
            disabled={signingOut}
            onClick={() => {
              setSignOutOpen(true)
            }}
          >
            Sign out
          </Button>
        </HStack>
        <SignOutConfirmDialog
          open={signOutOpen}
          onOpenChange={setSignOutOpen}
          hasUnsyncedChanges={
            syncStatus === SyncStatus.Syncing ||
            syncStatus === SyncStatus.Error ||
            syncStatus === SyncStatus.Conflict
          }
          onConfirm={() => {
            setSigningOut(true)
            void (async () => {
              try {
                await signOut()
              } finally {
                setSigningOut(false)
              }
            })()
          }}
        />
      </>
    )
  }

  return (
    <>
      <Button
        size="sm"
        variant="emphasis"
        flexShrink={0}
        onClick={() => {
          setSignInOpen(true)
        }}
      >
        Sign in
      </Button>
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </>
  )
}
