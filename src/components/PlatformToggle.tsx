import { faAndroid, faApple } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { Platform } from '../types'
import { ToolbarIconButton } from './ToolbarIconButton'

export interface PlatformToggleProps {
  disabled?: boolean
  platform: Platform
  onChange: (platform: Platform) => void
}

export const PlatformToggle = ({ disabled = false, platform, onChange }: PlatformToggleProps) => (
  <>
    <ToolbarIconButton
      aria-label="Show iOS previews"
      aria-pressed={platform === 'ios'}
      disabled={disabled}
      onClick={() => {
        onChange('ios')
      }}
    >
      <FontAwesomeIcon icon={faApple} />
    </ToolbarIconButton>
    <ToolbarIconButton
      aria-label="Show Android previews"
      aria-pressed={platform === 'android'}
      disabled={disabled}
      onClick={() => {
        onChange('android')
      }}
    >
      <FontAwesomeIcon icon={faAndroid} />
    </ToolbarIconButton>
  </>
)
