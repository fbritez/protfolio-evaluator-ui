import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material'
import { getPortfolioDetail } from '../PortfolioView/portfolioApi'
import { renamePortfolio } from './editPortfolioApi'

const normalizeInstrumentRow = (item: unknown): PortfolioInstrumentSummary | null => {
  if (typeof item === 'string') {
    const value = item.trim()
    if (!value) return null
    return { Symbol: value, Name: value }
  }

  if (!item || typeof item !== 'object') {
    return null
  }

  const record = item as Record<string, unknown>
  const details = record.details && typeof record.details === 'object' ? (record.details as Record<string, unknown>) : record

  const symbol =
    typeof record.Symbol === 'string'
      ? record.Symbol
      : typeof record.symbol === 'string'
        ? record.symbol
        : typeof details.Symbol === 'string'
          ? details.Symbol
          : typeof details.symbol === 'string'
            ? details.symbol
            : typeof record.ticker === 'string'
              ? record.ticker
              : typeof record.Ticker === 'string'
                ? record.Ticker
                : typeof details.ticker === 'string'
                  ? details.ticker
                  : typeof details.Ticker === 'string'
                    ? details.Ticker
                    : ''

  const name =
    typeof record.Name === 'string'
      ? record.Name
      : typeof record.name === 'string'
        ? record.name
        : typeof details.Name === 'string'
          ? details.Name
          : typeof details.name === 'string'
            ? details.name
            : typeof record.companyName === 'string'
              ? record.companyName
              : typeof details.companyName === 'string'
                ? details.companyName
                : ''

  const normalizedSymbol = symbol.trim()
  const normalizedName = name.trim()

  if (!normalizedSymbol && !normalizedName) {
    return null
  }

  return {
    Symbol: normalizedSymbol || normalizedName,
    Name: normalizedName || normalizedSymbol,
  }
}

const normalizeInstrumentList = (value: unknown): PortfolioInstrumentSummary[] => {
  const source = Array.isArray(value) ? value : []

  return source
    .map(normalizeInstrumentRow)
    .filter((entry): entry is PortfolioInstrumentSummary => Boolean(entry))
    .filter((entry, index, array) => array.findIndex((item) => item.Symbol === entry.Symbol) === index)
}

type Props = {
  open: boolean
  currentName: string | null
  onClose: () => void
  onRenamed: (currentName: string, newName: string, remainingTickers: string[]) => void | Promise<void>
}

type PortfolioInstrumentSummary = {
  Symbol: string
  Name: string
}

export function EditPortfolioView({ open, currentName, onClose, onRenamed }: Props) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [instrumentList, setInstrumentList] = useState<PortfolioInstrumentSummary[]>([])

  useEffect(() => {
    const loadInstruments = async () => {
      if (!open || !currentName) {
        setInstrumentList([])
        setName('')
        setError(null)
        return
      }

      try {
        const detail = await getPortfolioDetail(currentName)
        const normalized = [
          ...normalizeInstrumentList(detail.instruments),
          ...normalizeInstrumentList(detail.tickers),
        ].filter((instrument, index, array) => array.findIndex((item) => item.Symbol === instrument.Symbol) === index)

        setInstrumentList(normalized)
        setName(currentName)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load the portfolio instruments.')
      }
    }

    void loadInstruments()
  }, [open, currentName])

  const handleRemoveInstrument = (symbolToRemove: string) => {
    setInstrumentList((current) => current.filter((instrument) => instrument.Symbol !== symbolToRemove))
  }

  const handleSubmit = async () => {
    const trimmed = name.trim()

    if (!currentName) {
      setError('Please select a portfolio first.')
      return
    }

    if (!trimmed) {
      setError('Portfolio name is required.')
      return
    }

    if (trimmed === currentName.trim()) {
      setError('The new name must be different from the current one.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const remainingTickers = instrumentList
        .map((instrument) => instrument.Symbol)
        .filter(Boolean)

      await renamePortfolio(currentName, trimmed, remainingTickers)
      await onRenamed(currentName, trimmed, remainingTickers)
      setName('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the portfolio.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit portfolio</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Portfolio name"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(event) => {
            const value = event.target.value
            setName(value)
            if (value.trim() && error) {
              setError(null)
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void handleSubmit()
            }
          }}
        />

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 700 }}>
          Instruments
        </Typography>

        {instrumentList.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No instruments in this portfolio.
          </Typography>
        ) : (
          <List dense sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2, maxHeight: 260, overflow: 'auto' }}>
            {instrumentList.map((instrument) => (
              <ListItem
                key={`${instrument.Symbol}-${instrument.Name}`}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="Delete instrument"
                    onClick={() => handleRemoveInstrument(instrument.Symbol)}
                    sx={{ color: '#b42318' }}
                  >
                    🗑
                  </IconButton>
                }
              >
                <ListItemText primary={instrument.Symbol || '-'} secondary={instrument.Name || 'Unknown'} />
              </ListItem>
            ))}
          </List>
        )}

        {error ? (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={() => void handleSubmit()} variant="contained" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
