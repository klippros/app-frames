import { Button, Dialog, Input, Portal, Stack, Text } from '@chakra-ui/react'
import { useRef, useState } from 'react'
import type { SyntheticEvent } from 'react'
import { MAX_PROJECT_NAME_LENGTH } from '../../lib/supabase/schema'
import type { Screenshot } from '../../types'
import { darkDialogContentProps } from '../darkDialogContentProps'
import { ScreenshotFileInput } from '../ScreenshotFileInput'
import type { ScreenshotFileInputHandle } from '../ScreenshotFileInput'

export interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (name: string, screenshots: Screenshot[]) => Promise<void> | void
}

export const CreateProjectDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: CreateProjectDialogProps) => {
  const [name, setName] = useState('')
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<ScreenshotFileInputHandle>(null)

  const reset = () => {
    setName('')
    setScreenshots([])
    setError(null)
    setSubmitting(false)
  }

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
    if (screenshots.length === 0) {
      setError('Select at least one screenshot.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onConfirm(trimmed, screenshots)
      reset()
      onOpenChange(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not create project.')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = name.trim().length > 0 && screenshots.length > 0 && !submitting

  return (
    <Dialog.Root
      open={open}
      placement="center"
      onOpenChange={(details) => {
        if (!details.open) {
          reset()
        }
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
              <Dialog.Title color="white">New project</Dialog.Title>
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
                  Name your project and select the screenshots to start with.
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
                <Stack gap={2}>
                  <ScreenshotFileInput
                    ref={inputRef}
                    onSelect={(next) => {
                      setScreenshots(next)
                      setError(null)
                    }}
                  />
                  <Button
                    type="button"
                    variant="cancel"
                    onClick={() => {
                      inputRef.current?.open()
                    }}
                  >
                    {screenshots.length > 0 ? 'Change screenshots' : 'Select screenshots'}
                  </Button>
                  {screenshots.length > 0 && (
                    <Text fontSize="sm" color="whiteAlpha.700">
                      {screenshots.length === 1
                        ? '1 screenshot selected'
                        : `${screenshots.length} screenshots selected`}
                    </Text>
                  )}
                </Stack>
                {error !== null && (
                  <Text fontSize="sm" color="red.300">
                    {error}
                  </Text>
                )}
                <Button type="submit" variant="cta" disabled={!canSubmit}>
                  Create project
                </Button>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="cancel"
                onClick={() => {
                  reset()
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
