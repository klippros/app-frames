import { Button, Dialog, Portal, Stack, Text } from '@chakra-ui/react'
import { MAX_PROJECTS_PER_USER } from '../../lib/supabase/schema'
import { darkDialogContentProps } from '../darkDialogContentProps'

export interface PostExportSaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'save' | 'sign-in-and-save' | 'at-limit'
  onSave: () => void
  onSignInAndSave: () => void
}

export const PostExportSaveDialog = ({
  open,
  onOpenChange,
  mode,
  onSave,
  onSignInAndSave,
}: PostExportSaveDialogProps) => (
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
            <Dialog.Title color="white">Export complete</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <Stack gap={4}>
              {mode === 'at-limit' ? (
                <Text fontSize="sm" color="whiteAlpha.800">
                  Your assets downloaded successfully. You already have {MAX_PROJECTS_PER_USER}{' '}
                  projects — delete one from the home screen if you want to save this sketch.
                </Text>
              ) : (
                <>
                  <Text fontSize="sm" color="whiteAlpha.800">
                    Your assets downloaded successfully. Save this sketch as a project if you want
                    to reopen it later.
                  </Text>
                  {mode === 'save' ? (
                    <Button
                      variant="cta"
                      onClick={() => {
                        onSave()
                      }}
                    >
                      Save as project
                    </Button>
                  ) : (
                    <Button
                      variant="cta"
                      onClick={() => {
                        onSignInAndSave()
                      }}
                    >
                      Sign in and save
                    </Button>
                  )}
                </>
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
              {mode === 'at-limit' ? 'Done' : 'Keep sketch only'}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
)
