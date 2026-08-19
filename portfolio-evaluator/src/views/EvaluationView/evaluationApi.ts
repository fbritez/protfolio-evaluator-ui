export type TickerMetrics = {
  Ticker: string
  CurrentPrice: number | string
  PriceMonthAgo: number | string
  SMA200: number | string
  Trend: string
  Variation: number | string
}

export type EvaluationPortfolioDetail = {
  name?: string
  tickers?: string[]
  symbols?: string[]
  holdings?: Array<{ ticker?: string; symbol?: string; name?: string }>
  positions?: Array<{ ticker?: string; symbol?: string; name?: string }>
  rows?: TickerMetrics[]
}

const readValue = (obj: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      return obj[key]
    }
  }

  return undefined
}

export const extractTickers = (payload: unknown): string[] => {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const record = payload as Record<string, unknown>
  const directSources = [record.tickers, record.symbols, record.holdings, record.positions]

  for (const source of directSources) {
    if (Array.isArray(source)) {
      const values = source
        .map((item) => {
          if (typeof item === 'string') return item
          if (item && typeof item === 'object') {
            const row = item as Record<string, unknown>
            return typeof row.ticker === 'string'
              ? row.ticker
              : typeof row.symbol === 'string'
                ? row.symbol
                : typeof row.name === 'string'
                  ? row.name
                  : null
          }
          return null
        })
        .filter((value): value is string => Boolean(value))

      if (values.length > 0) return values
    }
  }

  if (typeof record.ticker === 'string') return [record.ticker]
  if (typeof record.symbol === 'string') return [record.symbol]

  return []
}

export const extractTickerRows = (payload: unknown): TickerMetrics[] => {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const record = payload as Record<string, unknown>
  const candidateArrays = [
    record.monthly_variation,
    record.monthlyVariation,
    record.tickers,
    record.holdings,
    record.positions,
    record.data,
    record.items,
  ]

  for (const candidate of candidateArrays) {
    if (Array.isArray(candidate)) {
      const rows = candidate
        .map((item) => {
          if (!item || typeof item !== 'object') return null

          const row = item as Record<string, unknown>
          const ticker =
            (readValue(row, ['Ticker', 'ticker', 'Symbol', 'symbol']) as string | undefined) ?? ''

          if (!ticker) return null

          return {
            Ticker: String(ticker),
            CurrentPrice: readValue(row, ['CurrentPrice', 'currentPrice', 'Price', 'price']) ?? '',
            PriceMonthAgo: readValue(row, ['PriceMonthAgo', 'priceMonthAgo', 'PriceMonth', 'priceMonth']) ?? '',
            SMA200: readValue(row, ['SMA200', 'sma200', 'Sma200']) ?? '',
            Trend: String(readValue(row, ['Trend', 'trend']) ?? 'N/A'),
            Variation: readValue(row, ['Variation', 'variation', 'Var']) ?? '',
          }
        })
        .filter((item): item is TickerMetrics => Boolean(item && item.Ticker))

      if (rows.length > 0) return rows
    }
  }

  return []
}

export const getEvaluationDetail = async (name: string): Promise<EvaluationPortfolioDetail> => {
  const response = await fetch(`http://localhost:5000/api/portfolios/${encodeURIComponent(name)}`)
  if (!response.ok) throw new Error(`Error ${response.status}`)

  const payload = await response.json()
  const detail = payload && typeof payload === 'object' ? (payload as EvaluationPortfolioDetail) : {}
  const rows = extractTickerRows(payload)
  const tickers = extractTickers(payload)

  return {
    ...detail,
    name: detail.name ?? name,
    tickers: detail.tickers ?? tickers,
    rows: rows.length > 0 ? rows : detail.rows ?? [],
  }
}
