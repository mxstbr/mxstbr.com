'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { Kid } from './data'
import { withAlpha } from './utils'

type PackingItem = {
  id: string
  title: string
  emoji: string
}

type PackingState = Record<string, Record<string, boolean>>

const STORAGE_KEY = 'chores:camping-packing-checklist:v1'

const PACKING_ITEMS: PackingItem[] = [
  { id: 'pillow', title: 'Pillow', emoji: '🛏️' },
  { id: 'kindle', title: 'Kindle', emoji: '📖' },
  { id: 'headphones', title: 'Headphones', emoji: '🎧' },
  { id: 'underwear', title: '6x pairs of underwear', emoji: '🩲' },
  { id: 'long-sleeved-shirts', title: '6x long-sleeved shirts', emoji: '👕' },
  { id: 'long-pants', title: 'Long pants', emoji: '👖' },
  { id: 'socks', title: '6x socks', emoji: '🧦' },
  { id: 'crocs', title: 'Crocs', emoji: '🩴' },
  { id: 'sneakers', title: 'Sneakers', emoji: '👟' },
  { id: 'bike-helmet', title: 'Bike helmet', emoji: '⛑️' },
  { id: 'hat', title: 'Hat', emoji: '🧢' },
  { id: 'sweater', title: 'Sweater', emoji: '🧥' },
  { id: 'jacket', title: 'Jacket', emoji: '🌧️' },
]

const itemIds = new Set(PACKING_ITEMS.map((item) => item.id))

function emptyStateForKids(kids: Kid[]): PackingState {
  return Object.fromEntries(kids.map((kid) => [kid.id, {}]))
}

function sanitizeState(value: unknown, kids: Kid[]): PackingState {
  const empty = emptyStateForKids(kids)
  if (!value || typeof value !== 'object') return empty

  const stored = value as PackingState
  return Object.fromEntries(
    kids.map((kid) => {
      const kidItems = stored[kid.id]
      if (!kidItems || typeof kidItems !== 'object') return [kid.id, {}]

      return [
        kid.id,
        Object.fromEntries(
          Object.entries(kidItems).filter(
            ([itemId, checked]) => itemIds.has(itemId) && checked === true,
          ),
        ),
      ]
    }),
  )
}

export function CampingPackingChecklist({ kids }: { kids: Kid[] }) {
  const [packed, setPacked] = useState<PackingState>(() =>
    emptyStateForKids(kids),
  )
  const [loaded, setLoaded] = useState(false)
  const kidIds = useMemo(() => kids.map((kid) => kid.id).join('|'), [kids])
  const totalItems = PACKING_ITEMS.length
  const completedItems = useMemo(
    () =>
      kids.reduce(
        (total, kid) =>
          total +
          PACKING_ITEMS.filter((item) => packed[kid.id]?.[item.id]).length,
        0,
      ),
    [kids, packed],
  )
  const totalPossible = totalItems * kids.length

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      setPacked(sanitizeState(stored ? JSON.parse(stored) : null, kids))
    } catch (error) {
      console.error('Failed to read camping packing checklist', error)
      setPacked(emptyStateForKids(kids))
    } finally {
      setLoaded(true)
    }
  }, [kids, kidIds])

  useEffect(() => {
    if (!loaded) return

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(packed))
    } catch (error) {
      console.error('Failed to save camping packing checklist', error)
    }
  }, [loaded, packed])

  const setKidItem = (kidId: string, itemId: string, checked: boolean) => {
    setPacked((prev) => {
      const nextKidItems = { ...(prev[kidId] ?? {}) }

      if (checked) {
        nextKidItems[itemId] = true
      } else {
        delete nextKidItems[itemId]
      }

      return {
        ...prev,
        [kidId]: nextKidItems,
      }
    })
  }

  const setKidItems = (kidId: string, checked: boolean) => {
    setPacked((prev) => ({
      ...prev,
      [kidId]: checked
        ? Object.fromEntries(PACKING_ITEMS.map((item) => [item.id, true]))
        : {},
    }))
  }

  const resetAll = () => {
    setPacked(emptyStateForKids(kids))
  }

  return (
    <div className="full-bleed md:h-full md:min-h-0">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-6 md:h-full md:min-h-0 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Packed{' '}
            <span className="tabular-nums text-slate-950 dark:text-white">
              {completedItems}/{totalPossible}
            </span>
          </div>
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-400 hover:text-slate-950 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:text-white dark:active:bg-slate-700"
          >
            <span aria-hidden="true">↺</span>
            Reset trip
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:h-full md:min-h-0 md:grid-cols-3">
          {kids.map((kid) => (
            <PackingKidColumn
              key={kid.id}
              kid={kid}
              packedItems={packed[kid.id] ?? {}}
              totalItems={totalItems}
              onToggle={setKidItem}
              onSetAll={setKidItems}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function PackingKidColumn({
  kid,
  packedItems,
  totalItems,
  onToggle,
  onSetAll,
}: {
  kid: Kid
  packedItems: Record<string, boolean>
  totalItems: number
  onToggle: (kidId: string, itemId: string, checked: boolean) => void
  onSetAll: (kidId: string, checked: boolean) => void
}) {
  const accent = kid.color ?? '#0ea5e9'
  const accentSoft = withAlpha(accent, 0.12)
  const packedCount = PACKING_ITEMS.filter(
    (item) => packedItems[item.id],
  ).length
  const progressPercent = totalItems
    ? Math.round((packedCount / totalItems) * 100)
    : 0
  const accentVars = {
    '--accent': accent,
    '--accent-soft': accentSoft,
  } as CSSProperties

  return (
    <div
      className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-white p-3 shadow-xs dark:bg-slate-900 md:h-full md:min-h-0"
      style={{
        borderColor: accent,
        backgroundColor: accentSoft,
        boxShadow: `0 14px 40px -22px ${accentSoft}, inset 0 1px 0 ${accentSoft}`,
      }}
    >
      <div
        className="-mx-3 -mt-3 space-y-2 px-3 py-3"
        style={{
          backgroundColor: accentSoft,
          boxShadow: `0 10px 30px -25px ${accent}`,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {kid.name}
          </h2>
          <div
            className="rounded-full px-3 py-1 text-xs font-semibold tabular-nums shadow-xs"
            style={{ backgroundColor: accentSoft, color: accent }}
          >
            {packedCount}/{totalItems}
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full border border-slate-200/70 bg-slate-100/80 dark:border-slate-700 dark:bg-slate-800/80">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%`, backgroundColor: accent }}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pt-3">
        {PACKING_ITEMS.map((item) => (
          <PackingItemButton
            key={item.id}
            item={item}
            kid={kid}
            checked={Boolean(packedItems[item.id])}
            accentVars={accentVars}
            onToggle={onToggle}
          />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onSetAll(kid.id, true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 active:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <span aria-hidden="true">✓</span>
          All packed
        </button>
        <button
          type="button"
          onClick={() => onSetAll(kid.id, false)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-400 hover:text-slate-950 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:text-white dark:active:bg-slate-700"
        >
          <span aria-hidden="true">↺</span>
          Clear
        </button>
      </div>
    </div>
  )
}

function PackingItemButton({
  item,
  kid,
  checked,
  accentVars,
  onToggle,
}: {
  item: PackingItem
  kid: Kid
  checked: boolean
  accentVars: CSSProperties
  onToggle: (kidId: string, itemId: string, checked: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(kid.id, item.id, !checked)}
      className={`grid min-h-[3.25rem] w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-xl border-2 bg-white px-3 py-2 text-left shadow-sm transition active:-translate-y-0.5 dark:bg-slate-800 ${
        checked
          ? 'border-[var(--accent)] text-slate-500 dark:text-slate-300'
          : 'border-slate-200 text-slate-900 hover:border-[var(--accent)] dark:border-slate-700 dark:text-slate-50 dark:hover:border-[var(--accent)]'
      }`}
      style={accentVars}
      aria-pressed={checked}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 text-sm font-bold transition ${
          checked
            ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
            : 'border-slate-300 bg-slate-50 text-transparent dark:border-slate-600 dark:bg-slate-900'
        }`}
        aria-hidden="true"
      >
        ✓
      </span>
      <span className="min-w-0">
        <span
          className={`block text-sm font-semibold leading-tight ${
            checked ? 'line-through decoration-2' : ''
          }`}
        >
          {item.title}
        </span>
      </span>
      <span className="text-xl" aria-hidden="true">
        {item.emoji}
      </span>
    </button>
  )
}
