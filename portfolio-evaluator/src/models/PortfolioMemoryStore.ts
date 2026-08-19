import type { PortfolioDetail } from '../views/PortfolioView/portfolioApi'

export type PortfolioDetailLike = Partial<PortfolioDetail> & {
  name?: string
  tickers?: string[]
  symbols?: string[]
  instruments?: unknown[]
  holdings?: unknown[]
  positions?: unknown[]
}

export class PortfolioInstrument {
  Symbol: string
  Name: string

  constructor(symbol: string, name?: string) {
    const normalizedSymbol = symbol.trim().toUpperCase()
    this.Symbol = normalizedSymbol || (name ?? '').trim().toUpperCase()
    const resolvedName = (name ?? normalizedSymbol ?? this.Symbol).trim() || this.Symbol
    this.Name = resolvedName
  }

  static fromTicker(symbol: string): PortfolioInstrument {
    return new PortfolioInstrument(symbol)
  }

  static fromUnknown(value: unknown): PortfolioInstrument | null {
    if (typeof value === 'string') {
      const symbol = value.trim()
      return symbol ? new PortfolioInstrument(symbol, symbol) : null
    }

    if (!value || typeof value !== 'object') {
      return null
    }

    const record = value as Record<string, unknown>
    const detail = record.details && typeof record.details === 'object' ? (record.details as Record<string, unknown>) : record

    const symbol =
      typeof record.Symbol === 'string' && record.Symbol.trim()
        ? record.Symbol
        : typeof record.symbol === 'string' && record.symbol.trim()
          ? record.symbol
          : typeof detail.Symbol === 'string' && detail.Symbol.trim()
            ? detail.Symbol
            : typeof detail.symbol === 'string' && detail.symbol.trim()
              ? detail.symbol
              : typeof record.ticker === 'string' && record.ticker.trim()
                ? record.ticker
                : typeof record.Ticker === 'string' && record.Ticker.trim()
                  ? record.Ticker
                  : typeof detail.ticker === 'string' && detail.ticker.trim()
                    ? detail.ticker
                    : typeof detail.Ticker === 'string' && detail.Ticker.trim()
                      ? detail.Ticker
                      : ''

    const name =
      typeof record.Name === 'string' && record.Name.trim()
        ? record.Name
        : typeof record.name === 'string' && record.name.trim()
          ? record.name
          : typeof detail.Name === 'string' && detail.Name.trim()
            ? detail.Name
            : typeof detail.name === 'string' && detail.name.trim()
              ? detail.name
              : typeof record.companyName === 'string' && record.companyName.trim()
                ? record.companyName
                : typeof detail.companyName === 'string' && detail.companyName.trim()
                  ? detail.companyName
                  : symbol

    if (!symbol.trim()) {
      return null
    }

    return new PortfolioInstrument(symbol, name)
  }

  static normalizeCollection(value: unknown): PortfolioInstrument[] {
    if (!Array.isArray(value)) {
      return []
    }

    return value
      .map((item) => PortfolioInstrument.fromUnknown(item))
      .filter((item): item is PortfolioInstrument => Boolean(item))
      .filter((item, index, array) => array.findIndex((candidate) => candidate.Symbol === item.Symbol) === index)
  }
}

export class PortfolioEntity {
  name: string
  instruments: PortfolioInstrument[]

  constructor(name: string, instruments: PortfolioInstrument[] = []) {
    this.name = name
    this.instruments = instruments
  }

  static fromDetail(detail: PortfolioDetailLike, fallbackName?: string): PortfolioEntity {
    const name = detail.name ?? fallbackName ?? 'Portfolio'
    const rawInstruments = detail.instruments ?? detail.holdings ?? detail.positions ?? []
    const instruments = [
      ...PortfolioInstrument.normalizeCollection(rawInstruments),
      ...PortfolioInstrument.normalizeCollection(detail.tickers ?? detail.symbols ?? []),
    ].filter((instrument, index, array) => array.findIndex((candidate) => candidate.Symbol === instrument.Symbol) === index)

    return new PortfolioEntity(name, instruments)
  }

  get tickers(): string[] {
    return Array.from(new Set(this.instruments.map((instrument) => instrument.Symbol).filter(Boolean)))
  }

  addInstrument(symbol: string, name?: string): void {
    const instrument = PortfolioInstrument.fromTicker(symbol)
    instrument.Name = name?.trim() || instrument.Symbol
    this.instruments = [
      ...this.instruments.filter((item) => item.Symbol !== instrument.Symbol),
      instrument,
    ]
  }

  removeInstrument(symbol: string): void {
    this.instruments = this.instruments.filter((instrument) => instrument.Symbol !== symbol)
  }

  rename(newName: string): void {
    this.name = newName.trim() || this.name
  }

  toDetail(): PortfolioDetail {
    return {
      name: this.name,
      tickers: this.tickers,
      instruments: this.instruments.map((instrument) => ({
        Symbol: instrument.Symbol,
        Name: instrument.Name,
      })),
    }
  }
}

export class PortfolioMemoryStore {
  private portfolios = new Map<string, PortfolioEntity>()
  selectedName: string | null = null

  setPortfolioNames(names: string[]): void {
    const nextNames = new Set(names)

    for (const name of [...this.portfolios.keys()]) {
      if (!nextNames.has(name)) {
        this.portfolios.delete(name)
      }
    }

    for (const name of names) {
      if (!this.portfolios.has(name)) {
        this.portfolios.set(name, new PortfolioEntity(name))
      }
    }

    if (!this.selectedName || !this.portfolios.has(this.selectedName)) {
      this.selectedName = names[0] ?? null
    }
  }

  getNames(): string[] {
    return [...this.portfolios.keys()]
  }

  getPortfolio(name: string): PortfolioEntity | null {
    return this.portfolios.get(name) ?? null
  }

  hydratePortfolio(detail: PortfolioDetailLike, fallbackName?: string): PortfolioEntity {
    const portfolioName = detail.name ?? fallbackName ?? this.selectedName ?? 'Portfolio'
    const portfolio = PortfolioEntity.fromDetail(detail, portfolioName)
    this.portfolios.set(portfolio.name, portfolio)
    this.selectedName = this.selectedName ?? portfolio.name
    return portfolio
  }

  create(name: string): PortfolioEntity {
    const normalizedName = name.trim()
    if (!normalizedName) {
      throw new Error('Portfolio name is required.')
    }

    const portfolio = this.portfolios.get(normalizedName) ?? new PortfolioEntity(normalizedName)
    this.portfolios.set(normalizedName, portfolio)
    this.selectedName = normalizedName
    return portfolio
  }

  rename(currentName: string, newName: string, remainingTickers: string[] = []): PortfolioEntity | null {
    const portfolio = this.portfolios.get(currentName)
    if (!portfolio) {
      return null
    }

    const normalizedNewName = newName.trim()
    if (!normalizedNewName) {
      throw new Error('Portfolio name is required.')
    }

    this.portfolios.delete(currentName)

    const renamedPortfolio = new PortfolioEntity(normalizedNewName, remainingTickers.map((ticker) => PortfolioInstrument.fromTicker(ticker)))
    this.portfolios.set(normalizedNewName, renamedPortfolio)

    if (this.selectedName === currentName) {
      this.selectedName = normalizedNewName
    }

    return renamedPortfolio
  }

  addInstrument(name: string, symbol: string, instrumentName?: string): PortfolioEntity | null {
    const portfolio = this.portfolios.get(name) ?? new PortfolioEntity(name)
    portfolio.addInstrument(symbol, instrumentName)
    this.portfolios.set(name, portfolio)
    this.selectedName = name
    return portfolio
  }

  removeInstrument(name: string, symbol: string): PortfolioEntity | null {
    const portfolio = this.portfolios.get(name)
    if (!portfolio) {
      return null
    }

    portfolio.removeInstrument(symbol)
    this.portfolios.set(name, portfolio)
    return portfolio
  }
}
