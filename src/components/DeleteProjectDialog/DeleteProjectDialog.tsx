import { Button, Dialog, Text } from '@chakra-ui/react'
import { darkDialogContentProps } from '../darkDialogContentProps'

export interface DeleteProjectDialogProps {
  open: boolean
  projectName: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
}

export const DeleteProjectDialog = ({
  open,
  projectName,
  onOpenChange,
  onConfirm,
}: DeleteProjectDialogProps) => (
  <Dialog.Root
    open={open}
    placement="center"
    onOpenChange={(details) => {
      onOpenChange(details.open)
    }}
  >
    <Dialog.Backdrop />
    <Dialog.Positioner>
      <Dialog.Content
        bg={darkDialogContentProps.bg}
        borderWidth={darkDialogContentProps.borderWidth}
        borderColor={darkDialogContentProps.borderColor}
        color={darkDialogContentProps.color}
        shadow={darkDialogContentProps.shadow}
      >
        <Dialog.Header>
          <Dialog.Title color="white">Delete project</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Text fontSize="sm" color="whiteAlpha.900" lineHeight="1.55">
            Permanently delete &ldquo;{projectName}&rdquo; and all of its frames and images? This
            cannot be undone.
          </Text>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.ActionTrigger asChild>
            <Button variant="cancel">Cancel</Button>
          </Dialog.ActionTrigger>
          <Button
            variant="destructive"
            onClick={() => {
              void onConfirm()
              onOpenChange(false)
            }}
          >
            Delete
          </Button>
        </Dialog.Footer>
        <Dialog.CloseTrigger />
      </Dialog.Content>
    </Dialog.Positioner>
  </Dialog.Root>
)
