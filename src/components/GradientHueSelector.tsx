import { Box, Flex, Input } from '@chakra-ui/react'
import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { toolbarControlHeight } from './ToolbarIconButton'
import {
  baseColorFromHexInput,
  colorWithHue,
  getDefaultGradientHue,
  hueFromHex,
} from '../utils/colorHue'

export interface GradientHueSelectorProps {
  baseColor: string
  onChange: (baseColor: string) => void
}

const HUE_GRADIENT =
  'linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(359 100% 50%))'

export const GradientHueSelector = ({ baseColor, onChange }: GradientHueSelectorProps) => {
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
      borderColor="border"
      borderRadius="full"
      borderWidth="1px"
      gap={3}
      h={toolbarControlHeight}
      maxW="320px"
      px={3}
    >
      <Box position="relative" flex="1" minW="140px" display="flex" alignItems="center">
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={hue}
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
      </Box>
      <Input
        value={hexInput}
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
        borderRadius="full"
        borderColor="border.emphasized"
        fontFamily="mono"
        textTransform="uppercase"
        px={3}
      />
    </Flex>
  )
}
