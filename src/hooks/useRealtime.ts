import { useEffect, useRef } from 'react'
import { getWebSocketUrl } from '../api/ws'

const RECONNECT_MS = 3000
const PING_MS = 25000

export function useRealtime(onDataChanged: () => void, enabled: boolean) {
  const callbackRef = useRef(onDataChanged)
  callbackRef.current = onDataChanged

  useEffect(() => {
    if (!enabled) return

    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let pingTimer: ReturnType<typeof setInterval> | null = null
    let closed = false

    const clearTimers = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (pingTimer) clearInterval(pingTimer)
      reconnectTimer = null
      pingTimer = null
    }

    const scheduleReconnect = () => {
      if (closed) return
      reconnectTimer = setTimeout(connect, RECONNECT_MS)
    }

    const connect = () => {
      const url = getWebSocketUrl()
      if (!url) return

      ws = new WebSocket(url)

      ws.onopen = () => {
        pingTimer = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) ws.send('ping')
        }, PING_MS)
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { type?: string }
          if (msg.type === 'data_changed') callbackRef.current()
        } catch {
          // ignore non-json
        }
      }

      ws.onclose = () => {
        clearTimers()
        scheduleReconnect()
      }

      ws.onerror = () => ws?.close()
    }

    connect()

    return () => {
      closed = true
      clearTimers()
      ws?.close()
    }
  }, [enabled])
}
