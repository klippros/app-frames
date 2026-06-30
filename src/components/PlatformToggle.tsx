import { IconButton } from '@chakra-ui/react'
import { faAndroid, faApple } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { Platform } from '../types'

export interface PlatformToggleProps {
  platform: Platform
  onChange: (platform: Platform) => void
}

export const PlatformToggle = ({ platform, onChange }: PlatformToggleProps) => (
  <>
    <IconButton
      aria-label="Show iOS previews"
      aria-pressed={platform === 'ios'}
      variant={platform === 'ios' ? 'solid' : 'outline'}
      onClick={() => onChange('ios')}
    >
      <FontAwesomeIcon icon={faApple} />
    </IconButton>
    <IconButton
      aria-label="Show Android previews"
      aria-pressed={platform === 'android'}
      variant={platform === 'android' ? 'solid' : 'outline'}
      onClick={() => onChange('android')}
    >
      <FontAwesomeIcon icon={faAndroid} />
    </IconButton>
  </>
)
