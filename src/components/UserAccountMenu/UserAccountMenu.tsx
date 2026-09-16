import { Button, Popover, Portal, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useAuth } from '../../hooks/authContext'
import type { SyncStatus } from '../../lib/sync/projectSync'
import { SyncStatus as SyncStatusEnum } from '../../lib/sync/projectSync'
import { darkDialogContentProps } from '../darkDialogContentProps'
import { PopoverDismissBackdrop } from '../PopoverDismissBackdrop'
import { SignOutConfirmDialog } from '../SignOutConfirmDialog/SignOutConfirmDialog'

export interface UserAccountMenuProps {
  syncStatus?: SyncStatus
}

const syncStatusLabel = (status: SyncStatus): string | null => {
  if (status === SyncStatusEnum.Syncing) {
    return 'Saving changes…'
  }
  if (status === SyncStatusEnum.Synced) {
    return 'All changes saved'
  }
  if (status === SyncStatusEnum.Error) {
    return 'Save failed — check connection'
  }
  if (status === SyncStatusEnum.Conflict) {
    return 'Sync conflict — refresh project'
  }
  return null
}

export const UserAccountMenu = ({ syncStatus = SyncStatusEnum.Idle }: UserAccountMenuProps) => {
  const { user, profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  if (user === null) {
    return null
  }

  const { email } = user
  const displayName = profile?.displayName ?? email ?? 'Signed in'
  const statusLine = syncStatusLabel(syncStatus)

  const handleSignOutConfirm = () => {
    setSignOutDialogOpen(false)
    setOpen(false)
    setSigningOut(true)
    void (async () => {
      try {
        await signOut()
      } finally {
        setSigningOut(false)
      }
    })()
  }

  return (
    <>
      <Popover.Root
        open={open}
        positioning={{ placement: 'bottom-end' }}
        onOpenChange={(details) => {
          setOpen(details.open)
        }}
      >
        <Popover.Trigger asChild>
          <Button
            size="sm"
            variant="ghost"
            color="whiteAlpha.700"
            fontWeight={400}
            maxW="10rem"
            truncate
            disabled={signingOut}
            _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
            _expanded={{ color: 'white', bg: 'whiteAlpha.100' }}
          >
            {displayName}
          </Button>
        </Popover.Trigger>
        <Portal>
          {open && (
            <PopoverDismissBackdrop
              onDismiss={() => {
                setOpen(false)
              }}
            />
          )}
          <Popover.Positioner css={{ '--z-index': 'zIndex.popover' }}>
            <Popover.Content
              bg={darkDialogContentProps.bg}
              borderWidth={darkDialogContentProps.borderWidth}
              borderColor={darkDialogContentProps.borderColor}
              color={darkDialogContentProps.color}
              borderRadius="xl"
              shadow="2xl"
              minW="280px"
              overflow="hidden"
              p={0}
              _focusVisible={{ outline: 'none' }}
            >
              <Popover.Header px={4} py={3} borderBottomWidth="1px" borderColor="whiteAlpha.100">
                <Popover.Title fontSize="sm" fontWeight="semibold" color="whiteAlpha.900">
                  Account
                </Popover.Title>
              </Popover.Header>
              <Popover.Body px={4} py={4}>
                <Stack gap={4}>
                  <Stack gap={1}>
                    <Text fontWeight="semibold" color="white">
                      {displayName}
                    </Text>
                    {email !== undefined && email !== '' && (
                      <Text fontSize="sm" color="whiteAlpha.700">
                        {email}
                      </Text>
                    )}
                    {statusLine !== null && (
                      <Text fontSize="sm" color="whiteAlpha.700">
                        {statusLine}
                      </Text>
                    )}
                  </Stack>
                  <Button
                    variant="cancel"
                    w="full"
                    disabled={signingOut}
                    onClick={() => {
                      setSignOutDialogOpen(true)
                    }}
                  >
                    Sign out
                  </Button>
                </Stack>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
      <SignOutConfirmDialog
        open={signOutDialogOpen}
        onOpenChange={setSignOutDialogOpen}
        hasUnsyncedChanges={
          syncStatus === SyncStatusEnum.Syncing ||
          syncStatus === SyncStatusEnum.Error ||
          syncStatus === SyncStatusEnum.Conflict
        }
        onConfirm={handleSignOutConfirm}
      />
    </>
  )
}
