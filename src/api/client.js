const configuredBase = import.meta.env.VITE_API_BASE_URL
if (!configuredBase && !import.meta.env.DEV) {
  throw new Error('VITE_API_BASE_URL must be configured for a production build.')
}
const apiBase = configuredBase || 'http://localhost:8084'
export const API_BASE_URL = apiBase.replace(/\/+$/, '')
const TOKEN_KEY = 'campussphere.token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = tokenStore.get()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error(`Could not reach CampusSphere at ${API_BASE_URL}. Check that the backend is running.`)
  }
  if (response.status === 401 && !path.startsWith('/api/auth/login') && !path.startsWith('/api/auth/register')) {
    tokenStore.clear()
    window.dispatchEvent(new Event('campussphere:unauthorized'))
  }
  if (response.status === 204) return null
  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : await response.text().catch(() => '')
  if (!response.ok) {
    const message = payload && typeof payload === 'object'
      ? payload.message || payload.error || payload.details
      : payload
    throw new Error(message || `Request failed (${response.status})`)
  }
  return payload
}

export const api = {
  get: (path, options = {}) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options = {}) => apiRequest(path, { ...options, method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  patch: (path, body, options = {}) => apiRequest(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path, options = {}) => apiRequest(path, { ...options, method: 'DELETE' }),
}

export function getPageItems(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.content)) return payload.content
  if (Array.isArray(payload?.items)) return payload.items
  return []
}
