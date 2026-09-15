import { Button, Heading, Spinner, Stack, Text, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/authContext'
import { listProjects } from '../../lib/sync/projectSync'
import type { ProjectRow } from '../../lib/supabase/schema'
import { supabaseClient } from '../../lib/supabase/client'
import type { Screenshot } from '../../types'
import { AuthStatus } from '../../types/auth'
import { ScreenshotPicker } from '../ScreenshotPicker'
import { SignInDialog } from '../SignInDialog/SignInDialog'

export interface WelcomeScreenProps {
  onSelectScreenshots: (screenshots: Screenshot[]) => void
  onOpenProject: (projectId: string) => Promise<void>
  onCreateProject: () => void
}

export const WelcomeScreen = ({
  onSelectScreenshots,
  onOpenProject,
  onCreateProject,
}: WelcomeScreenProps) => {
  const { authStatus, isConfigured } = useAuth()
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [signInOpen, setSignInOpen] = useState(false)

  useEffect(() => {
    if (!isConfigured || authStatus !== AuthStatus.Authenticated || !supabaseClient) {
      setProjects([])
      return undefined
    }

    let cancelled = false

    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const rows = await listProjects(supabaseClient)
        if (!cancelled) {
          setProjects(rows)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load projects.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authStatus, isConfigured])

  if (!isConfigured || authStatus !== AuthStatus.Authenticated) {
    return (
      <VStack gap={6} align="center">
        <Heading as="h1" size="lg" color="white" textAlign="center">
          Frame your app screenshots
        </Heading>
        <Text color="whiteAlpha.700" textAlign="center" maxW="28rem">
          Start sketching in this browser tab. Sign in anytime to save named projects.
        </Text>
        <ScreenshotPicker onSelect={onSelectScreenshots} />
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
        <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
      </VStack>
    )
  }

  return (
    <VStack gap={6} align="stretch" w="full" maxW="32rem" mx="auto">
      <Heading as="h1" size="lg" color="white" textAlign="center">
        Welcome back
      </Heading>
      <Text color="whiteAlpha.700" textAlign="center">
        Open a saved project, create a new one, or start an unnamed sketch.
      </Text>

      <Stack gap={2}>
        <Button variant="cta" onClick={onCreateProject}>
          New project
        </Button>
        <ScreenshotPicker onSelect={onSelectScreenshots} />
      </Stack>

      <Stack gap={2}>
        <Text fontSize="sm" color="whiteAlpha.600">
          Your projects
        </Text>
        {loading && <Spinner color="white" alignSelf="center" />}
        {error !== null && (
          <Text fontSize="sm" color="red.300">
            {error}
          </Text>
        )}
        {!loading && error === null && projects.length === 0 && (
          <Text fontSize="sm" color="whiteAlpha.600">
            No saved projects yet.
          </Text>
        )}
        {projects.map((project) => (
          <Button
            key={project.id}
            variant="cancel"
            justifyContent="space-between"
            disabled={openingId !== null}
            title={project.name}
            onClick={() => {
              setOpeningId(project.id)
              void (async () => {
                try {
                  await onOpenProject(project.id)
                } finally {
                  setOpeningId(null)
                }
              })()
            }}
          >
            <Text as="span" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
              {project.name}
            </Text>
            {openingId === project.id ? 'Opening…' : 'Open'}
          </Button>
        ))}
      </Stack>
    </VStack>
  )
}
