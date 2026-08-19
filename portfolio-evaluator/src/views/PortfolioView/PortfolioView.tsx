import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useMemo } from 'react'
import { CreatePortfolioView } from '../CreatePortfolioView/CreatePortfolioView.tsx'
import { EditPortfolioView } from '../EditPortfolioView/EditPortfolioView'
import { InstrumentView } from '../InstrumentView/InstrumentView'
import { PortfolioMemoryStore } from '../../models/PortfolioMemoryStore'
import { getPortfolioDetail, getPortfolios, type PortfolioDetail } from './portfolioApi'

type Props = {
  title: string
}

export function PortfolioView({ title }: Props) {
  const portfolioStore = useMemo(() => new PortfolioMemoryStore(), [])
  const [portfolioNames, setPortfolioNames] = useState<string[]>([])
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<PortfolioDetail | null>(null)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [portfolioToEdit, setPortfolioToEdit] = useState<string | null>(null)
  const [isAddInstrumentDialogOpen, setIsAddInstrumentDialogOpen] = useState(false)

  const loadPortfolios = async () => {
    setLoadingList(true)
    setError(null)

    try {
      const names = await getPortfolios()
      portfolioStore.setPortfolioNames(names)
      setPortfolioNames(portfolioStore.getNames())

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
    const created = portfolioStore.create(name)
    setPortfolioNames(portfolioStore.getNames())
    setSelectedName(created.name)
    setSelectedDetail(created.toDetail())
  }

  const handlePortfolioRenamed = async (currentName: string, newName: string, remainingTickers: string[]) => {
    setError(null)
    const updated = portfolioStore.rename(currentName, newName, remainingTickers)
    if (!updated) {
      return
    }

    setPortfolioNames(portfolioStore.getNames())
    setSelectedName(updated.name)
    setSelectedDetail(updated.toDetail())
  }

  const handleAddInstrumentSuccess = async (symbol: string, name?: string) => {
    if (!selectedName) {
      setSelectedDetail(null)
      return
    }

    const updated = portfolioStore.addInstrument(selectedName, symbol, name)
    if (!updated) {
      return
    }

    setPortfolioNames(portfolioStore.getNames())
    setSelectedDetail(updated.toDetail())
  }

  type InstrumentTableRow = {
    Symbol?: string
    Name?: string
    '52WeekHigh'?: number | string
    '52WeekLow'?: number | string
    Currency?: string
    CurrentPrice?: number | string
    DividendYield?: number | string
    Industry?: string
    Sector?: string
  }

  const instrumentRows: InstrumentTableRow[] = selectedDetail?.instruments && selectedDetail.instruments.length > 0
    ? (selectedDetail.instruments as InstrumentTableRow[])
    : (selectedDetail?.tickers ?? []).map((instrumentSymbol) => ({ Symbol: instrumentSymbol, Name: instrumentSymbol }))

  type InstrumentSortKey =
    | 'Symbol'
    | 'Name'
    | 'Currency'
    | 'Industry'
    | 'Sector'
    | 'DividendYield'
    | '52WeekHigh'
    | '52WeekLow'

  const [sortConfig, setSortConfig] = useState<{ key: InstrumentSortKey; direction: 'asc' | 'desc' }>({
    key: 'Symbol',
    direction: 'asc',
  })

  const getSortableCellValue = (row: InstrumentTableRow, key: InstrumentSortKey) => {
    const value = row[key]

    if (typeof value === 'number') return value
    if (typeof value === 'string') return value.trim().toLowerCase()
    return ''
  }

  const sortedInstrumentRows = [...instrumentRows].sort((a, b) => {
    const left = getSortableCellValue(a, sortConfig.key)
    const right = getSortableCellValue(b, sortConfig.key)

    if (left === right) return 0

    const comparison = left > right ? 1 : -1
    return sortConfig.direction === 'asc' ? comparison : -comparison
  })

  const handleSort = (key: InstrumentSortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const formatCurrency = (value: number | string | undefined) => {
    const numericValue = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(numericValue)) return '-'

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue)
  }

  const formatPercent = (value: number | string | undefined) => {
    const numericValue = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(numericValue)) return '-'

    return `${numericValue.toFixed(2)}%`
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" className="panel-title">
              {selectedName ?? 'Portfolio'}
            </Typography>

            {selectedName && (
              <IconButton
                size="small"
                aria-label="Edit portfolio"
                onClick={() => {
                  setPortfolioToEdit(selectedName)
                  setIsEditDialogOpen(true)
                }}
                sx={{
                  border: '1px solid rgba(61, 89, 102, 0.18)',
                  backgroundColor: 'rgba(31, 90, 117, 0.04)',
                  '&:hover': { backgroundColor: 'rgba(31, 90, 117, 0.08)' },
                }}
              >
                ✎
              </IconButton>
            )}
          </Box>

          {selectedName && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setIsAddInstrumentDialogOpen(true)}
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

            {instrumentRows.length > 0 ? (
              <TableContainer sx={{ mt: 2, maxHeight: 420 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {[
                        ['Symbol', 'Symbol'],
                        ['Name', 'Name'],
                        ['Currency', 'Currency'],
                        ['Industry', 'Industry'],
                        ['Sector', 'Sector'],
                        ['DividendYield', 'Dividend Yield'],
                        ['52WeekHigh', '52W High'],
                        ['52WeekLow', '52W Low'],
                      ].map(([key, label]) => (
                        <TableCell
                          key={key}
                          sx={{ fontSize: '0.78rem', cursor: 'pointer', userSelect: 'none' }}
                          onClick={() => handleSort(key as InstrumentSortKey)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>{label}</span>
                            {sortConfig.key === key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedInstrumentRows.map((instrument: InstrumentTableRow, index) => (
                      <TableRow key={`${instrument.Symbol ?? 'instrument'}-${index}`} hover>
                        <TableCell sx={{ fontSize: '0.78rem' }}>{instrument.Symbol || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.78rem' }}>{instrument.Name || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.78rem' }}>{instrument.Currency || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.78rem' }}>{instrument.Industry || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.78rem' }}>{instrument.Sector || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.78rem' }}>{formatPercent(instrument.DividendYield)}</TableCell>
                        <TableCell sx={{ fontSize: '0.78rem' }}>{formatCurrency(instrument['52WeekHigh'])}</TableCell>
                        <TableCell sx={{ fontSize: '0.78rem' }}>{formatCurrency(instrument['52WeekLow'])}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                No instruments available for this portfolio.
              </Typography>
            )}
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

      <EditPortfolioView
        open={isEditDialogOpen}
        currentName={portfolioToEdit}
        onClose={() => {
          setIsEditDialogOpen(false)
          setPortfolioToEdit(null)
        }}
        onRenamed={handlePortfolioRenamed}
      />

      <InstrumentView
        open={isAddInstrumentDialogOpen}
        selectedName={selectedName}
        onClose={() => setIsAddInstrumentDialogOpen(false)}
        onAdded={handleAddInstrumentSuccess}
      />

      {error ? (
        <Box className="error-box" sx={{ mt: 2, gridColumn: '1 / -1' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : null}
    </Box>
  )
}
