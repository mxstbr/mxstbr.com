'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Board, CommandResult } from 'app/lib/chores2/types'
import type { Command } from 'app/lib/chores2/commands'

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
export function useBoard(initial: Board) {
  const [board, setBoard] = useState(initial)
  const boardRef = useRef(initial)
  const [stale, setStale] = useState(true)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<
    Record<string, PendingAction | undefined>
  >({})
  const pendingRef = useRef<Record<string, PendingAction | undefined>>({})
  const refreshing = useRef(false)
  const received = useRef(0)
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
  const refresh = useCallback(async () => {
    if (refreshing.current) return
    refreshing.current = true
    const startedAt = performance.now()
    try {
      const r = await fetch('/api/chores2/board', { cache: 'no-store' })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error?.message || 'Could not refresh.')
      apply(data, startedAt)
    } catch (e) {
      setStale(true)
      setError(e instanceof Error ? e.message : 'Reconnecting…')
    } finally {
      refreshing.current = false
    }
  }, [apply])
  useEffect(() => {
    received.current = performance.now()
    void refresh()
    const wake = () => {
      if (!document.hidden) {
        setStale(true)
        void refresh()
      }
    }
    const offline = () => {
      setStale(true)
      setError('You’re offline. Reconnect to save your chores.')
    }
    window.addEventListener('focus', wake)
    window.addEventListener('online', wake)
    window.addEventListener('offline', offline)
    document.addEventListener('visibilitychange', wake)
    const timer = setInterval(() => {
      if (!document.hidden) void refresh()
    }, 15000)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', wake)
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
        const r = await fetch('/api/chores2/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command: item.command,
            requestId: item.requestId,
          }),
        })
        const data = await r.json()
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
