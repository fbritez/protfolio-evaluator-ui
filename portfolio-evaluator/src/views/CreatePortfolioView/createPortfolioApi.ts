export const createPortfolio = async (name: string) => {
  const response = await fetch(`http://localhost:5000/api/portfolios/empty/${encodeURIComponent(name)}`, {
    method: 'POST',
  })

  if (!response.ok) {
    const payload = await response.text()
    throw new Error(payload || `Error ${response.status}`)
  }
}
