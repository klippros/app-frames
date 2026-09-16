import { Box } from '@chakra-ui/react'

export interface PopoverDismissBackdropProps {
  onDismiss: () => void
}

/** Fullscreen click-catcher above page chrome; sits under the popover panel. */
export const PopoverDismissBackdrop = ({ onDismiss }: PopoverDismissBackdropProps) => (
  <Box
    position="fixed"
    inset={0}
    zIndex="overlay"
    onClick={(event) => {
      event.preventDefault()
      event.stopPropagation()
      onDismiss()
    }}
  />
)
