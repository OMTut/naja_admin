import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, createTheme, type MantineColorsTuple } from '@mantine/core'
import '@mantine/core/styles.css'
import './index.css'
import App from './App.tsx'

// #CCAC31 — Naja gold (primary)
const najaGold: MantineColorsTuple = [
  '#fdf8e6', '#f5e8b0', '#edd87a', '#e5c844', '#ddb80e',
  '#c9a42b', '#CCAC31', '#a08624', '#7a641b', '#534212',
];

// #265D73 — Naja teal (accent)
const najaTeal: MantineColorsTuple = [
  '#e4f0f5', '#bcd8e5', '#92bfd4', '#67a6c3', '#3d8db2',
  '#2a6f8e', '#265D73', '#1d4a5c', '#143646', '#0b222f',
];

const theme = createTheme({
  primaryColor: 'najaGold',
  fontFamily: "'Vollkorn', Georgia, serif",
  colors: { najaGold, najaTeal },
  headings: {
    fontFamily: "'Vollkorn', Georgia, serif",
    fontWeight: '900',
  },
  components: {
    Button: {
      defaultProps: { fontFamily: "'Vollkorn', Georgia, serif" },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} forceColorScheme="dark">
      <App />
    </MantineProvider>
  </StrictMode>,
)
