import { Button, Dialog, Input, Portal, Stack, Text } from '@chakra-ui/react'
import { useRef, useState } from 'react'
import type { SyntheticEvent } from 'react'
import { MAX_PROJECT_NAME_LENGTH, MAX_PROJECTS_PER_USER } from '../../lib/supabase/schema'
import { PROJECT_LIMIT_MESSAGE } from '../../lib/sync/projectGateway'
import type { Screenshot } from '../../types'
import { darkDialogContentProps } from '../darkDialogContentProps'
import { ScreenshotFileInput } from '../ScreenshotFileInput'
import type { ScreenshotFileInputHandle } from '../ScreenshotFileInput'

export interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (name: string, screenshots: Screenshot[]) => Promise<void> | void
  atProjectLimit?: boolean
}

export const CreateProjectDialog = ({
  open,
  onOpenChange,
  onConfirm,
  atProjectLimit = false,
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
    if (atProjectLimit) {
      setError(PROJECT_LIMIT_MESSAGE)
      return
    }
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
      await onConfirm(trimmed, screenshots)
      reset()
      onOpenChange(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not create project.')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = !atProjectLimit && name.trim().length > 0 && !submitting

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
                {atProjectLimit ? (
                  <Text fontSize="sm" color="red.300">
                    You already have {MAX_PROJECTS_PER_USER} projects. Delete one to create another.
                  </Text>
                ) : (
                  <Text fontSize="sm" color="whiteAlpha.800">
                    Name your project. You can add screenshots now or later.
                  </Text>
                )}
                <Input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                  }}
                  placeholder="My app screenshots"
                  aria-label="Project name"
                  maxLength={MAX_PROJECT_NAME_LENGTH}
                  disabled={atProjectLimit}
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
                    onErrors={(errors) => {
                      if (errors.length > 0) {
                        setError(errors[0]?.message ?? 'Could not process screenshots.')
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="cancel"
                    disabled={atProjectLimit}
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
