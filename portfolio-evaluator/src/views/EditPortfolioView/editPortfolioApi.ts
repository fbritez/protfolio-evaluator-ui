export const renamePortfolio = async (
  currentName: string,
  newName: string,
  remainingTickers: string[] = [],
): Promise<void> => {
  const trimmedCurrentName = currentName.trim()
  const trimmedNewName = newName.trim()

  if (!trimmedCurrentName) {
    throw new Error('Current portfolio name is required.')
  }

  if (!trimmedNewName) {
    throw new Error('Portfolio name is required.')
  }

  const payload = {
    currentName: trimmedCurrentName,
    name: trimmedNewName,
    tickers: Array.from(new Set(remainingTickers.map((ticker) => ticker.trim()).filter(Boolean))),
  }

  const response = await fetch('http://localhost:5000/api/portfolios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorPayload = await response.text()
    throw new Error(errorPayload || `Error ${response.status}`)
  }
}
