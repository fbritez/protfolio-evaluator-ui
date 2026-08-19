export type InstrumentMetrics = {
  Symbol: string
  CurrentPrice: number | string
  PriceMonthAgo: number | string
  SMA200: number | string
  Trend: string
  Variation: number | string
}

export type TechnicalAnalysisRow = {
  Ticker?: string
  Symbol?: string
  Price?: number | string
  RSI?: number | string
  SMA_50?: number | string
  SMA_200?: number | string
  LongTermTrend?: string
  DetectedSignals?: string[] | string
}

export type EvaluationPortfolioDetail = {
  name?: string
  tickers?: string[]
  symbols?: string[]
  holdings?: Array<{ ticker?: string; symbol?: string; name?: string }>
  positions?: Array<{ ticker?: string; symbol?: string; name?: string }>
  rows?: InstrumentMetrics[]
  technical_analysis?: TechnicalAnalysisRow[]
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

export const extractInstrumentRows = (payload: unknown): InstrumentMetrics[] => {
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
          const instrumentSymbol =
            (readValue(row, ['Ticker', 'ticker', 'Symbol', 'symbol']) as string | undefined) ?? ''

          if (!instrumentSymbol) return null

          return {
            Symbol: String(instrumentSymbol),
            CurrentPrice: readValue(row, ['CurrentPrice', 'currentPrice', 'Price', 'price']) ?? '',
            PriceMonthAgo: readValue(row, ['PriceMonthAgo', 'priceMonthAgo', 'PriceMonth', 'priceMonth']) ?? '',
            SMA200: readValue(row, ['SMA200', 'sma200', 'Sma200']) ?? '',
            Trend: String(readValue(row, ['Trend', 'trend']) ?? 'N/A'),
            Variation: readValue(row, ['Variation', 'variation', 'Var']) ?? '',
          }
        })
        .filter((item): item is InstrumentMetrics => Boolean(item && item.Symbol))

      if (rows.length > 0) return rows
    }
  }

  return []
}

const normalizeTechnicalSignals = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : String(item ?? '').trim()))
      .filter((item) => Boolean(item))
  }

  if (typeof value === 'string') {
    return value.trim() ? [value.trim()] : []
  }

  return []
}

export const extractTechnicalAnalysisRows = (payload: unknown): TechnicalAnalysisRow[] => {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const record = payload as Record<string, unknown>
  const candidateArrays = [record.technical_analysis, record.technicalAnalysis, record.analysis, record.technical]

  for (const candidate of candidateArrays) {
    if (!Array.isArray(candidate)) continue

    const rows: TechnicalAnalysisRow[] = candidate
      .map((item) => {
        if (!item || typeof item !== 'object') return null

        const row = item as Record<string, unknown>
        const ticker =
          (readValue(row, ['Ticker', 'ticker', 'Symbol', 'symbol']) as string | undefined) ??
          (typeof row.Ticker === 'string' ? row.Ticker : '')

        const parsedRow: TechnicalAnalysisRow = {
          Ticker: ticker || undefined,
          Symbol: ticker || undefined,
          Price: (readValue(row, ['Price', 'price', 'CurrentPrice', 'currentPrice']) as number | string | undefined) ?? '',
          RSI: (readValue(row, ['RSI', 'rsi']) as number | string | undefined) ?? '',
          SMA_50: (readValue(row, ['SMA_50', 'SMA50', 'sma_50', 'sma50']) as number | string | undefined) ?? '',
          SMA_200: (readValue(row, ['SMA_200', 'SMA200', 'sma_200', 'sma200']) as number | string | undefined) ?? '',
          LongTermTrend: String(readValue(row, ['LongTermTrend', 'longTermTrend', 'Trend', 'trend']) ?? '-'),
          DetectedSignals: normalizeTechnicalSignals(readValue(row, ['DetectedSignals', 'detectedSignals', 'Signals', 'signals'])),
        }

        return parsedRow
      })
      .filter((item): item is TechnicalAnalysisRow => item !== null)

    if (rows.length > 0) return rows
  }

  const directRow = record as Record<string, unknown>
  const directValue: TechnicalAnalysisRow = {
    Ticker: (readValue(directRow, ['Ticker', 'ticker', 'Symbol', 'symbol']) as string | undefined) ?? '',
    Symbol: (readValue(directRow, ['Ticker', 'ticker', 'Symbol', 'symbol']) as string | undefined) ?? '',
    Price: (readValue(directRow, ['Price', 'price', 'CurrentPrice', 'currentPrice']) as number | string | undefined) ?? '',
    RSI: (readValue(directRow, ['RSI', 'rsi']) as number | string | undefined) ?? '',
    SMA_50: (readValue(directRow, ['SMA_50', 'SMA50', 'sma_50', 'sma50']) as number | string | undefined) ?? '',
    SMA_200: (readValue(directRow, ['SMA_200', 'SMA200', 'sma_200', 'sma200']) as number | string | undefined) ?? '',
    LongTermTrend: String(readValue(directRow, ['LongTermTrend', 'longTermTrend', 'Trend', 'trend']) ?? '-'),
    DetectedSignals: normalizeTechnicalSignals(readValue(directRow, ['DetectedSignals', 'detectedSignals', 'Signals', 'signals'])),
  }

  if (directValue.Ticker || directValue.Price || directValue.RSI || directValue.SMA_50 || directValue.SMA_200 || directValue.LongTermTrend) {
    return [directValue]
  }

  return []
}

export const getEvaluationDetail = async (name: string): Promise<EvaluationPortfolioDetail> => {
  const response = await fetch(`http://localhost:5000/api/portfolios/${encodeURIComponent(name)}`)
  if (!response.ok) throw new Error(`Error ${response.status}`)

  const payload = await response.json()
  const detail = payload && typeof payload === 'object' ? (payload as EvaluationPortfolioDetail) : {}
  const rows = extractInstrumentRows(payload)
  const tickers = extractTickers(payload)
  const technicalAnalysis = extractTechnicalAnalysisRows(payload)

  return {
    ...detail,
    name: detail.name ?? name,
    tickers: detail.tickers ?? tickers,
    rows: rows.length > 0 ? rows : detail.rows ?? [],
    technical_analysis: technicalAnalysis.length > 0 ? technicalAnalysis : detail.technical_analysis ?? [],
  }
}
