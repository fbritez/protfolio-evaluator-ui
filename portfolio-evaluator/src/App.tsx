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
      main: '#1f5a75',
      light: '#dfeef6',
      dark: '#123d56',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#73a8c5',
      light: '#edf6fb',
      dark: '#4e7a96',
      contrastText: '#ffffff',
    },
    success: {
      main: '#67b99a',
    },
    warning: {
      main: '#f2c57c',
    },
    background: {
      default: '#eef4f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#1d2b36',
      secondary: '#5a6f7d',
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: ['Inter', '"Segoe UI"', 'Roboto', 'sans-serif'].join(','),
    h5: {
      fontWeight: 800,
    },
    h6: {
      fontWeight: 800,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 999,
          fontWeight: 700,
          boxShadow: 'none',
          letterSpacing: '0.01em',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 10px 26px rgba(18, 50, 64, 0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
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
                    background: view === 'portfolios' ? 'linear-gradient(135deg, #1f5a75 0%, #5d8ea6 100%)' : 'rgba(31, 90, 117, 0.04)',
                    color: view === 'portfolios' ? '#ffffff' : '#1f5a75',
                    '&:hover': {
                      background: view === 'portfolios' ? 'linear-gradient(135deg, #1f5a75 0%, #5d8ea6 100%)' : 'rgba(31, 90, 117, 0.08)',
                    },
                    px: 2,
                  }}
                >
                  Portfolios
                </Button>
                <Button
                  variant={view === 'evaluacion' ? 'contained' : 'text'}
                  color="secondary"
                  onClick={() => setView('evaluacion')}
                  sx={{
                    background: view === 'evaluacion' ? 'linear-gradient(135deg, #73a8c5 0%, #a7d0e6 100%)' : 'rgba(115, 168, 197, 0.05)',
                    color: view === 'evaluacion' ? '#103149' : '#4c6879',
                    '&:hover': {
                      background: view === 'evaluacion' ? 'linear-gradient(135deg, #73a8c5 0%, #a7d0e6 100%)' : 'rgba(115, 168, 197, 0.10)',
                    },
                    px: 2,
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
