import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import { renamePortfolio } from './editPortfolioApi'

type Props = {
  open: boolean
  currentName: string | null
  onClose: () => void
  onRenamed: (newName: string) => void | Promise<void>
}

export function EditPortfolioView({ open, currentName, onClose, onRenamed }: Props) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(currentName ?? '')
      setError(null)
    } else {
      setName('')
      setError(null)
    }
  }, [open, currentName])

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
      await renamePortfolio(currentName, trimmed)
      await onRenamed(trimmed)
      setName('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the portfolio name.')
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

        {error ? (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
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
