import { useEffect, useState } from 'react'
import {
  Box,
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

  useEffect(() => {
    const loadPortfolios = async () => {
      setLoadingList(true)
      setError(null)

      try {
        const response = await fetch('http://localhost:5000/api/portfolios')
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
        <Typography variant="h5" className="panel-title">
          {selectedName ?? 'Portfolio'}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {loadingDetail ? (
          <Box className="loading-box">
            <CircularProgress size={28} />
          </Box>
        ) : selectedDetail ? (
          <Box>
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e2e8f0' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Instrument</TableCell>
                    <TableCell>Current Price</TableCell>
                    <TableCell>Price Month Ago</TableCell>
                    <TableCell>SMA 200</TableCell>
                    <TableCell>Trend</TableCell>
                    <TableCell>Variation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(selectedDetail.rows ?? []).length > 0 ? (
                    (selectedDetail.rows ?? []).map((row: InstrumentMetrics) => (
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
