export const renamePortfolio = async (currentName: string, newName: string): Promise<void> => {
  const trimmedCurrentName = currentName.trim()
  const trimmedNewName = newName.trim()

  if (!trimmedCurrentName) {
    throw new Error('Current portfolio name is required.')
  }

  if (!trimmedNewName) {
    throw new Error('Portfolio name is required.')
  }

  const candidateRequests = [
    {
      method: 'PUT',
      url: `http://localhost:5000/api/portfolios/${encodeURIComponent(trimmedCurrentName)}`,
      body: JSON.stringify({ name: trimmedNewName }),
    },
    {
      method: 'PATCH',
      url: `http://localhost:5000/api/portfolios/${encodeURIComponent(trimmedCurrentName)}`,
      body: JSON.stringify({ name: trimmedNewName }),
    },
    {
      method: 'POST',
      url: 'http://localhost:5000/api/portfolios/rename',
      body: JSON.stringify({ currentName: trimmedCurrentName, newName: trimmedNewName }),
    },
    {
      method: 'PUT',
      url: 'http://localhost:5000/api/portfolios',
      body: JSON.stringify({ currentName: trimmedCurrentName, newName: trimmedNewName }),
    },
  ]

  let lastError: Error | null = null

  for (const request of candidateRequests) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: request.body,
      })

      if (!response.ok) {
        const payload = await response.text()
        throw new Error(payload || `Error ${response.status}`)
      }

      return
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Could not rename the portfolio.')
    }
  }

  throw lastError ?? new Error('Could not rename the portfolio.')
}
