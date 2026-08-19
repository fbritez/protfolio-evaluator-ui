import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { CreatePortfolioView } from '../CreatePortfolioView/CreatePortfolioView.tsx'
import { addTickerToPortfolio, getPortfolioDetail, getPortfolios, type PortfolioDetail } from './portfolioApi'

type Props = {
  title: string
}

export function PortfolioView({ title }: Props) {
  const [portfolioNames, setPortfolioNames] = useState<string[]>([])
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<PortfolioDetail | null>(null)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAddTickerDialogOpen, setIsAddTickerDialogOpen] = useState(false)
  const [newTicker, setNewTicker] = useState('')
  const [addingTicker, setAddingTicker] = useState(false)

  const loadPortfolios = async () => {
    setLoadingList(true)
    setError(null)

    try {
      const names = await getPortfolios()
      setPortfolioNames(names)

      if (names.length > 0) {
        setSelectedName((current) => current ?? names[0])
      } else {
        setSelectedName(null)
        setSelectedDetail(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the portfolio list.')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    void loadPortfolios()
  }, [])

  useEffect(() => {
    if (!selectedName) return

    const loadPortfolioDetail = async () => {
      setLoadingDetail(true)
      setError(null)

      try {
        const detail = await getPortfolioDetail(selectedName)
        setSelectedDetail(detail)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load the selected portfolio information.',
        )
      } finally {
        setLoadingDetail(false)
      }
    }

    void loadPortfolioDetail()
  }, [selectedName])

  const handlePortfolioCreated = async (name: string) => {
    setError(null)
    await loadPortfolios()
    setSelectedName(name)
  }

  const handleAddTickerToPortfolio = async () => {
    if (!selectedName) {
      setError('Please select a portfolio before adding an instrument.')
      return
    }

    const trimmedTicker = newTicker.trim()
    if (!trimmedTicker) {
      setError('Instrument is required.')
      return
    }

    setAddingTicker(true)
    setError(null)

    try {
      await addTickerToPortfolio(selectedName, trimmedTicker)
      setIsAddTickerDialogOpen(false)
      setNewTicker('')
      await loadPortfolios()
      const refreshedDetail = await getPortfolioDetail(selectedName)
      setSelectedDetail(refreshedDetail)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the instrument.')
    } finally {
      setAddingTicker(false)
    }
  }

  return (
    <Box className="portfolio-layout">
      <Paper className="portfolio-panel left-panel" elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" className="panel-title">
            {title}
          </Typography>

          <Button
            variant="contained"
            size="small"
            onClick={() => setIsCreateDialogOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            + Nuevo
          </Button>
        </Box>

        {loadingList ? (
          <Box className="loading-box">
            <CircularProgress size={28} />
          </Box>
        ) : (
          <List className="portfolio-list" disablePadding>
            {portfolioNames.length === 0 ? (
              <ListItemButton disabled>
                <ListItemText primary="No portfolios available" />
              </ListItemButton>
            ) : (
              portfolioNames.map((name) => (
                <ListItemButton
                  key={name}
                  selected={selectedName === name}
                  onClick={() => setSelectedName(name)}
                  className="portfolio-item"
                >
                  <ListItemText primary={name} />
                </ListItemButton>
              ))
            )}
          </List>
        )}
      </Paper>

      <Paper className="portfolio-panel right-panel" elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" className="panel-title">
            {selectedName ?? 'Portfolio'}
          </Typography>

          {selectedName && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setIsAddTickerDialogOpen(true)}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              + Instrument
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {loadingDetail ? (
          <Box className="loading-box">
            <CircularProgress size={28} />
          </Box>
        ) : selectedDetail ? (
          <Box>
            <Typography variant="subtitle1" className="section-label">
              Instruments
            </Typography>

            <Box className="ticker-list" sx={{ mt: 1 }}>
              {(selectedDetail.tickers ?? []).length > 0 ? (
                (selectedDetail.tickers ?? []).map((ticker) => (
                  <Chip key={ticker} label={ticker} className="ticker-chip" />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No instruments available for this portfolio.
                </Typography>
              )}
            </Box>
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary">
            Select a portfolio to view its details.
          </Typography>
        )}
      </Paper>

      <CreatePortfolioView
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreated={handlePortfolioCreated}
      />

      <Dialog open={isAddTickerDialogOpen} onClose={() => setIsAddTickerDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add instrument</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Instrument"
            fullWidth
            variant="outlined"
            value={newTicker}
            onChange={(event) => setNewTicker(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleAddTickerToPortfolio()
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsAddTickerDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={() => void handleAddTickerToPortfolio()} variant="contained" disabled={addingTicker}>
            {addingTicker ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {error ? (
        <Box className="error-box" sx={{ mt: 2, gridColumn: '1 / -1' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : null}
    </Box>
  )
}
