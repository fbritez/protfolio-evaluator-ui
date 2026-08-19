import { useState } from 'react'
import { AppBar, Box, Button, Container, ThemeProvider, Toolbar, Typography, createTheme } from '@mui/material'
import { PortfolioView } from './views/PortfolioView/PortfolioView'
import { EvaluationView } from './views/EvaluationView/EvaluationView'
import './App.css'

type View = 'portfolios' | 'evaluacion'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2F4F4F',
      light: '#dfeae7',
      dark: '#1d3438',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#A8B4B8',
      light: '#edf1f3',
      dark: '#768892',
      contrastText: '#1a2430',
    },
    success: {
      main: '#CFE2D8',
    },
    warning: {
      main: '#E7D8C5',
    },
    background: {
      default: '#f3f5f4',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e2a2f',
      secondary: '#5d6d72',
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: ['"Segoe UI"', 'Roboto', 'sans-serif'].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 999,
          fontWeight: 700,
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 14px 30px rgba(108, 126, 144, 0.12)',
        },
      },
    },
  },
})

function App() {
  const [view, setView] = useState<View>('portfolios')

  return (
    <ThemeProvider theme={theme}>
      <Box className="app-shell">
        <AppBar position="static" color="transparent" elevation={0} className="topbar">
          <Container maxWidth="lg">
            <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: '#2d3748' }}>
                Portfolio Evaluator
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={view === 'portfolios' ? 'contained' : 'text'}
                  color="primary"
                  onClick={() => setView('portfolios')}
                  sx={{
                    background: view === 'portfolios' ? 'linear-gradient(135deg, #2F4F4F 0%, #7F9BA1 100%)' : 'transparent',
                    color: view === 'portfolios' ? '#ffffff' : '#425c62',
                    '&:hover': { background: view === 'portfolios' ? 'linear-gradient(135deg, #2F4F4F 0%, #7F9BA1 100%)' : 'rgba(47, 79, 79, 0.06)' },
                  }}
                >
                  Portfolios
                </Button>
                <Button
                  variant={view === 'evaluacion' ? 'contained' : 'text'}
                  color="secondary"
                  onClick={() => setView('evaluacion')}
                  sx={{
                    background: view === 'evaluacion' ? 'linear-gradient(135deg, #D9D2C7 0%, #B8C4C8 100%)' : 'transparent',
                    color: view === 'evaluacion' ? '#1d2a30' : '#51656c',
                    '&:hover': { background: view === 'evaluacion' ? 'linear-gradient(135deg, #D9D2C7 0%, #B8C4C8 100%)' : 'rgba(168, 180, 184, 0.10)' },
                  }}
                >
                  Evaluación
                </Button>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        <Container maxWidth="lg" className="page-content">
          {view === 'portfolios' ? <PortfolioView title="Portfolios" /> : <EvaluationView />}
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default App
