export type PortfolioInstrument = {
  Symbol?: string
  symbol?: string
  Name?: string
  name?: string
  '52WeekHigh'?: number | string
  '52WeekLow'?: number | string
  Currency?: string
  CurrentPrice?: number | string
  DividendYield?: number | string
  Industry?: string
  Sector?: string
  [key: string]: unknown
}

export type PortfolioDetail = {
  name?: string
  tickers?: string[]
  symbols?: string[]
  instruments?: PortfolioInstrument[]
  holdings?: Array<{ ticker?: string; symbol?: string; name?: string }>
  positions?: Array<{ ticker?: string; symbol?: string; name?: string }>
}

export const extractPortfolioNames = (payload: unknown): string[] => {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>
          return typeof record.name === 'string' ? record.name : null
        }
        return null
      })
      .filter((value): value is string => Boolean(value))
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const candidates = [record.portfolios, record.data, record.items]

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return extractPortfolioNames(candidate)
      }
    }
  }

  return []
}

export const extractInstruments = (payload: unknown): PortfolioInstrument[] => {
  const sourceArray = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object'
      ? ((payload as Record<string, unknown>).instruments as unknown[] | undefined) ??
        ((payload as Record<string, unknown>).instrumentos as unknown[] | undefined) ??
        ((payload as Record<string, unknown>).items as unknown[] | undefined) ??
        ((payload as Record<string, unknown>).holdings as unknown[] | undefined) ??
        ((payload as Record<string, unknown>).positions as unknown[] | undefined) ??
        []
      : []

  if (!Array.isArray(sourceArray)) {
    return []
  }

  const values = sourceArray
    .map((item) => {
      if (!item || typeof item !== 'object') return null

      const row = item as Record<string, unknown>
      const detail =
        row.details && typeof row.details === 'object'
          ? (row.details as Record<string, unknown>)
          : row

      const symbol =
        typeof row.symbol === 'string'
          ? row.symbol
          : typeof row.Symbol === 'string'
            ? row.Symbol
            : typeof detail.symbol === 'string'
              ? detail.symbol
              : typeof detail.Symbol === 'string'
                ? detail.Symbol
                : typeof row.ticker === 'string'
                  ? row.ticker
                  : typeof row.Ticker === 'string'
                    ? row.Ticker
                    : ''

      const name =
        typeof detail.Name === 'string'
          ? detail.Name
          : typeof detail.name === 'string'
            ? detail.name
            : typeof row.Name === 'string'
              ? row.Name
              : typeof row.name === 'string'
                ? row.name
                : ''

      if (!symbol && !name && Object.keys(detail).length === 0) return null

      return {
        ...(detail as Record<string, unknown>),
        symbol: symbol || undefined,
        Symbol: symbol || undefined,
        name: name || undefined,
        Name: name || undefined,
      } as PortfolioInstrument
    })
    .filter((value): value is PortfolioInstrument => Boolean(value))

  return values
}

export const extractTickers = (payload: unknown): string[] => {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const record = payload as Record<string, unknown>
  const directSources = [record.tickers, record.symbols, record.instruments, record.instrumentos, record.holdings, record.positions]

  for (const source of directSources) {
    if (Array.isArray(source)) {
      const values = source
        .map((item) => {
          if (typeof item === 'string') return item
          if (item && typeof item === 'object') {
            const row = item as Record<string, unknown>
            const detail = row.details && typeof row.details === 'object' ? (row.details as Record<string, unknown>) : row

            return typeof detail.Symbol === 'string'
              ? detail.Symbol
              : typeof detail.symbol === 'string'
                ? detail.symbol
                : typeof row.Symbol === 'string'
                  ? row.Symbol
                  : typeof row.symbol === 'string'
                    ? row.symbol
                    : typeof row.ticker === 'string'
                      ? row.ticker
                      : typeof row.Ticker === 'string'
                        ? row.Ticker
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
  if (typeof record.Symbol === 'string') return [record.Symbol]

  return []
}

export const getPortfolios = async (): Promise<string[]> => {
  const response = await fetch('http://localhost:5000/api/portfolios')
  if (!response.ok) throw new Error(`Error ${response.status}`)

  const payload = await response.json()
  return extractPortfolioNames(payload)
}

export const getPortfolioDetail = async (name: string): Promise<PortfolioDetail> => {
  const response = await fetch(`http://localhost:5000/api/portfolios/${encodeURIComponent(name)}`)
  if (!response.ok) throw new Error(`Error ${response.status}`)

  const payload = await response.json()
  const detail = payload && typeof payload === 'object' ? (payload as PortfolioDetail) : {}
  const instruments = extractInstruments(payload)
  const tickers = extractTickers(payload)

  return {
    ...detail,
    name: detail.name ?? name,
    instruments: instruments.length > 0 ? instruments : (Array.isArray(detail.instruments) ? extractInstruments(detail.instruments) : []),
    tickers: detail.tickers ?? tickers,
  }
}

export type InstrumentSearchResult = {
  Symbol?: string
  symbol?: string
  Name?: string
  name?: string
}

export const searchInstrument = async (ticker: string): Promise<InstrumentSearchResult | null> => {
  const normalizedTicker = ticker.trim().toUpperCase()
  if (!normalizedTicker) return null

  const response = await fetch(
    `http://localhost:5000/api/searchInstrument/${encodeURIComponent(normalizedTicker)}`,
  )

  if (!response.ok) {
    if (response.status === 404) return null
    const payload = await response.text()
    throw new Error(payload || `Error ${response.status}`)
  }

  const payload = await response.json()

  if (Array.isArray(payload) && payload.length > 0) {
    const first = payload[0]
    if (first && typeof first === 'object') {
      const record = first as Record<string, unknown>
      const symbol =
        typeof record.Symbol === 'string'
          ? record.Symbol
          : typeof record.symbol === 'string'
            ? record.symbol
            : normalizedTicker
      const name =
        typeof record.Name === 'string'
          ? record.Name
          : typeof record.name === 'string'
            ? record.name
            : ''
      return { Symbol: symbol, Name: name }
    }
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const symbol =
      typeof record.Symbol === 'string'
        ? record.Symbol
        : typeof record.symbol === 'string'
          ? record.symbol
          : normalizedTicker
    const name =
      typeof record.Name === 'string'
        ? record.Name
        : typeof record.name === 'string'
          ? record.name
          : ''

    if (symbol || name) return { Symbol: symbol, Name: name }
  }

  return null
}

export const addTickerToPortfolio = async (name: string, ticker: string) => {
  const normalizedTicker = ticker.trim().toUpperCase()
  const currentDetail = await getPortfolioDetail(name)
  const nextTickers = Array.from(new Set([...(currentDetail.tickers ?? []), normalizedTicker]))

  const response = await fetch('http://localhost:5000/api/portfolios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      tickers: nextTickers,
    }),
  })

  if (!response.ok) {
    const payload = await response.text()
    throw new Error(payload || `Error ${response.status}`)
  }
}
