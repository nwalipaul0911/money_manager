import { getToken } from '../api/client'

export function getWebSocketUrl(): string | null {
  const token = getToken()
  if (!token) return null

  const apiBase = import.meta.env.VITE_API_URL ?? '/api'
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    const url = new URL(apiBase)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = `${url.pathname.replace(/\/$/, '')}/ws`
    url.search = `token=${encodeURIComponent(token)}`
    return url.toString()
  }

  const path = `${apiBase.replace(/\/$/, '')}/ws`
  return `${proto}//${window.location.host}${path}?token=${encodeURIComponent(token)}`
}
