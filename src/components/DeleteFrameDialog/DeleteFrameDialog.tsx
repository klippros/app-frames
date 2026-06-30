import { Button, Dialog, Text } from '@chakra-ui/react'

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
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Delete frame</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Text>
            Remove &ldquo;{fileName}&rdquo; from your screenshots and discard its frame? This cannot
            be undone.
          </Text>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.ActionTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </Dialog.ActionTrigger>
          <Button
            colorPalette="red"
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
