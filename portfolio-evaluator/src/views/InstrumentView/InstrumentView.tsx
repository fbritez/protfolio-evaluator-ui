import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import { addInstrumentToPortfolio, searchInstrument, type InstrumentSearchResult } from './instrumentApi'

type Props = {
  open: boolean
  selectedName: string | null
  onClose: () => void
  onAdded: (symbol: string, name?: string) => Promise<void> | void
}

export function InstrumentView({ open, selectedName, onClose, onAdded }: Props) {
  const [newInstrument, setNewInstrument] = useState('')
  const [searchingInstrument, setSearchingInstrument] = useState(false)
  const [addingInstrument, setAddingInstrument] = useState(false)
  const [instrumentSearchResult, setInstrumentSearchResult] = useState<InstrumentSearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setNewInstrument('')
    setInstrumentSearchResult(null)
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSearchInstrument = async () => {
    const trimmedInstrument = newInstrument.trim()
    if (!trimmedInstrument) {
      setError('Instrument is required.')
      setInstrumentSearchResult(null)
      return
    }

    const normalizedInstrument = trimmedInstrument.toUpperCase()
    setSearchingInstrument(true)
    setError(null)

    try {
      const result = await searchInstrument(normalizedInstrument)
      setInstrumentSearchResult(result)
      setNewInstrument(normalizedInstrument)

      if (!result || !result.Symbol || !result.Symbol.trim() || !result.Name || !result.Name.trim()) {
        setInstrumentSearchResult(null)
        setError('No results found for that instrument.')
      }
    } catch (err) {
      setInstrumentSearchResult(null)
      setError(err instanceof Error ? err.message : 'Could not search for the instrument.')
    } finally {
      setSearchingInstrument(false)
    }
  }

  const handleAddInstrumentToPortfolio = async () => {
    if (!selectedName) {
      setError('Please select a portfolio before adding an instrument.')
      return
    }

    const normalizedInstrument = newInstrument.trim().toUpperCase()
    if (!normalizedInstrument) {
      setError('Instrument is required.')
      return
    }

    setAddingInstrument(true)
    setError(null)

    try {
      await addInstrumentToPortfolio(selectedName, normalizedInstrument)
      resetForm()
      onClose()
      await onAdded(normalizedInstrument, instrumentSearchResult?.Name ?? normalizedInstrument)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the instrument.')
    } finally {
      setAddingInstrument(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Add instrument</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Instrument"
          fullWidth
          variant="outlined"
          value={newInstrument}
          onChange={(event) => {
            const nextValue = event.target.value.toUpperCase()
            setNewInstrument(nextValue)
            setInstrumentSearchResult(null)
            setError(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void handleSearchInstrument()
            }
          }}
        />

        {instrumentSearchResult ? (
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            {instrumentSearchResult.Symbol ?? newInstrument.toUpperCase()} - {instrumentSearchResult.Name || 'Unknown'}
          </Typography>
        ) : null}

        {error ? (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>

        {!instrumentSearchResult ? (
          <Button onClick={() => void handleSearchInstrument()} variant="contained" disabled={searchingInstrument}>
            {searchingInstrument ? 'Searching...' : 'Search'}
          </Button>
        ) : (
          <Button onClick={() => void handleAddInstrumentToPortfolio()} variant="contained" disabled={addingInstrument}>
            {addingInstrument ? 'Adding...' : 'Add'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
