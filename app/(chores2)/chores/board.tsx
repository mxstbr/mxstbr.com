'use client'
import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Board } from 'app/lib/chores2/types'
import { KidColumn } from './kid-column'
import { useBoard } from './use-board'

class ColumnBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <section className="c2-child c2-section-error">
        <span aria-hidden="true">🌤️</span>
        <p>Let’s try this column again.</p>
        <button onClick={() => this.setState({ failed: false })}>
          Reload this column
        </button>
      </section>
    ) : (
      this.props.children
    )
  }
}
export function ChoresBoard({ initial }: { initial: Board }) {
  const { board, stale, error, pending, act, refresh, dismiss } =
    useBoard(initial)
  const [packing, setPacking] = useState(0)
  const [tab, setTab] = useState<'now' | 'rewards'>('now')
  const [asleep, setAsleep] = useState(false)
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tabIdle = useRef<ReturnType<typeof setTimeout> | null>(null)
  const imported = useRef(false)
  useEffect(() => {
    const active = () => {
      if (idle.current) clearTimeout(idle.current)
      if (tabIdle.current) clearTimeout(tabIdle.current)
      idle.current = setTimeout(() => setAsleep(true), 5 * 60000)
      tabIdle.current = setTimeout(() => setTab('now'), 90000)
    }
    window.addEventListener('pointerdown', active)
    window.addEventListener('keydown', active)
    active()
    return () => {
      if (idle.current) clearTimeout(idle.current)
      if (tabIdle.current) clearTimeout(tabIdle.current)
      window.removeEventListener('pointerdown', active)
      window.removeEventListener('keydown', active)
    }
  }, [])
  useEffect(() => {
    setTab('now')
  }, [board.day, board.period, stale])
  useEffect(() => {
    if (!asleep) return
    const root = document.documentElement
    const theme = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    )
    const previousTheme = theme?.content
    root.classList.add('c2-asleep')
    theme?.setAttribute('content', '#000000')
    return () => {
      root.classList.remove('c2-asleep')
      if (theme && previousTheme !== undefined) theme.content = previousTheme
    }
  }, [asleep])
  useEffect(() => {
    if (imported.current || board.packingImported) return
    imported.current = true
    try {
      const raw = localStorage.getItem('chores:camping-packing-checklist:v1')
      if (raw) {
        const parsed = JSON.parse(raw)
        const packed: Record<
          string,
          Record<string, boolean>
        > = Object.fromEntries(
          board.kids.map((k) => [
            k.id,
            typeof parsed?.[k.id] === 'object' && parsed[k.id]
              ? Object.fromEntries(
                  Object.entries(parsed[k.id]).filter(
                    (entry): entry is [string, boolean] =>
                      typeof entry[1] === 'boolean',
                  ),
                )
              : {},
          ]),
        )
        void act(board.kids[0].id, { action: 'import_packing', packed })
      }
    } catch {
      /* A browser without legacy packing simply starts with a blank list. */
    }
  }, [board.packingImported, board.kids, act])
  const name = board.period
    ? board.period[0].toUpperCase() + board.period.slice(1)
    : 'Right now'
  const cutoff = board.period
    ? new Date(board.boundary).toLocaleTimeString('en-US', {
        timeZone: 'America/Los_Angeles',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null
  return (
    <main className="chores2">
      <header className="c2-top">
        <div className="c2-period">
          <span className="c2-sun" aria-hidden="true">
            {board.period === 'evening' ||
            board.period === 'night' ||
            !board.period
              ? '🌙'
              : '🌞'}
          </span>
          <div>
            <h1>{name}</h1>
            <p>{cutoff ? `Until ${cutoff}` : 'Nothing timed right now'}</p>
          </div>
        </div>
        <nav className="c2-tabs" aria-label="Board views">
          <button aria-pressed={tab === 'now'} onClick={() => setTab('now')}>
            Chores
          </button>
          <button
            aria-pressed={tab === 'rewards'}
            disabled={stale}
            onClick={() => setTab('rewards')}
          >
            Rewards
          </button>
        </nav>
        <div className="c2-toolbar">
          <span className="c2-date">
            {new Date(`${board.day}T12:00:00Z`).toLocaleDateString('en-US', {
              timeZone: 'UTC',
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <button onClick={() => setPacking((n) => n + 1)}>🎒 Packing</button>
          <button
            onClick={() => window.location.reload()}
            aria-label="Refresh the board"
          >
            ↻ Refresh
          </button>
        </div>
      </header>
      {error && (
        <div className="c2-connection" role="alert">
          <span>{error}</span>
          <button onClick={() => void refresh()}>Reconnect</button>
        </div>
      )}
      <div className="c2-grid">
        {board.kids.map((kid) => (
          <ColumnBoundary key={kid.id}>
            <KidColumn
              kid={kid}
              day={board.day}
              period={board.period}
              stale={stale}
              request={pending[kid.id]}
              act={act}
              dismiss={dismiss}
              showPacking={packing}
              homeView={tab}
              onChores={() => setTab('now')}
            />
          </ColumnBoundary>
        ))}
      </div>
      {asleep && (
        <button
          className="c2-sleep"
          aria-label="Tap to wake up"
          onClick={async () => {
            await refresh()
            setAsleep(false)
          }}
        />
      )}
    </main>
  )
}
