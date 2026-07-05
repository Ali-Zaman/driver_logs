import { createTheme } from '@mui/material/styles'

export const statusColors = {
  off_duty: '#3ECF8E',
  sleeper_berth: '#A78BFA',
  driving: '#FFB020',
  on_duty: '#58A6FF',
} as const

export const statusLabels = {
  off_duty: 'Off Duty',
  sleeper_berth: 'Sleeper Berth',
  driving: 'Driving',
  on_duty: 'On Duty',
} as const

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0D1117', paper: '#151B23' },
    primary: { main: '#FFB020', contrastText: '#14100A' },
    secondary: { main: '#58A6FF' },
    divider: 'rgba(139, 148, 158, 0.16)',
    text: { primary: '#E6EDF3', secondary: '#8B949E' },
    success: { main: '#3ECF8E' },
    error: { main: '#F85149' },
  },
  typography: {
    fontFamily: '"Barlow", sans-serif',
    h1: { fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 600 },
    h2: { fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 600 },
    h3: { fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 600 },
    h4: { fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 600, letterSpacing: '0.02em' },
    h5: { fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 600, letterSpacing: '0.02em' },
    h6: { fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 600, letterSpacing: '0.04em' },
    overline: { fontFamily: '"IBM Plex Mono", monospace', letterSpacing: '0.14em' },
    button: {
      fontFamily: '"Barlow Condensed", sans-serif',
      fontWeight: 600,
      letterSpacing: '0.08em',
      fontSize: '1rem',
    },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(139, 148, 158, 0.16)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'uppercase',
          variants: [
            {
              props: { variant: 'contained', color: 'primary' },
              style: { '&:hover': { boxShadow: '0 0 24px rgba(255, 176, 32, 0.35)' } },
            },
          ],
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        label: { fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.72rem' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 600,
          letterSpacing: '0.06em',
          fontSize: '1rem',
        },
      },
    },
  },
})

export default theme
