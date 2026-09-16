import { Box, HStack, Text, Tooltip, VStack } from '@chakra-ui/react'
import { faCloud, faCloudArrowUp, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { SyncStatus } from '../lib/sync/projectSync'

export interface ProjectHeaderMetaProps {
  projectName: string | null
  syncStatus: SyncStatus
  syncMessage?: string
}

interface SyncPresentation {
  icon: IconDefinition
  label: string
  detail: string
  color: string
}

const syncPresentation = (status: SyncStatus, message?: string): SyncPresentation | null => {
  if (status === SyncStatus.Syncing) {
    return {
      icon: faCloudArrowUp,
      label: 'Saving…',
      detail: 'Uploading your latest changes to the cloud.',
      color: 'whiteAlpha.800',
    }
  }
  if (status === SyncStatus.Synced) {
    return {
      icon: faCloud,
      label: 'Saved',
      detail: 'All changes are saved to your project.',
      color: 'whiteAlpha.700',
    }
  }
  if (status === SyncStatus.Error) {
    return {
      icon: faExclamationTriangle,
      label: 'Save failed',
      detail: message ?? 'Something went wrong while saving. Try again when you are back online.',
      color: 'red.300',
    }
  }
  if (status === SyncStatus.Conflict) {
    return {
      icon: faExclamationTriangle,
      label: 'Conflict',
      detail: message ?? 'This project changed elsewhere. Refresh to load the latest version.',
      color: 'orange.200',
    }
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

  const presentation = syncPresentation(syncStatus, syncMessage)

  return (
    <HStack gap={2} align="center" minW={0}>
      <Text
        fontSize="sm"
        fontWeight="semibold"
        color="white"
        maxW={{ base: '6rem', md: '12rem' }}
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        title={projectName}
      >
        {projectName}
      </Text>
      {presentation !== null && (
        <Tooltip.Root openDelay={200} closeDelay={100}>
          <Tooltip.Trigger asChild>
            <Box
              as="span"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
              color={presentation.color}
              cursor="default"
              aria-label={presentation.label}
            >
              <FontAwesomeIcon icon={presentation.icon} />
            </Box>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content maxW="16rem">
              <VStack gap={1} align="flex-start">
                <Text fontSize="sm" fontWeight="semibold" lineHeight="short">
                  {presentation.label}
                </Text>
                <Text fontSize="xs" color="fg.muted" lineHeight="short">
                  {presentation.detail}
                </Text>
              </VStack>
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      )}
    </HStack>
  )
}
