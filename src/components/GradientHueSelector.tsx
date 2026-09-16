import { Box, Button, Flex, Input } from '@chakra-ui/react'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { toolbarControlSize } from '../layout'
import {
  baseColorFromHexInput,
  colorWithHue,
  getDefaultGradientHue,
  hueFromHex,
} from '../utils/colorHue'

export interface GradientHueSelectorProps {
  baseColor: string
  disabled?: boolean
  onChange: (baseColor: string) => void
}

type HueSliderStyle = CSSProperties & {
  '--thumb-color': string
  '--track-gradient': string
}

const HUE_GRADIENT =
  'linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(359 100% 50%))'

const ANGULAR_HUE_GRADIENT =
  'conic-gradient(from 0deg, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))'

export const GradientHueSelector = ({
  baseColor,
  disabled = false,
  onChange,
}: GradientHueSelectorProps) => {
  const [hue, setHue] = useState(() => hueFromHex(baseColor) ?? getDefaultGradientHue())
  const [hexInput, setHexInput] = useState(baseColor)
  const [mobileOpen, setMobileOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHexInput(baseColor)
  }, [baseColor])

  useEffect(() => {
    if (!mobileOpen) {
      return undefined
    }

    const handlePointerDown = (event: PointerEvent) => {
      const root = rootRef.current
      if (root !== null && event.target instanceof Node && !root.contains(event.target)) {
        setMobileOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [mobileOpen])

  const handleHueChange = (nextHue: number) => {
    setHue(nextHue)
    onChange(colorWithHue(nextHue))
  }

  const hueSliderStyle: HueSliderStyle = {
    width: '100%',
    height: '18px',
    margin: 0,
    padding: 0,
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    background: 'transparent',
    '--thumb-color': baseColor,
    '--track-gradient': HUE_GRADIENT,
  }

  const commitHexInput = (value: string) => {
    const nextColor = baseColorFromHexInput(value)
    if (nextColor !== null) {
      const nextHue = hueFromHex(value)
      if (nextHue !== null) {
        setHue(nextHue)
      }
      onChange(nextColor)
      return
    }
    setHexInput(baseColor)
  }

  return (
    <Box ref={rootRef} position="relative" flexShrink={0}>
      <Button
        aria-expanded={mobileOpen}
        aria-label="Open gradient hue picker"
        display={{ base: 'flex', md: 'none' }}
        size="sm"
        variant="ghost"
        w={toolbarControlSize}
        h={toolbarControlSize}
        minW={toolbarControlSize}
        minH={toolbarControlSize}
        maxW={toolbarControlSize}
        maxH={toolbarControlSize}
        p={0}
        borderRadius="full"
        borderWidth="1px"
        borderColor="blue.300"
        bg="transparent"
        flexShrink={0}
        disabled={disabled}
        opacity={disabled ? 0.45 : undefined}
        cursor={disabled ? 'not-allowed' : undefined}
        transform="scale(1)"
        transformOrigin="center"
        transitionProperty="transform"
        transitionDuration="0.15s"
        transitionTimingFunction="ease-out"
        style={{ background: ANGULAR_HUE_GRADIENT }}
        _hover={{ transform: 'scale(1.06)' }}
        _active={{ transform: 'scale(0.98)' }}
        onClick={() => {
          setMobileOpen((open) => !open)
        }}
      />
      <Flex
        align="center"
        aria-disabled={disabled}
        bg={{ base: 'blackAlpha.800', md: 'transparent' }}
        borderColor="blue.300"
        borderRadius="full"
        borderWidth="1px"
        cursor={disabled ? 'not-allowed' : undefined}
        display={{ base: mobileOpen ? 'flex' : 'none', md: 'flex' }}
        gap={3}
        h={toolbarControlSize}
        left={{ base: '50%', md: 'auto' }}
        maxW="320px"
        mt={{ base: 2, md: 0 }}
        opacity={disabled ? 0.45 : undefined}
        pointerEvents={disabled ? 'none' : undefined}
        position={{ base: 'absolute', md: 'static' }}
        px={3}
        top={{ base: '100%', md: 'auto' }}
        transform={{ base: 'translateX(-50%)', md: 'none' }}
        zIndex={2}
      >
        <Flex position="relative" flex="1" minW="100px" align="center">
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={hue}
            disabled={disabled}
            onChange={(event) => {
              handleHueChange(Number(event.currentTarget.value))
            }}
            aria-label="Gradient hue"
            style={hueSliderStyle}
            className="gradient-hue-slider"
          />
        </Flex>
        <Input
          value={hexInput}
          disabled={disabled}
          onChange={(event) => {
            setHexInput(event.currentTarget.value)
          }}
          onBlur={() => {
            commitHexInput(hexInput)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commitHexInput(hexInput)
              event.currentTarget.blur()
            }
          }}
          aria-label="Gradient base color"
          size="sm"
          w="88px"
          h="28px"
          borderRadius="full"
          borderColor="white"
          bg="transparent"
          color="white"
          fontFamily="mono"
          fontSize="xs"
          textTransform="uppercase"
          textAlign="center"
          px={3}
          _hover={{ borderColor: 'white' }}
          _focus={{ borderColor: 'white', boxShadow: 'none', outline: 'none' }}
          _focusVisible={{ borderColor: 'white', boxShadow: 'none', outline: 'none' }}
        />
      </Flex>
    </Box>
  )
}
