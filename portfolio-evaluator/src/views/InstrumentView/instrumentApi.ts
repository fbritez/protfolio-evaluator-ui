import { getPortfolioDetail } from '../PortfolioView/portfolioApi'

export type InstrumentSearchResult = {
  Symbol?: string
  symbol?: string
  Name?: string
  name?: string
}

const hasMeaningfulValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.some((item) => hasMeaningfulValue(item))
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some((item) => hasMeaningfulValue(item))
  }
  return false
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

  const normalizeRecord = (record: Record<string, unknown>): InstrumentSearchResult | null => {
    const actualSymbol =
      typeof record.Symbol === 'string' && record.Symbol.trim()
        ? record.Symbol
        : typeof record.symbol === 'string' && record.symbol.trim()
          ? record.symbol
          : null

    const actualName =
      typeof record.Name === 'string' && record.Name.trim()
        ? record.Name
        : typeof record.name === 'string' && record.name.trim()
          ? record.name
          : null

    const hasAnyMeaningfulValue = Object.values(record).some((value) => hasMeaningfulValue(value))

    if (!actualSymbol || !actualName || (!actualName && !hasAnyMeaningfulValue)) {
      return null
    }

    return {
      Symbol: actualSymbol,
      Name: actualName,
    }
  }

  if (Array.isArray(payload) && payload.length > 0) {
    const first = payload[0]
    if (first && typeof first === 'object') {
      const result = normalizeRecord(first as Record<string, unknown>)
      return result
    }
  }

  if (payload && typeof payload === 'object') {
    const result = normalizeRecord(payload as Record<string, unknown>)
    return result
  }

  return null
}

export const addInstrumentToPortfolio = async (name: string, instrument: string) => {
  const normalizedInstrument = instrument.trim().toUpperCase()
  const currentDetail = await getPortfolioDetail(name)
  const nextTickers = Array.from(new Set([...(currentDetail.tickers ?? []), normalizedInstrument]))

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
