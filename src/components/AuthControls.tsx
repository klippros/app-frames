import { Button, HStack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useAuth } from '../hooks/authContext'
import { AuthStatus } from '../types/auth'
import { SignInDialog } from './SignInDialog/SignInDialog'

export const AuthControls = () => {
  const { isConfigured, authStatus, profile, signOut } = useAuth()
  const [signInOpen, setSignInOpen] = useState(false)
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
            setSigningOut(true)
            void signOut().finally(() => {
              setSigningOut(false)
            })
          }}
        >
          Sign out
        </Button>
      </HStack>
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
