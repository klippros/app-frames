import { createSystem, defaultConfig, defineConfig, defineRecipe } from '@chakra-ui/react'

const scaleMotion = {
  transform: 'scale(1)',
  transitionProperty: 'transform, background-color, border-color',
  transitionDuration: '0.15s',
  _hover: { transform: 'scale(1.03)' },
  _active: { transform: 'scale(0.98)' },
}

const buttonRecipe = defineRecipe({
  variants: {
    variant: {
      cancel: {
        ...scaleMotion,
        bg: 'transparent',
        color: 'white',
        borderWidth: '1px',
        borderColor: 'whiteAlpha.600',
        _hover: {
          ...scaleMotion._hover,
          bg: 'whiteAlpha.100',
          borderColor: 'whiteAlpha.800',
        },
        _active: {
          ...scaleMotion._active,
          bg: 'whiteAlpha.150',
        },
      },
      emphasis: {
        ...scaleMotion,
        bg: 'white',
        color: 'black',
        borderColor: 'transparent',
        _hover: {
          ...scaleMotion._hover,
          bg: 'whiteAlpha.900',
        },
        _active: {
          ...scaleMotion._active,
          bg: 'whiteAlpha.800',
        },
      },
      cta: {
        ...scaleMotion,
        borderRadius: '12px',
        bg: 'transparent',
        color: 'white',
        borderWidth: '1px',
        borderColor: 'whiteAlpha.600',
        _hover: {
          ...scaleMotion._hover,
          bg: 'transparent',
          borderColor: 'whiteAlpha.800',
        },
        _active: {
          ...scaleMotion._active,
          bg: 'transparent',
        },
      },
      destructive: {
        ...scaleMotion,
        bg: 'red.500',
        color: 'white',
        borderColor: 'transparent',
        _hover: {
          ...scaleMotion._hover,
          bg: 'red.600',
        },
      },
    },
  },
})

const config = defineConfig({
  globalCss: {
    html: {
      color: 'fg',
      backgroundColor: '#000000',
      backgroundImage: 'radial-gradient(circle at top, #111136, #000000)',
      backgroundAttachment: 'fixed',
      lineHeight: '1.5',
      colorPalette: 'gray',
    },
    body: {
      color: 'fg',
      bg: 'transparent',
    },
    '#root': {
      bg: 'transparent',
    },
  },
  theme: {
    recipes: {
      button: buttonRecipe,
    },
  },
})

export const system = createSystem(defaultConfig, config)
