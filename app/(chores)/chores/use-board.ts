'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Board, CommandResult } from 'app/lib/chores/types'
import type { Command } from 'app/lib/chores/commands'

class BoardReloadRequired extends Error {}
const reconnectMessage = 'Reconnecting… Your chores will return automatically.'
const reloadKey = 'chores:last-automatic-reload'

async function readJson(response: Response) {
  if (
    response.status === 404 ||
    response.status === 410 ||
    !response.headers.get('content-type')?.includes('application/json')
  )
    throw new BoardReloadRequired(reconnectMessage)
  try {
    return await response.json()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error
    throw new BoardReloadRequired(reconnectMessage)
  }
}

export type PendingAction = {
  command: Command
  requestId: string
  error?: string
  busy: boolean
  retryable?: boolean
}
export function requestId() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')
}
export function useBoard(initial: Board, version: string) {
  const [board, setBoard] = useState(initial)
  const boardRef = useRef(initial)
  const [stale, setStale] = useState(true)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<
    Record<string, PendingAction | undefined>
  >({})
  const pendingRef = useRef<Record<string, PendingAction | undefined>>({})
  const refreshing = useRef<AbortController | null>(null)
  const needsReload = useRef(false)
  const reloading = useRef(false)
  const received = useRef(0)
  const recoverApp = useCallback(() => {
    needsReload.current = true
    setStale(true)
    // An uncertain write owns its request ID until it is retried/resolved.
    // Reloading here would discard it, potentially submitting the chore twice.
    if (Object.values(pendingRef.current).some(Boolean)) {
      setError(
        'An update is ready. Finish or retry your last save to reconnect.',
      )
      return
    }
    setError(reconnectMessage)
    if (reloading.current || !navigator.onLine || document.hidden) return
    try {
      const last = sessionStorage.getItem(reloadKey)
      if (last && Date.now() - Number(last) < 5 * 60000) return
      sessionStorage.setItem(reloadKey, String(Date.now()))
    } catch {
      // Without a persistent guard, a broken deployment could reload forever.
      setError('Please tap Refresh to reconnect.')
      return
    }
    reloading.current = true
    window.location.reload()
  }, [])
  const apply = useCallback((next: Board, startedAt: number) => {
    if (
      next.revision < boardRef.current.revision ||
      next.serverNow < boardRef.current.serverNow
    )
      return
    // Count the entire network round trip against the window. An old response
    // must never extend a deadline or expose an elapsed period after waking.
    boardRef.current = next
    received.current = startedAt
    setBoard(next)
    setStale(
      Date.parse(next.boundary) - Date.parse(next.serverNow) <=
        performance.now() - startedAt,
    )
    setError('')
  }, [])
  const refresh = useCallback(
    async (restart = false) => {
      if (reloading.current) return
      if (refreshing.current) {
        if (!restart) return
        refreshing.current.abort()
      }
      const controller = new AbortController()
      refreshing.current = controller
      const timeout = setTimeout(() => controller.abort(), 10000)
      const startedAt = performance.now()
      try {
        const r = await fetch('/api/chores/board', {
          cache: 'no-store',
          signal: controller.signal,
        })
        const currentVersion = r.headers.get('X-Chores-Version')
        if (currentVersion && currentVersion !== version)
          throw new BoardReloadRequired(reconnectMessage)
        const data = await readJson(r)
        if (refreshing.current !== controller) return
        if (!r.ok) throw new Error(data.error?.message || 'Could not refresh.')
        needsReload.current = false
        apply(data, startedAt)
      } catch (e) {
        if (refreshing.current !== controller) return
        setStale(true)
        if (e instanceof BoardReloadRequired) recoverApp()
        else setError(reconnectMessage)
      } finally {
        clearTimeout(timeout)
        if (refreshing.current === controller) refreshing.current = null
      }
    },
    [apply, recoverApp, version],
  )
  useEffect(() => {
    received.current = performance.now()
    void refresh()
    const wake = () => {
      if (!document.hidden) {
        setStale(true)
        void refresh(true)
      }
    }
    const offline = () => {
      setStale(true)
      setError('You’re offline. Reconnect to save your chores.')
    }
    window.addEventListener('focus', wake)
    window.addEventListener('pageshow', wake)
    window.addEventListener('online', wake)
    window.addEventListener('offline', offline)
    document.addEventListener('visibilitychange', wake)
    const timer = setInterval(() => {
      if (!document.hidden) void refresh()
    }, 15000)
    return () => {
      clearInterval(timer)
      const current = refreshing.current
      refreshing.current = null
      current?.abort()
      window.removeEventListener('focus', wake)
      window.removeEventListener('pageshow', wake)
      window.removeEventListener('online', wake)
      window.removeEventListener('offline', offline)
      document.removeEventListener('visibilitychange', wake)
    }
  }, [refresh])
  useEffect(() => {
    const remaining =
      Date.parse(board.boundary) -
      Date.parse(board.serverNow) -
      (performance.now() - received.current)
    const timer = setTimeout(
      () => {
        setStale(true)
        void refresh()
      },
      Math.max(100, remaining),
    )
    return () => clearTimeout(timer)
  }, [board.boundary, board.serverNow, refresh])
  const act = useCallback(
    async (
      kidId: string,
      command: Command,
      retry = false,
    ): Promise<CommandResult | null> => {
      if (pendingRef.current[kidId]?.busy) return null
      const previous = pendingRef.current[kidId]
      if (previous?.error && !retry) return null
      const item: PendingAction =
        retry && previous
          ? { ...previous, busy: true, error: undefined }
          : { command, requestId: requestId(), busy: true }
      pendingRef.current[kidId] = item
      setPending({ ...pendingRef.current })
      let retryable = true
      const startedAt = performance.now()
      try {
        const r = await fetch('/api/chores/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command: item.command,
            requestId: item.requestId,
          }),
        })
        const data = await readJson(r)
        if (!r.ok) {
          retryable = r.status >= 500 || r.status === 409
          if (
            [
              'WINDOW_CLOSED',
              'UNAVAILABLE',
              'OCCURRENCE_NOT_FOUND',
              'REFRESH_REQUIRED',
              'PRICE_CHANGED',
            ].includes(data.error?.code)
          ) {
            setStale(true)
            void refresh()
          }
          throw new Error(data.error?.message || 'Could not save that yet.')
        }
        apply(data.board, startedAt)
        delete pendingRef.current[kidId]
        setPending({ ...pendingRef.current })
        if (needsReload.current) void refresh()
        return data.result
      } catch (e) {
        pendingRef.current[kidId] = {
          ...item,
          busy: false,
          retryable,
          error: e instanceof Error ? e.message : 'Could not save that yet.',
        }
        setPending({ ...pendingRef.current })
        return null
      }
    },
    [apply, refresh],
  )
  const dismiss = useCallback(
    (kidId: string) => {
      if (pendingRef.current[kidId]?.retryable === false) {
        delete pendingRef.current[kidId]
        setPending({ ...pendingRef.current })
        void refresh()
      }
    },
    [refresh],
  )
  return { board, stale, error, pending, act, refresh, dismiss }
}
