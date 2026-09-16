import { Button, Flex, Heading, Spinner, Text, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { useAuth } from '../../hooks/authContext'
import type { ProjectRow } from '../../lib/supabase/schema'
import type { Screenshot } from '../../types'
import { AuthStatus } from '../../types/auth'
import { ScreenshotPicker } from '../ScreenshotPicker'
import { SignInDialog } from '../SignInDialog/SignInDialog'
import { WelcomeProjectGrid } from './WelcomeProjectGrid'

export interface WelcomeScreenProps {
  projects: ProjectRow[]
  projectsLoading?: boolean
  projectsError?: string | null
  openingProjectId?: string | null
  onSelectScreenshots: (screenshots: Screenshot[]) => void
  onOpenProject: (projectId: string) => void
  onCreateProject: (name: string, screenshots: Screenshot[]) => Promise<void> | void
  onScreenshotErrors?: (message: string) => void
  screenshotError?: string | null
}

export const WelcomeScreen = ({
  projects,
  projectsLoading = false,
  projectsError = null,
  openingProjectId = null,
  onSelectScreenshots,
  onOpenProject,
  onCreateProject,
  onScreenshotErrors,
  screenshotError = null,
}: WelcomeScreenProps) => {
  const { authStatus, isConfigured } = useAuth()
  const [signInOpen, setSignInOpen] = useState(false)

  if (!isConfigured || authStatus !== AuthStatus.Authenticated) {
    return (
      <Flex flex="1" align="center" justify="center" w="full" minH="50dvh">
        <VStack gap={6} align="center">
          {isConfigured && (
            <>
              <Heading as="h1" size="lg" color="white" textAlign="center">
                Frame your app screenshots
              </Heading>
              <Text color="whiteAlpha.700" textAlign="center" maxW="28rem">
                Start sketching and sign in anytime to save your project.
              </Text>
            </>
          )}
          <ScreenshotPicker onSelect={onSelectScreenshots} onErrors={onScreenshotErrors} />
          {screenshotError !== null && (
            <Text fontSize="sm" color="red.300" textAlign="center">
              {screenshotError}
            </Text>
          )}
          {isConfigured && authStatus === AuthStatus.Anonymous && (
            <Button
              variant="cancel"
              onClick={() => {
                setSignInOpen(true)
              }}
            >
              Sign in
            </Button>
          )}
          {isConfigured && <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />}
        </VStack>
      </Flex>
    )
  }

  return (
    <VStack gap={4} align="stretch" w="full" pt={4}>
      {projectsLoading && <Spinner color="white" alignSelf="center" />}
      {projectsError !== null && (
        <Text fontSize="sm" color="red.300">
          {projectsError}
        </Text>
      )}
      {screenshotError !== null && (
        <Text fontSize="sm" color="red.300">
          {screenshotError}
        </Text>
      )}
      {!projectsLoading && (
        <WelcomeProjectGrid
          projects={projects}
          openingProjectId={openingProjectId}
          onSelectScreenshots={onSelectScreenshots}
          onOpenProject={onOpenProject}
          onCreateProject={onCreateProject}
          onScreenshotErrors={onScreenshotErrors}
        />
      )}
    </VStack>
  )
}
