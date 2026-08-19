export type PortfolioDetail = {
  name?: string
  tickers?: string[]
  symbols?: string[]
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
  const tickers = extractTickers(payload)

  return {
    ...detail,
    name: detail.name ?? name,
    tickers: detail.tickers ?? tickers,
  }
}

export const addTickerToPortfolio = async (name: string, ticker: string) => {
  const currentDetail = await getPortfolioDetail(name)
  const nextTickers = Array.from(new Set([...(currentDetail.tickers ?? []), ticker]))

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
