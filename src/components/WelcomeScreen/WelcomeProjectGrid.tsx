import { Flex } from '@chakra-ui/react'
import { useState } from 'react'
import type { ProjectRow } from '../../lib/supabase/schema'
import { MAX_PROJECTS_PER_USER } from '../../lib/supabase/schema'
import type { Screenshot } from '../../types'
import { CreateProjectDialog } from '../CreateProjectDialog/CreateProjectDialog'
import { NewProjectFolderButton } from './NewProjectFolderButton'
import { NewSketchButton } from './NewSketchButton'
import { ProjectFolderTile } from './ProjectFolderTile'

export interface WelcomeProjectGridProps {
  projects: ProjectRow[]
  onSelectScreenshots: (screenshots: Screenshot[]) => void
  onOpenProject: (projectId: string) => void
  onCreateProject: (name: string, screenshots: Screenshot[]) => Promise<void> | void
  onScreenshotErrors?: (message: string) => void
}

export const WelcomeProjectGrid = ({
  projects,
  onSelectScreenshots,
  onOpenProject,
  onCreateProject,
  onScreenshotErrors,
}: WelcomeProjectGridProps) => {
  const [createOpen, setCreateOpen] = useState(false)
  const atProjectLimit = projects.length >= MAX_PROJECTS_PER_USER

  return (
    <>
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
        {!atProjectLimit && (
          <NewProjectFolderButton
            onClick={() => {
              setCreateOpen(true)
            }}
          />
        )}
        <NewSketchButton onSelect={onSelectScreenshots} onErrors={onScreenshotErrors} />
      </Flex>

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onConfirm={onCreateProject}
        atProjectLimit={atProjectLimit}
      />
    </>
  )
}
