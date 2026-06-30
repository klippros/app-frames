import { Button, Dialog, Text } from '@chakra-ui/react'
import { darkDialogContentProps } from '../darkDialogContentProps'

export interface DeleteFrameDialogProps {
  open: boolean
  fileName: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export const DeleteFrameDialog = ({
  open,
  fileName,
  onOpenChange,
  onConfirm,
}: DeleteFrameDialogProps) => (
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
          <Dialog.Title color="white">Delete frame</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Text fontSize="sm" color="whiteAlpha.900" lineHeight="1.55">
            Remove &ldquo;{fileName}&rdquo; from your screenshots and discard its frame? This cannot
            be undone.
          </Text>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.ActionTrigger asChild>
            <Button variant="cancel">Cancel</Button>
          </Dialog.ActionTrigger>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm()
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
