import { ChakraProvider, Theme } from '@chakra-ui/react'
import { system } from './theme'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'

config.autoAddCss = false

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <Theme appearance="dark">
        <App />
      </Theme>
    </ChakraProvider>
  </StrictMode>,
)
