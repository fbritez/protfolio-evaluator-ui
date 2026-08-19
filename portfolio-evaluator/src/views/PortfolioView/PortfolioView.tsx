import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Divider,
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
import { CreatePortfolioView } from '../CreatePortfolioView/CreatePortfolioView.tsx'
import { EditPortfolioView } from '../EditPortfolioView/EditPortfolioView'
import { InstrumentView } from '../InstrumentView/InstrumentView'
import { getPortfolioDetail, getPortfolios, type PortfolioDetail } from './portfolioApi'

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [portfolioToEdit, setPortfolioToEdit] = useState<string | null>(null)
  const [isAddInstrumentDialogOpen, setIsAddInstrumentDialogOpen] = useState(false)

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

  const handlePortfolioRenamed = async (newName: string) => {
    setError(null)
    await loadPortfolios()
    setSelectedName(newName)
  }

  const handleAddInstrumentSuccess = async () => {
    const names = await getPortfolios()
    setPortfolioNames(names)

    if (names.length === 0) {
      setSelectedName(null)
      setSelectedDetail(null)
      return
    }

    const nextSelectedName = selectedName && names.includes(selectedName)
      ? selectedName
      : names[0]

    setSelectedName(nextSelectedName)

    const refreshedDetail = await getPortfolioDetail(nextSelectedName)
    setSelectedDetail(refreshedDetail)
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
                <Box
                  key={name}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    borderRadius: 2,
                    ml: 0,
                    mr: 0,
                  }}
                >
                  <ListItemButton
                    selected={selectedName === name}
                    onClick={() => setSelectedName(name)}
                    className="portfolio-item"
                    sx={{ flexGrow: 1, borderRadius: 2, mr: 0}}
                  >
                    <ListItemText primary={name} />
                  </ListItemButton>

                  <Button
                    variant="text"
                    size="small"
                    onClick={() => {
                      setPortfolioToEdit(name)
                      setIsEditDialogOpen(true)
                    }}
                    sx={{ minWidth: 0, px: 1, py: 0.5, fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    Edit
                  </Button>
                </Box>
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
