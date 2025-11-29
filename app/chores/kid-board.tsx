'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Chore, Completion, Kid } from './data'
import { completeChore, setKidColor, undoChore } from './actions'
import { sortByTimeOfDay, starsForKid, withAlpha } from './utils'

type Column = {
  kid: Kid
  chores: Chore[]
  done: { chore: Chore; completionId: string }[]
}

type KidBoardProps = {
  columns: Column[]
  completions: Completion[]
}

export function KidBoard({ columns, completions }: KidBoardProps) {
  const router = useRouter()
  const initialTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const column of columns) {
      totals[column.kid.id] = starsForKid(completions, column.kid.id)
    }
    return totals
  }, [columns, completions])

  const [totals, setTotals] = useState(initialTotals)

  useEffect(() => {
    setTotals(initialTotals)
  }, [initialTotals])

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
            onComplete={handleComplete}
            onUndo={handleUndo}
          />
        ))}
      </div>
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
}: {
  kid: Kid
  chores: Chore[]
  doneChores: { chore: Chore; completionId: string }[]
  starTotal: number
  onComplete: (chore: Chore, kidId: string, accent: string) => void
  onUndo: (chore: Chore, completionId: string, kidId: string) => void
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
}: {
  chore: Chore
  accent: string
  kidId: string
  onComplete: (chore: Chore, kidId: string, accent: string) => Promise<void>
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(() => {
          void onComplete(chore, kidId, accent)
        })
      }
      className="group flex w-full items-center gap-4 rounded-xl border-2 border-slate-200 bg-white px-4 py-4 text-left text-slate-900 shadow transition hover:-translate-y-0.5 hover:border-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 active:translate-y-0 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
      disabled={isPending}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-slate-300 bg-slate-50 text-lg font-semibold text-slate-700 transition group-hover:border-emerald-500 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:group-hover:border-emerald-400 dark:group-hover:bg-emerald-900/40">
        {isPending ? '…' : ''}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="text-3xl leading-none">{chore.emoji}</span>
        <div className="min-w-0">
          <div className="text-lg font-semibold leading-tight">
            {chore.title}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end justify-center text-sm font-semibold text-amber-700 dark:text-amber-200">
        <span className="leading-tight text-xl">+{chore.stars}</span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-300">
          stars
        </span>
      </div>
    </button>
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
    <button
      type="button"
      onClick={() =>
        startTransition(() => {
          void onUndo(chore, completionId, kidId)
        })
      }
      className="group flex w-full items-center gap-4 rounded-xl border-2 border-emerald-400 bg-white px-4 py-3 text-left text-slate-900 shadow transition hover:-translate-y-0.5 hover:border-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 active:translate-y-0 disabled:opacity-60 dark:border-emerald-500/60 dark:bg-slate-800 dark:text-slate-50"
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
