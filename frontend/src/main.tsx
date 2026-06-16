import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, createTheme, type MantineColorsTuple } from '@mantine/core'
import '@mantine/core/styles.css'
import './index.css'
import './styles/Drawer.css'
import App from './App.tsx'

// #CCAC31 — Naja gold (primary)
const najaGold: MantineColorsTuple = [
  '#fdf8e6', '#f5e8b0', '#edd87a', '#e5c844', '#ddb80e',
  '#c9a42b', '#8C7326', '#a08624', '#7a641b', '#534212',
];

// #265D73 — Naja teal (accent)
const najaTeal: MantineColorsTuple = [
  '#e4f0f5', '#bcd8e5', '#92bfd4', '#67a6c3', '#3d8db2',
  '#2a6f8e', '#265D73', '#1d4a5c', '#143646', '#0b222f',
];

// #8C7326 — Naja gold alt (muted)
const najaGoldAlt: MantineColorsTuple = [
  '#f5f0e0', '#e8ddb8', '#dbca90', '#ceb768', '#c1a440',
  '#9e8530', '#8C7326', '#705c1e', '#544517', '#382e0f',
];

// #DDD3BA — Naja text (body copy)
const najaText: MantineColorsTuple = [
  '#faf9f5', '#f4f1e8', '#ede8d8', '#e6ddc9', '#ddd3ba',
  '#d0c5a7', '#DDD3BA', '#a89e85', '#7d7663', '#534e40',
];

const theme = createTheme({
  primaryColor: 'najaGold',
  fontFamily: "Verdana, sans-serif",
  colors: { najaGold, najaTeal, najaGoldAlt, najaText },
  headings: {
    fontFamily: "Verdana, sans-serif",
    fontWeight: '600',
  },
  components: {
    Text: {
      defaultProps: {
        c: 'najaText',
      },
    },
    Button: {
      defaultProps: {
        variant: 'outline',
        color: 'najaGold',
      },
      styles: {
        root: {
          fontFamily: "'Vollkorn', Georgia, serif",
          borderColor: 'rgba(204, 172, 49, 0.4)',
        },
      },
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
