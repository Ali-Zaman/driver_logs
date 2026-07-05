import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import PlannerPage from './pages/PlannerPage'
import TripPage from './pages/TripPage'
import theme from './theme'

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PlannerPage />} />
          <Route path="/trips/:id" element={<TripPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
