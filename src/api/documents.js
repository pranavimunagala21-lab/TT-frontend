import { API_BASE_URL, tokenStore } from './client'

export async function downloadDocument(id, filename = 'document') {
  const response = await fetch(`${API_BASE_URL}/api/documents/${encodeURIComponent(id)}/download`, {
    headers: tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : {},
  })
  if (response.status === 401) {
    tokenStore.clear()
    window.dispatchEvent(new Event('campussphere:unauthorized'))
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message || body?.error || `Download failed (${response.status})`)
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename || 'document'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
