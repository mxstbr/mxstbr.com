'use client'

import { type CSSProperties, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Chore, Completion, Kid } from './data'
import { completeChore, setKidColor, skipChore, undoChore } from './actions'
import { sortByTimeOfDay, starsForKid, withAlpha } from './utils'

type Column = {
  kid: Kid
  chores: Chore[]
  done: { chore: Chore; completionId: string }[]
}

type KidBoardProps = {
  columns: Column[]
  completions: Completion[]
  mode: 'today' | 'past' | 'future'
  dayLabel: string
  todayHref: string
}

type PendingCompletion = {
  chore: Chore
  kidId: string
  accent: string
}

export function KidBoard({ columns, completions, mode, dayLabel, todayHref }: KidBoardProps) {
  const router = useRouter()
  const initialTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const column of columns) {
      totals[column.kid.id] = starsForKid(completions, column.kid.id)
    }
    return totals
  }, [columns, completions])

  const [totals, setTotals] = useState(initialTotals)
  const [pending, setPending] = useState<PendingCompletion | null>(null)

  useEffect(() => {
    setTotals(initialTotals)
  }, [initialTotals])

  useEffect(() => {
    const refresh = () => router.refresh()
    const id = window.setInterval(refresh, 60_000)
    return () => window.clearInterval(id)
  }, [router])

  useEffect(() => {
    if (mode === 'today') return

    let timer: number
    const reset = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        router.replace(todayHref)
      }, 30_000)
    }

    reset()
    const events = ['click', 'keydown', 'pointermove', 'touchstart']
    events.forEach((event) => window.addEventListener(event, reset, { passive: true }))

    return () => {
      window.clearTimeout(timer)
      events.forEach((event) => window.removeEventListener(event, reset))
    }
  }, [mode, todayHref, router])

  const handleComplete = async (
    chore: Chore,
    kidId: string,
    accent: string,
  ) => {
    const formData = new FormData()
    formData.append('choreId', chore.id)
    formData.append('kidId', kidId)
    const result = await completeChore(formData)

    if (result?.awarded && result.awarded > 0) {
      setTotals((prev) => ({
        ...prev,
        [kidId]: (prev[kidId] ?? 0) + result.awarded,
      }))
      fireConfetti(accent)
    }

    router.refresh()
    if (chore.type === 'perpetual') {
      setTimeout(() => router.refresh(), 5200)
    }
  }

  const handleCompleteRequest = (chore: Chore, kidId: string, accent: string) => {
    if (mode === 'future') return
    if (mode === 'past') {
      setPending({ chore, kidId, accent })
      return
    }
    void handleComplete(chore, kidId, accent)
  }

  const handleUndo = async (
    chore: Chore,
    completionId: string,
    kidId: string,
  ) => {
    const formData = new FormData()
    formData.append('choreId', chore.id)
    formData.append('kidId', kidId)
    formData.append('completionId', completionId)
    const result = await undoChore(formData)

    if (typeof result?.delta === 'number' && result.delta !== 0) {
      setTotals((prev) => ({
        ...prev,
        [kidId]: (prev[kidId] ?? 0) + result.delta,
      }))
    }

    router.refresh()
  }

  return (
    <div className="full-bleed">
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 md:px-4">
        {columns.map((column) => (
          <KidColumn
            key={column.kid.id}
            kid={column.kid}
            chores={sortByTimeOfDay(column.chores)}
            doneChores={column.done}
            starTotal={totals[column.kid.id] ?? 0}
            onComplete={handleCompleteRequest}
            onUndo={handleUndo}
            disableCompletion={mode === 'future'}
          />
        ))}
      </div>
      {pending ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Editing a past day
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  You&apos;re viewing {dayLabel}. Go to today to record chores, or complete this task for {dayLabel}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPending(null)}
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Link
                href={todayHref}
                className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Go to today
              </Link>
              <button
                type="button"
                onClick={() => {
                  void handleComplete(pending.chore, pending.kidId, pending.accent)
                  setPending(null)
                }}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-100"
              >
                Complete for {dayLabel}
              </button>
              <button
                type="button"
                onClick={() => setPending(null)}
                className="inline-flex items-center justify-center rounded-md border border-transparent px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function KidColumn({
  kid,
  chores,
  doneChores,
  starTotal,
  onComplete,
  onUndo,
  disableCompletion,
}: {
  kid: Kid
  chores: Chore[]
  doneChores: { chore: Chore; completionId: string }[]
  starTotal: number
  onComplete: (chore: Chore, kidId: string, accent: string) => Promise<void> | void
  onUndo: (chore: Chore, completionId: string, kidId: string) => Promise<void> | void
  disableCompletion: boolean
}) {
  const accent = kid.color ?? '#0ea5e9'
  const accentSoft = withAlpha(accent, 0.12)

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900"
      style={{
        borderColor: accent,
        backgroundColor: accentSoft,
        boxShadow: `0 14px 40px -22px ${accentSoft}, inset 0 1px 0 ${accentSoft}`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {kid.name}
        </div>
        <div className="flex items-center gap-2">
          <StarBadge value={starTotal} accent={accent} />
          <form action={setKidColor} className="flex items-center gap-1">
            <input type="hidden" name="kidId" value={kid.id} />
            <input
              type="color"
              name="color"
              defaultValue={kid.color}
              className="h-9 w-9 cursor-pointer rounded-md border border-slate-300 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800"
              aria-label={`${kid.name} color`}
            />
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
            >
              Set
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-3">
        {chores.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            All clear! Come back when something new pops up.
          </div>
        ) : (
          chores.map((chore) => (
            <ChoreButton
              key={chore.id}
              chore={chore}
              accent={accent}
              kidId={kid.id}
              onComplete={onComplete}
              disabled={disableCompletion}
            />
          ))
        )}
      </div>

      {doneChores.length ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Done today
          </div>
          <div className="space-y-2">
            {doneChores.map((entry) => (
              <CompletedChoreButton
                key={`${entry.chore.id}-${entry.completionId}`}
                chore={entry.chore}
                completionId={entry.completionId}
                accent={accent}
                kidId={kid.id}
                onUndo={onUndo}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function StarBadge({ value, accent }: { value: number; accent: string }) {
  const accentSoft = withAlpha(accent, 0.18)

  return (
    <div
      className="flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold shadow-sm"
      style={{ backgroundColor: accentSoft, color: accent }}
    >
      ⭐️ <AnimatedCount value={value} accent={accent} />
    </div>
  )
}

function AnimatedCount({ value, accent }: { value: number; accent: string }) {
  const [displayValue, setDisplayValue] = useState(value)
  const [range, setRange] = useState<[number, number] | null>(null)
  const previous = useRef(value)

  useEffect(() => {
    if (value === previous.current) return

    const from = previous.current
    const to = value
    setRange([from, to])
    const duration = 800
    const start = performance.now()
    let raf: number

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(from + (to - from) * eased))
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        previous.current = value
        setRange(null)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return (
    <div className="flex flex-col items-start leading-tight">
      <span className="tabular-nums text-base">{displayValue}</span>
      {range ? (
        <span
          className="text-[10px] font-medium uppercase tracking-wide text-slate-600"
          style={{ color: accent }}
        >
          {range[0]} → {range[1]}
        </span>
      ) : null}
    </div>
  )
}

function ChoreButton({
  chore,
  accent,
  onComplete,
  kidId,
  disabled = false,
}: {
  chore: Chore
  accent: string
  kidId: string
  onComplete: (chore: Chore, kidId: string, accent: string) => Promise<void> | void
  disabled?: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const accentSoft = withAlpha(accent, 0.12)
  const accentVars = {
    '--accent': accent,
    '--accent-soft': accentSoft,
  } as CSSProperties
  const completionDisabled = isPending || disabled

  const handleSpeak = async () => {
    if (isSpeaking) return
    try {
      setIsSpeaking(true)
      audioRef.current?.pause()
      const response = await fetch('/api/chores/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chore.title }),
      })
      if (!response.ok) throw new Error(`TTS failed: ${response.status}`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        URL.revokeObjectURL(url)
        setIsSpeaking(false)
      }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        setIsSpeaking(false)
      }
      await audio.play()
    } catch (error) {
      console.error('Failed to play chore audio', error)
      setIsSpeaking(false)
    }
  }

  return (
    <div className="flex items-stretch gap-2" style={accentVars}>
      <button
        type="button"
        onClick={() =>
          startTransition(() => {
            if (completionDisabled) return
            void onComplete(chore, kidId, accent)
          })
        }
        className="group flex w-full items-center gap-4 rounded-xl border-2 border-slate-200 bg-white px-4 py-4 text-left text-slate-900 shadow transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:translate-y-0 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:hover:border-[var(--accent)] dark:hover:bg-[var(--accent-soft)] dark:focus-visible:outline-[var(--accent)]"
        disabled={completionDisabled}
        aria-label={`Mark "${chore.title}" as done`}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-slate-300 bg-slate-50 text-lg font-semibold text-slate-700 transition group-hover:border-[var(--accent)] group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--accent)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:group-hover:border-[var(--accent)] dark:group-hover:bg-[var(--accent-soft)] dark:group-hover:text-[var(--accent)]">
          {isPending ? '…' : ''}
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="text-3xl leading-none">{chore.emoji}</span>
          <div className="min-w-0">
            <div className="text-lg font-semibold leading-tight">{chore.title}</div>
          </div>
        </div>
        <div className="flex flex-col items-end justify-center text-sm font-semibold text-amber-700 dark:text-amber-200">
          <span className="leading-tight text-xl">+{chore.stars}</span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-300">
            stars
          </span>
        </div>
      </button>
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-full min-w-[52px] items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-3 text-lg transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:translate-y-0 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:hover:border-[var(--accent)] dark:hover:bg-[var(--accent-soft)] dark:focus-visible:outline-[var(--accent)]"
          style={
            {
              '--accent': accent,
              '--accent-soft': accentSoft,
            } as CSSProperties
          }
          aria-expanded={menuOpen}
          aria-label="More actions"
        >
          ⋯
        </button>
        {menuOpen ? (
          <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-800 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700"
              onClick={() => {
                setMenuOpen(false)
                void handleSpeak()
              }}
              disabled={isSpeaking}
            >
              <span className="text-lg">🔊</span>
              <span>Read task</span>
              {isSpeaking ? <span className="ml-auto text-xs text-slate-500">…</span> : null}
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-800 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700"
              onClick={() => {
                if (isSkipping) return
                setIsSkipping(true)
                setMenuOpen(false)
                const formData = new FormData()
                formData.append('choreId', chore.id)
                startTransition(() => {
                  void skipChore(formData).finally(() => {
                    setIsSkipping(false)
                    setTimeout(() => router.refresh(), 50)
                  })
                })
              }}
              disabled={isSkipping}
            >
              <span className="text-lg">⏭️</span>
              <span>Skip task</span>
              {isSkipping ? <span className="ml-auto text-xs text-slate-500">…</span> : null}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function CompletedChoreButton({
  chore,
  completionId,
  accent,
  kidId,
  onUndo,
}: {
  chore: Chore
  completionId: string
  accent: string
  kidId: string
  onUndo: (
    chore: Chore,
    completionId: string,
    kidId: string,
  ) => Promise<void> | void
}) {
  const [isPending, startTransition] = useTransition()
  const accentSoft = withAlpha(accent, 0.18)

  return (
    <div className="flex items-stretch gap-2">
      <button
        type="button"
        onClick={() =>
          startTransition(() => {
            void onUndo(chore, completionId, kidId)
          })
        }
        className="group flex w-full items-center gap-4 rounded-xl border-2 border-emerald-400 bg-white px-4 py-3 pr-14 text-left text-slate-900 shadow transition hover:-translate-y-0.5 hover:border-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 active:translate-y-0 disabled:opacity-60 dark:border-emerald-500/60 dark:bg-slate-800 dark:text-slate-50"
        disabled={isPending}
      >
        <span
          className="flex h-10 w-10 items-center justify-center rounded-lg border-2 text-lg font-semibold text-emerald-700 transition group-hover:-translate-y-0.5 dark:text-emerald-200"
          style={{
            borderColor: accent,
            backgroundColor: accentSoft,
            color: accent,
          }}
        >
          ✓
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="text-2xl leading-none">{chore.emoji}</span>
          <div className="min-w-0">
            <div className="text-base font-semibold leading-tight line-through">
              {chore.title}
            </div>
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-200">
              Marked done
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:bg-emerald-900/40 dark:text-emerald-100">
            +{chore.stars} ⭐️
          </div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Undo
          </div>
        </div>
      </button>
      <SpeakIconButton text={chore.title} accent={accent} />
    </div>
  )
}

function SpeakIconButton({ text, accent }: { text: string; accent: string }) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const accentSoft = withAlpha(accent, 0.16)

  return (
    <button
      type="button"
      onClick={async (event) => {
        event.stopPropagation()
        if (isSpeaking) return

        try {
          setIsSpeaking(true)
          audioRef.current?.pause()
          const response = await fetch('/api/chores/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
          })
          if (!response.ok) throw new Error(`TTS failed with status ${response.status}`)
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audioRef.current = audio
          audio.onended = () => {
            URL.revokeObjectURL(url)
            setIsSpeaking(false)
          }
          audio.onerror = () => {
            URL.revokeObjectURL(url)
            setIsSpeaking(false)
          }
          await audio.play()
        } catch (error) {
          console.error('Failed to play chore audio', error)
          setIsSpeaking(false)
        }
      }}
      className="flex h-full min-w-[52px] items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-3 text-lg transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:translate-y-0 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:hover:border-[var(--accent)] dark:hover:bg-[var(--accent-soft)] dark:focus-visible:outline-[var(--accent)]"
      style={
        {
          '--accent': accent,
          '--accent-soft': accentSoft,
        } as CSSProperties
      }
      aria-label={`Play "${text}"`}
      disabled={isSpeaking}
    >
      {isSpeaking ? '…' : '🔊'}
    </button>
  )
}

function fireConfetti(accent: string) {
  ensureConfettiStyles()
  const container = document.createElement('div')
  container.className = 'chores-confetti'
  container.style.position = 'fixed'
  container.style.inset = '0'
  container.style.pointerEvents = 'none'
  container.style.zIndex = '50'
  document.body.appendChild(container)

  const colors = [accent, '#f97316', '#22c55e', '#06b6d4', '#f472b6']
  const pieces = 80

  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('span')
    const size = 6 + Math.random() * 6
    piece.style.position = 'absolute'
    piece.style.width = `${size}px`
    piece.style.height = `${size * 0.6}px`
    piece.style.backgroundColor = colors[i % colors.length]
    piece.style.left = `${Math.random() * 100}%`
    piece.style.top = `-10%`
    piece.style.opacity = '0.9'
    piece.style.borderRadius = '2px'
    const fall = 900 + Math.random() * 700
    const drift = Math.random() * 40 - 20
    const delay = Math.random() * 150
    const rotation = 540 + Math.random() * 540
    piece.style.animation = `chores-confetti-fall ${fall}ms ease-out ${delay}ms forwards`
    piece.style.setProperty('--drift', `${drift}px`)
    piece.style.setProperty('--rotation', `${rotation}deg`)
    container.appendChild(piece)
  }

  setTimeout(() => {
    container.remove()
  }, 1800)
}

function ensureConfettiStyles() {
  const id = 'chores-confetti-styles'
  if (document.getElementById(id)) return

  const style = document.createElement('style')
  style.id = id
  style.textContent = `
    @keyframes chores-confetti-fall {
      0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0.9; }
      100% { transform: translate3d(var(--drift, 0px), 110vh, 0) rotate(var(--rotation, 720deg)); opacity: 0; }
    }
  `
  document.head.appendChild(style)
}
