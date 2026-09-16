import { Button, Flex, Heading, Spinner, Text, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/authContext'
import { listProjects } from '../../lib/sync/projectSync'
import type { ProjectRow } from '../../lib/supabase/schema'
import { supabaseClient } from '../../lib/supabase/client'
import type { Screenshot } from '../../types'
import { AuthStatus } from '../../types/auth'
import { CreateProjectDialog } from '../CreateProjectDialog/CreateProjectDialog'
import { ScreenshotPicker } from '../ScreenshotPicker'
import { SignInDialog } from '../SignInDialog/SignInDialog'
import { NewProjectFolderButton } from './NewProjectFolderButton'
import { NewSketchButton } from './NewSketchButton'
import { ProjectFolderTile } from './ProjectFolderTile'

export interface WelcomeScreenProps {
  projectsListKey?: number
  onSelectScreenshots: (screenshots: Screenshot[]) => void
  onOpenProject: (projectId: string) => void
  onCreateProject: (name: string, screenshots: Screenshot[]) => Promise<void> | void
}

export const WelcomeScreen = ({
  projectsListKey = 0,
  onSelectScreenshots,
  onOpenProject,
  onCreateProject,
}: WelcomeScreenProps) => {
  const { authStatus, isConfigured } = useAuth()
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signInOpen, setSignInOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

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
  }, [authStatus, isConfigured, projectsListKey])

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
          {isConfigured && <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />}
        </VStack>
      </Flex>
    )
  }

  return (
    <VStack gap={4} align="stretch" w="full" pt={4}>
      {loading && <Spinner color="white" alignSelf="center" />}
      {error !== null && (
        <Text fontSize="sm" color="red.300">
          {error}
        </Text>
      )}
      {!loading && (
        <Flex wrap="wrap" gap={2} justify="flex-start">
          {projects.map((project) => (
            <ProjectFolderTile
              key={project.id}
              name={project.name}
              onClick={() => {
                onOpenProject(project.id)
              }}
            />
          ))}
          <NewProjectFolderButton
            onClick={() => {
              setCreateOpen(true)
            }}
          />
          <NewSketchButton onSelect={onSelectScreenshots} />
        </Flex>
      )}

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onConfirm={onCreateProject}
      />
    </VStack>
  )
}
