import { Box, Button, Heading, Spinner, Stack, Text } from '@chakra-ui/react'
import { useEffect } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/authContext'
import { AUTH_BROADCAST_CHANNEL, consumeAuthReturnTo } from '../lib/auth/authRedirect'
import { AuthStatus } from '../types/auth'
import { ContentContainer } from './ContentContainer'

export const AuthCallbackPage = () => {
  const navigate = useNavigate()
  const { authStatus } = useAuth()

  useEffect(() => {
    if (authStatus !== AuthStatus.Authenticated) {
      return
    }

    const returnTo = consumeAuthReturnTo()

    const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL)
    channel.postMessage({ type: 'signed-in' })
    channel.close()

    if (window.opener instanceof Window && !window.opener.closed) {
      window.close()
      return
    }

    void navigate(returnTo, { replace: true })
  }, [authStatus, navigate])

  return (
    <ContentContainer>
      <Box py={{ base: 10, md: 16 }} maxW="520px" w="full" mx="auto">
        <Stack align="center" gap={4} textAlign="center">
          {authStatus === AuthStatus.Loading && <Spinner color="white" />}
          <Heading as="h1" size="lg" color="white">
            {authStatus === AuthStatus.Anonymous ? 'Sign-in link unavailable' : 'Finishing sign-in'}
          </Heading>
          <Text color="whiteAlpha.700">
            {authStatus === AuthStatus.Anonymous
              ? 'The link may have expired. Return home and request a new one.'
              : 'You can close this window and continue in your original App Frames tab.'}
          </Text>
          {authStatus === AuthStatus.Anonymous && (
            <Button asChild variant="cta">
              <RouterLink to="/">Return home</RouterLink>
            </Button>
          )}
        </Stack>
      </Box>
    </ContentContainer>
  )
}
