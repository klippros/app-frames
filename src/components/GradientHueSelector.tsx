import { Flex, Input } from '@chakra-ui/react'
import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
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

const HUE_GRADIENT =
  'linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(359 100% 50%))'

export const GradientHueSelector = ({
  baseColor,
  disabled = false,
  onChange,
}: GradientHueSelectorProps) => {
  const [hue, setHue] = useState(() => hueFromHex(baseColor) ?? getDefaultGradientHue())
  const [hexInput, setHexInput] = useState(baseColor)

  useEffect(() => {
    setHexInput(baseColor)
  }, [baseColor])

  const handleHueChange = (nextHue: number) => {
    setHue(nextHue)
    onChange(colorWithHue(nextHue))
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
    <Flex
      align="center"
      aria-disabled={disabled}
      bg="transparent"
      borderColor="blue.300"
      borderRadius="full"
      borderWidth="1px"
      cursor={disabled ? 'not-allowed' : undefined}
      gap={3}
      h={toolbarControlSize}
      maxW="320px"
      opacity={disabled ? 0.45 : undefined}
      pointerEvents={disabled ? 'none' : undefined}
      px={3}
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
          style={
            {
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
            } as CSSProperties
          }
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
  )
}
