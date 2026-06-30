import { Flex } from '@chakra-ui/react'
import { faArrowRightArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ToolbarIconButton } from '../ToolbarIconButton'

export interface ScreenshotSwapControlsProps {
  onSwap: () => void
}

export const ScreenshotSwapControls = ({ onSwap }: ScreenshotSwapControlsProps) => (
  <Flex align="center" alignSelf="center" flexShrink={0} px={2}>
    <ToolbarIconButton aria-label="Swap screenshots" onClick={onSwap}>
      <FontAwesomeIcon icon={faArrowRightArrowLeft} />
    </ToolbarIconButton>
  </Flex>
)
