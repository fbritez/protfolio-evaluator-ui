import { useEffect, useState } from 'react'
import {
  Box,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { buildApiUrl } from '../../config/api'
import { getEvaluationDetail, type EvaluationPortfolioDetail } from './evaluationApi'

type InstrumentMetrics = NonNullable<EvaluationPortfolioDetail['rows']>[number]

const getTrendCell = (trend: string) => {
  const normalized = trend.toLowerCase()
  const isBullish = normalized.includes('bullish') || normalized.includes('above')

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: isBullish ? '#16a34a' : '#dc2626' }}>
      <Typography variant="body2" sx={{ fontSize: 24, lineHeight: 1, fontWeight: 800 }}>
        {isBullish ? '↗' : '↘'}
      </Typography>
    </Box>
  )
}

const getVariationCell = (value: number | string) => {
  const numericValue = Number(value ?? 0)
  const isPositive = numericValue >= 0

  return (
    <Typography variant="body2" sx={{ fontWeight: 700, color: isPositive ? '#16a34a' : '#dc2626' }}>
      {`${numericValue.toFixed(2)}%`}
    </Typography>
  )
}

export function EvaluationView() {
  const [portfolioNames, setPortfolioNames] = useState<string[]>([])
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<EvaluationPortfolioDetail | null>(null)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'monthly' | 'technical'>('monthly')
  const [sortConfig, setSortConfig] = useState<{ key: 'Symbol' | 'CurrentPrice' | 'PriceMonthAgo' | 'SMA200' | 'Trend' | 'Variation'; direction: 'asc' | 'desc' }>({
    key: 'Symbol',
    direction: 'asc',
  })

  const handleSort = (key: 'Symbol' | 'CurrentPrice' | 'PriceMonthAgo' | 'SMA200' | 'Trend' | 'Variation') => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const getSortValue = (row: InstrumentMetrics, key: 'Symbol' | 'CurrentPrice' | 'PriceMonthAgo' | 'SMA200' | 'Trend' | 'Variation') => {
    if (key === 'Trend') return String(row.Trend ?? '').toLowerCase()
    if (key === 'Variation') return Number(row.Variation ?? 0)
    if (key === 'CurrentPrice' || key === 'PriceMonthAgo' || key === 'SMA200') return Number(row[key] ?? 0)
    return String(row.Symbol ?? '').toLowerCase()
  }

  const sortedRows = [...(selectedDetail?.rows ?? [])].sort((a, b) => {
    const left = getSortValue(a, sortConfig.key)
    const right = getSortValue(b, sortConfig.key)

    if (left === right) return 0

    const comparison = left > right ? 1 : -1
    return sortConfig.direction === 'asc' ? comparison : -comparison
  })

  const technicalRows = selectedDetail?.technical_analysis ?? []

  useEffect(() => {
    const loadPortfolios = async () => {
      setLoadingList(true)
      setError(null)

      try {
        const response = await fetch(buildApiUrl('/api/portfolios'))
        if (!response.ok) throw new Error(`Error ${response.status}`)

        const payload = await response.json()
        const names = Array.isArray(payload)
          ? payload
              .map((item) => {
                if (typeof item === 'string') return item
                if (item && typeof item === 'object') {
                  const record = item as Record<string, unknown>
                  return typeof record.name === 'string' ? record.name : null
                }
                return null
              })
              .filter((value): value is string => Boolean(value))
          : []

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

    void loadPortfolios()
  }, [])

  useEffect(() => {
    if (!selectedName) return

    const loadPortfolioDetail = async () => {
      setLoadingDetail(true)
      setError(null)

      try {
        const detail = await getEvaluationDetail(selectedName)
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

  return (
    <Box className="portfolio-layout">
      <Paper className="portfolio-panel left-panel" elevation={0}>
        <Typography variant="h5" className="panel-title">
          Evaluación
        </Typography>

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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="h5" className="panel-title">
            {selectedName ?? 'Portfolio'}
          </Typography>

          {selectedDetail ? (
            <Box
              sx={{
                border: '1px solid rgba(15, 23, 42, 0.08)',
                backgroundColor: 'rgba(15, 23, 42, 0.02)',
                borderRadius: 2,
                px: 1,
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(_, nextTab) => setActiveTab(nextTab)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 32,
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '999px',
                    background: 'linear-gradient(90deg, #0f766e 0%, #2563eb 100%)',
                  },
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 700,
                    minHeight: 32,
                    fontSize: '0.72rem',
                    color: '#475569',
                    '&.Mui-selected': { color: '#0f172a' },
                  },
                }}
              >
                <Tab label="Month" value="monthly" />
                <Tab label="Technical Analytics" value="technical" />
              </Tabs>
            </Box>
          ) : null}
        </Box>

        <Divider sx={{ my: 2 }} />

        {loadingDetail ? (
          <Box className="loading-box">
            <CircularProgress size={28} />
          </Box>
        ) : selectedDetail ? (
          <Box>
            {activeTab === 'monthly' ? (
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      {[
                        ['Symbol', 'Instrument'],
                        ['CurrentPrice', 'Current Price'],
                        ['PriceMonthAgo', 'Price Month Ago'],
                        ['SMA200', 'SMA 200'],
                        ['Trend', 'Trend'],
                        ['Variation', 'Variation'],
                      ].map(([key, label]) => (
                        <TableCell
                          key={key}
                          sx={{
                            backgroundColor: '#f8fafc',
                            fontWeight: 700,
                            color: '#334155',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                          onClick={() => handleSort(key as 'Symbol' | 'CurrentPrice' | 'PriceMonthAgo' | 'SMA200' | 'Trend' | 'Variation')}
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
                    {sortedRows.length > 0 ? (
                      sortedRows.map((row: InstrumentMetrics) => (
                        <TableRow key={row.Symbol} hover>
                          <TableCell>{row.Symbol}</TableCell>
                          <TableCell>{`$${Number(row.CurrentPrice ?? 0).toFixed(2)}`}</TableCell>
                          <TableCell>{`$${Number(row.PriceMonthAgo ?? 0).toFixed(2)}`}</TableCell>
                          <TableCell>{`$${Number(row.SMA200 ?? 0).toFixed(2)}`}</TableCell>
                          <TableCell>{getTrendCell(row.Trend)}</TableCell>
                          <TableCell>{getVariationCell(row.Variation)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Typography variant="body2" color="text.secondary">
                            No instrument metrics are available for this portfolio.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      {['Ticker', 'Price', 'RSI', 'SMA 50', 'SMA 200', 'Long Term Trend', 'Detected Signals'].map((label) => (
                        <TableCell key={label} sx={{ backgroundColor: '#f8fafc', fontWeight: 700, color: '#334155' }}>{label}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {technicalRows.length > 0 ? (
                      technicalRows.map((row, index) => (
                        <TableRow key={`${row.Ticker ?? row.Symbol ?? 'technical'}-${index}`} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{row.Ticker ?? row.Symbol ?? '-'}</TableCell>
                          <TableCell>{Number(row.Price ?? 0).toFixed(2)}</TableCell>
                          <TableCell>{Number(row.RSI ?? 0).toFixed(2)}</TableCell>
                          <TableCell>{Number(row.SMA_50 ?? 0).toFixed(2)}</TableCell>
                          <TableCell>{Number(row.SMA_200 ?? 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: 'inline-flex',
                                px: 1,
                                py: 0.25,
                                borderRadius: 999,
                                backgroundColor: (row.LongTermTrend ?? '').toLowerCase().includes('bullish') ? 'rgba(22, 163, 74, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                color: (row.LongTermTrend ?? '').toLowerCase().includes('bullish') ? '#15803d' : '#b91c1c',
                                fontWeight: 700,
                              }}
                            >
                              {row.LongTermTrend ?? '-'}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {Array.isArray(row.DetectedSignals) && row.DetectedSignals.length > 0
                              ? row.DetectedSignals.join(', ')
                              : (row.DetectedSignals ? String(row.DetectedSignals) : '-')}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Typography variant="body2" color="text.secondary">
                            No technical analysis data available for this portfolio.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary">
            Select a portfolio to view its details.
          </Typography>
        )}
      </Paper>

      {error ? (
        <Box className="error-box" sx={{ mt: 2, gridColumn: '1 / -1' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : null}
    </Box>
  )
}
