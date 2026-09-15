import { HStack, Link } from '@chakra-ui/react'
import appFramesLogo from '../assets/app-frames-logo.svg'
import klipprosLogo from '../assets/klippros-logo.svg'
import { toolbarControlSize } from '../layout'

export const BrandLogos = () => (
  <HStack flex="1" gap={5} align="center" minW={0}>
    <Link
      href="https://klippros.com"
      target="_blank"
      rel="noopener noreferrer"
      display="flex"
      alignItems="center"
      flexShrink={0}
      h={toolbarControlSize}
      transition="transform 0.15s ease"
      _hover={{ transform: 'scale(1.08)' }}
      aria-label="Klippros"
    >
      <img
        src={klipprosLogo}
        alt=""
        style={{ height: toolbarControlSize, width: 'auto', display: 'block' }}
      />
    </Link>
    <img
      src={appFramesLogo}
      alt="App Frames"
      style={{ height: toolbarControlSize, width: 'auto', display: 'block' }}
    />
  </HStack>
)
