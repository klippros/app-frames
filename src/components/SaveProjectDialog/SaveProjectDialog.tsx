import { Button, Dialog, Input, Portal, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { MAX_PROJECT_NAME_LENGTH } from '../../lib/supabase/schema'
import { darkDialogContentProps } from '../darkDialogContentProps'

export interface SaveProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  confirmLabel?: string
  onConfirm: (name: string) => Promise<void> | void
}

export const SaveProjectDialog = ({
  open,
  onOpenChange,
  title = 'Save as project',
  description = 'Give this sketch a name to keep it in your account.',
  confirmLabel = 'Save project',
  onConfirm,
}: SaveProjectDialogProps) => {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: SyntheticEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length === 0) {
      setError('Enter a project name.')
      return
    }
    if (trimmed.length > MAX_PROJECT_NAME_LENGTH) {
      setError(`Name must be ${MAX_PROJECT_NAME_LENGTH} characters or fewer.`)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onConfirm(trimmed)
      setName('')
      onOpenChange(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save project.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
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
              <Dialog.Title color="white">{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack
                as="form"
                gap={4}
                onSubmit={(event) => {
                  void handleSubmit(event)
                }}
              >
                <Text fontSize="sm" color="whiteAlpha.800">
                  {description}
                </Text>
                <Input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                  }}
                  placeholder="My app screenshots"
                  aria-label="Project name"
                  maxLength={MAX_PROJECT_NAME_LENGTH}
                  bg="whiteAlpha.100"
                  borderColor="whiteAlpha.200"
                  color="white"
                  _placeholder={{ color: 'whiteAlpha.500' }}
                />
                {error !== null && (
                  <Text fontSize="sm" color="red.300">
                    {error}
                  </Text>
                )}
                <Button type="submit" variant="cta" disabled={submitting}>
                  {confirmLabel}
                </Button>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="cancel"
                onClick={() => {
                  onOpenChange(false)
                }}
              >
                Cancel
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
