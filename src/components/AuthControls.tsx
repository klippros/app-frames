import { Button, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useAuth } from '../hooks/authContext'
import type { SyncStatus } from '../lib/sync/projectSync'
import { AuthStatus } from '../types/auth'
import { SignInDialog } from './SignInDialog/SignInDialog'
import { UserAccountMenu } from './UserAccountMenu/UserAccountMenu'

export interface AuthControlsProps {
  syncStatus?: SyncStatus
}

export const AuthControls = ({ syncStatus }: AuthControlsProps) => {
  const { isConfigured, authStatus } = useAuth()
  const [signInOpen, setSignInOpen] = useState(false)

  if (!isConfigured) {
    return null
  }

  if (authStatus === AuthStatus.Loading) {
    return (
      <Text
        display={{ base: 'none', md: 'block' }}
        fontSize="sm"
        color="whiteAlpha.600"
        whiteSpace="nowrap"
      >
        …
      </Text>
    )
  }

  if (authStatus === AuthStatus.Authenticated) {
    return <UserAccountMenu syncStatus={syncStatus} />
  }

  return (
    <>
      <Button
        size="sm"
        variant="emphasis"
        flexShrink={0}
        display={{ base: 'none', md: 'inline-flex' }}
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
