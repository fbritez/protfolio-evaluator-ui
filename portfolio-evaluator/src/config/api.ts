const fallbackApiBaseUrl = 'http://localhost:5000'

export const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL ?? fallbackApiBaseUrl) || fallbackApiBaseUrl
).replace(/\/$/, '')

export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}
