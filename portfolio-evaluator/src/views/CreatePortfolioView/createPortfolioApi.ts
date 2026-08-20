import { buildApiUrl } from '../../config/api'

export const createPortfolio = async (name: string) => {
  const response = await fetch(buildApiUrl(`/api/portfolios/empty/${encodeURIComponent(name)}`), {
    method: 'POST',
  })

  if (!response.ok) {
    const payload = await response.text()
    throw new Error(payload || `Error ${response.status}`)
  }
}
