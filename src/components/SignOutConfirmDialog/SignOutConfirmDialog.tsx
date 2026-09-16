import { Button, Dialog, Portal, Stack, Text } from '@chakra-ui/react'
import { darkDialogContentProps } from '../darkDialogContentProps'

export interface SignOutConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  hasUnsyncedChanges?: boolean
}

export const SignOutConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  hasUnsyncedChanges = false,
}: SignOutConfirmDialogProps) => (
  <Dialog.Root
    open={open}
    placement="center"
    onOpenChange={(details) => {
      onOpenChange(details.open)
    }}
  >
    <Portal>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          bg={darkDialogContentProps.bg}
          borderWidth={darkDialogContentProps.borderWidth}
          borderColor={darkDialogContentProps.borderColor}
          color={darkDialogContentProps.color}
          shadow={darkDialogContentProps.shadow}
          maxW="28rem"
        >
          <Dialog.Header>
            <Dialog.Title color="white">Sign out?</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <Stack gap={3}>
              <Text fontSize="sm" color="whiteAlpha.800">
                Signing out clears this browser’s cached project data for your account. Unnamed
                sketches in this tab are discarded.
              </Text>
              {hasUnsyncedChanges && (
                <Text fontSize="sm" color="orange.200">
                  Some changes may not have finished uploading. We will try a final save, then clear
                  local data either way.
                </Text>
              )}
            </Stack>
          </Dialog.Body>
          <Dialog.Footer>
            <Button
              variant="cancel"
              onClick={() => {
                onOpenChange(false)
              }}
            >
              Stay signed in
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
            >
              Sign out
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
)
