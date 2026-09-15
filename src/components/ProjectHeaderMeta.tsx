import { Text } from '@chakra-ui/react'
import { SyncStatus } from '../lib/sync/projectSync'

export interface ProjectHeaderMetaProps {
  projectName: string | null
  syncStatus: SyncStatus
  syncMessage?: string
}

const syncLabel = (status: SyncStatus, message?: string): string | null => {
  if (status === SyncStatus.Syncing) {
    return 'Saving…'
  }
  if (status === SyncStatus.Synced) {
    return 'Saved'
  }
  if (status === SyncStatus.Error) {
    return message ?? 'Save failed'
  }
  if (status === SyncStatus.Conflict) {
    return 'Conflict — refresh project'
  }
  return null
}

export const ProjectHeaderMeta = ({
  projectName,
  syncStatus,
  syncMessage,
}: ProjectHeaderMetaProps) => {
  if (projectName === null) {
    return null
  }

  const statusText = syncLabel(syncStatus, syncMessage)

  return (
    <>
      <Text
        fontSize="sm"
        fontWeight="semibold"
        color="white"
        maxW={{ base: '6rem', md: '12rem' }}
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        title={projectName}
        aria-label={`Project ${projectName}`}
      >
        {projectName}
      </Text>
      {statusText !== null && (
        <Text fontSize="xs" color="whiteAlpha.600" whiteSpace="nowrap">
          {statusText}
        </Text>
      )}
    </>
  )
}
