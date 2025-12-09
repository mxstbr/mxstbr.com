'use client'

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  useCallback,
} from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useReward } from 'react-rewards'
import type { Chore, Completion, Kid } from './data'
import { completeChore, requestApproval, setKidColor, skipChore, undoChore } from './actions'
import {
  msUntilNextPacificMidnight,
  pacificTimeInMinutes,
  sortByTimeOfDay,
  starsForKid,
  withAlpha,
} from './utils'

type FreshChore = Chore & { isNew?: boolean }

type Column = {
  kid: Kid
  chores: FreshChore[]
  done: { chore: FreshChore; completionId: string }[]
}

type KidBoardProps = {
  columns: Column[]
  completions: Completion[]
  mode: 'today' | 'past' | 'future'
  dayIso: string
  dayLabel: string
  todayHref: string
  selectedKidId?: string
}

type PendingCompletion = {
  chore: FreshChore
  kidId: string
  accent: string
  onReward?: () => void
}

type ApprovalRequest = {
  chore: FreshChore
  kidId: string
  accent: string
  dayIso: string
  reason: 'future' | 'requiresApproval'
  onReward?: () => void
}

type TimeGroupKey = 'morning' | 'afternoon' | 'evening' | 'any'

const REWARD_TARGET_ID = 'chores-reward-target'
const RECOLLAPSE_IDLE_MS = 45_000

function shouldAutoCollapse(
  mode: KidBoardProps['mode'],
  minutes: number,
  key: TimeGroupKey,
): boolean {
  if (mode !== 'today') return false
  if (key === 'morning') return minutes >= 12 * 60
  if (key === 'afternoon') return minutes >= 18 * 60
  return false
}

export function KidBoard({
  columns,
  completions,
  mode,
  dayIso,
  dayLabel,
  todayHref,
  selectedKidId,
}: KidBoardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const column of columns) {
      totals[column.kid.id] = starsForKid(completions, column.kid.id)
    }
    return totals
  }, [columns, completions])

  const [totals, setTotals] = useState(initialTotals)
  const [pending, setPending] = useState<PendingCompletion | null>(null)
  const [approvalRequest, setApprovalRequest] =
    useState<ApprovalRequest | null>(null)
  const [approvalStatus, setApprovalStatus] = useState<
    'pending' | 'sent' | 'error' | ''
  >('')
  const [approvalError, setApprovalError] = useState('')
  const [pacificMinutes, setPacificMinutes] = useState(() =>
    pacificTimeInMinutes(),
  )
  const [activeKidId, setActiveKidId] = useState<string>(
    selectedKidId && columns.some((c) => c.kid.id === selectedKidId)
      ? selectedKidId
      : (columns[0]?.kid.id ?? ''),
  )

  useEffect(() => {
    setTotals(initialTotals)
  }, [initialTotals])

  useEffect(() => {
    const refreshMinutes = () => setPacificMinutes(pacificTimeInMinutes())
    const id = window.setInterval(refreshMinutes, 60_000)
    refreshMinutes()
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    let timeoutId: number
    const setNextRefresh = () => {
      const delay = msUntilNextPacificMidnight()
      timeoutId = window.setTimeout(() => {
        router.refresh()
        setNextRefresh()
      }, delay)
    }
    setNextRefresh()
    return () => window.clearTimeout(timeoutId)
  }, [router])

  useEffect(() => {
    if (!selectedKidId) return
    if (columns.some((c) => c.kid.id === selectedKidId)) {
      setActiveKidId(selectedKidId)
    }
  }, [selectedKidId, columns])

  useEffect(() => {
    const refresh = () => router.refresh()
    const id = window.setInterval(refresh, 60_000)
    return () => window.clearInterval(id)
  }, [router])

  useEffect(() => {
    if (mode === 'today') return

    const idleMs = 30_000
    let timer: number
    const lastInteraction = { current: Date.now() }

    const schedule = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const idleLongEnough = Date.now() - lastInteraction.current >= idleMs
        if (!idleLongEnough) {
          schedule()
          return
        }

        router.replace(todayHref)
      }, idleMs)
    }

    const markInteraction = () => {
      lastInteraction.current = Date.now()
      schedule()
    }

    const events = ['click', 'keydown', 'pointermove', 'touchstart']
    events.forEach((event) =>
      window.addEventListener(event, markInteraction, { passive: true }),
    )

    schedule()

    return () => {
      window.clearTimeout(timer)
      events.forEach((event) =>
        window.removeEventListener(event, markInteraction),
      )
    }
  }, [mode, todayHref, router])

  const handleComplete = async (
    chore: FreshChore,
    kidId: string,
    accent: string,
    onReward?: () => void,
    targetDay?: string,
  ) => {
    const formData = new FormData()
    formData.append('choreId', chore.id)
    formData.append('kidId', kidId)
    if (targetDay) {
      formData.append('day', targetDay)
    }
    const result = await completeChore(formData)

    if (result?.awarded && result.awarded > 0) {
      setTotals((prev) => ({
        ...prev,
        [kidId]: (prev[kidId] ?? 0) + result.awarded,
      }))
      onReward?.()
    }

    const refreshDelay = onReward ? 900 : 100
    setTimeout(() => router.refresh(), refreshDelay)
    if (chore.type === 'perpetual') {
      setTimeout(() => router.refresh(), 5200)
    }
  }

  const sendApprovalRequest = useCallback(
    async (request: ApprovalRequest) => {
      const formData = new FormData()
      formData.append('choreId', request.chore.id)
      formData.append('kidId', request.kidId)
      formData.append('day', request.dayIso)

      setApprovalStatus('pending')
      setApprovalError('')

      const response = await requestApproval(formData)
      if (response?.ok) {
        setApprovalStatus('sent')
      } else {
        setApprovalStatus('error')
        setApprovalError(response?.error ?? 'Unable to send approval request.')
      }
    },
    [],
  )

  const beginCompletion = async (
    chore: FreshChore,
    kidId: string,
    accent: string,
    onReward?: () => void,
    options?: { allowPast?: boolean },
  ) => {
    const targetDay = dayIso
    if (mode === 'past' && !options?.allowPast) {
      setPending({ chore, kidId, accent, onReward })
      return
    }
    const needsApproval = chore.requiresApproval || mode === 'future'
    if (needsApproval) {
      const request: ApprovalRequest = {
        chore,
        kidId,
        accent,
        dayIso: targetDay,
        reason: mode === 'future' ? 'future' : 'requiresApproval',
        onReward,
      }
      setApprovalRequest(request)
      void sendApprovalRequest(request)
      return
    }
    await handleComplete(chore, kidId, accent, onReward, targetDay)
  }

  const closeApprovalPrompt = () => {
    setApprovalRequest(null)
    setApprovalStatus('')
    setApprovalError('')
  }

  const handleUndo = async (
    chore: FreshChore,
    completionId: string,
    kidId: string,
  ) => {
    const formData = new FormData()
    formData.append('choreId', chore.id)
    formData.append('kidId', kidId)
    formData.append('completionId', completionId)
    formData.append('day', dayIso)
    const result = await undoChore(formData)

    if (typeof result?.delta === 'number' && result.delta !== 0) {
      setTotals((prev) => ({
        ...prev,
        [kidId]: (prev[kidId] ?? 0) + result.delta,
      }))
    }

    router.refresh()
  }

  const handleKidChange = (kidId: string) => {
    setActiveKidId(kidId)
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    params.set('kid', kidId)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const mobileColumn =
    columns.find((col) => col.kid.id === activeKidId) ?? columns[0]

  return (
    <div className="full-bleed md:h-full md:min-h-0">
      <span
        id={REWARD_TARGET_ID}
        className="pointer-events-none fixed bottom-4 left-1/2 z-40 -translate-x-1/2 text-2xl md:bottom-6"
        aria-hidden="true"
      />
      <div className="md:hidden">
        <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">
          Select kid
        </label>
        <select
          value={mobileColumn?.kid.id}
          onChange={(event) => handleKidChange(event.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
        >
          {columns.map((col) => (
            <option key={col.kid.id} value={col.kid.id}>
              {col.kid.name}
            </option>
          ))}
        </select>
        {mobileColumn ? (
          <KidColumn
            kid={mobileColumn.kid}
            chores={sortByTimeOfDay(mobileColumn.chores)}
            doneChores={mobileColumn.done}
            starTotal={totals[mobileColumn.kid.id] ?? 0}
            onComplete={beginCompletion}
            onUndo={handleUndo}
            mode={mode}
            pacificMinutes={pacificMinutes}
          />
        ) : null}
      </div>
      <div className="hidden h-full min-h-0 grid-cols-1 gap-4 sm:gap-6 md:grid md:grid-cols-3 md:px-4">
        {columns.map((column) => (
          <KidColumn
            key={column.kid.id}
            kid={column.kid}
            chores={sortByTimeOfDay(column.chores)}
            doneChores={column.done}
            starTotal={totals[column.kid.id] ?? 0}
            onComplete={beginCompletion}
            onUndo={handleUndo}
            mode={mode}
            pacificMinutes={pacificMinutes}
          />
        ))}
      </div>
      {pending ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Editing a past day
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  You&apos;re viewing {dayLabel}. Go to today to record chores,
                  or complete this task for {dayLabel}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPending(null)}
                className="rounded-md p-1 text-slate-500 transition active:bg-slate-100 active:text-slate-700 dark:active:bg-slate-800"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Link
                href={todayHref}
                className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition active:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:active:bg-slate-200"
              >
                Go to today
              </Link>
              <button
                type="button"
                onClick={() => {
                  setPending(null)
                  beginCompletion(
                    pending.chore,
                    pending.kidId,
                    pending.accent,
                    pending.onReward,
                    { allowPast: true },
                  )
                }}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm transition active:border-slate-500 dark:border-slate-700 dark:text-slate-100"
              >
                Complete for {dayLabel}
              </button>
              <button
                type="button"
                onClick={() => setPending(null)}
                className="inline-flex items-center justify-center rounded-md border border-transparent px-3 py-2 text-xs font-semibold text-slate-600 transition active:text-slate-900 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {approvalRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Parent approval required
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  We sent a request to approve &quot;{approvalRequest.chore.title}&quot;
                  {approvalRequest.reason === 'future' ? ` for ${dayLabel}` : ''}.
                  Parents can tap the Telegram button to complete it.
                </p>
              </div>
              <button
                type="button"
                onClick={closeApprovalPrompt}
                className="rounded-md p-1 text-slate-500 transition active:bg-slate-100 active:text-slate-700 dark:active:bg-slate-800"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
              {approvalStatus === 'pending' ? (
                <p>Sending approval request…</p>
              ) : null}
              {approvalStatus === 'sent' ? (
                <p>
                  Request sent! Check Telegram for a button to mark this chore as complete.
                </p>
              ) : null}
              {approvalStatus === 'error' ? (
                <p className="font-semibold text-red-600 dark:text-red-400">
                  {approvalError || 'We could not send the request. Please try again.'}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={closeApprovalPrompt}
                  className="inline-flex items-center justify-center rounded-md border border-transparent px-3 py-2 text-xs font-semibold text-slate-600 transition active:text-slate-900 dark:text-slate-300"
                >
                  Close
                </button>
                {approvalStatus === 'error' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (approvalRequest) {
                        void sendApprovalRequest(approvalRequest)
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition active:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:active:bg-slate-200"
                  >
                    Try again
                  </button>
                ) : null}
              </div>
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
  mode,
  pacificMinutes,
  disableCompletion = false,
}: {
  kid: Kid
  chores: FreshChore[]
  doneChores: { chore: FreshChore; completionId: string }[]
  starTotal: number
  onComplete: (
    chore: FreshChore,
    kidId: string,
    accent: string,
    onReward?: () => void,
  ) => Promise<void> | void
  onUndo: (
    chore: FreshChore,
    completionId: string,
    kidId: string,
  ) => Promise<void> | void
  mode: KidBoardProps['mode']
  pacificMinutes: number
  disableCompletion?: boolean
}) {
  const router = useRouter()
  const accent = kid.color ?? '#0ea5e9'
  const [accentOverride, setAccentOverride] = useState(accent)
  const [colorModalOpen, setColorModalOpen] = useState(false)
  const [pendingColor, setPendingColor] = useState(accent)
  const [isSavingColor, setIsSavingColor] = useState(false)
  const accentColor = accentOverride ?? accent
  const accentSoft = withAlpha(accentColor, 0.12)
  const swatches = [
    '#0ea5e9',
    '#8b5cf6',
    '#f59e0b',
    '#22c55e',
    '#f97316',
    '#14b8a6',
    '#f472b6',
    '#6366f1',
  ]
  const timeGroups = useMemo<
    { key: TimeGroupKey; label: string; emoji?: string }[]
  >(
    () => [
      { key: 'morning', label: 'Morning', emoji: '🌅' },
      { key: 'afternoon', label: 'Afternoon', emoji: '☀️' },
      { key: 'evening', label: 'Evening', emoji: '🌙' },
      { key: 'any', label: 'Any time' },
    ],
    [],
  )
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<TimeGroupKey, boolean>
  >(() => {
    const initial: Record<TimeGroupKey, boolean> = {
      morning: false,
      afternoon: false,
      evening: false,
      any: false,
    }
    for (const group of timeGroups) {
      initial[group.key] = shouldAutoCollapse(
        mode,
        pacificMinutes,
        group.key,
      )
    }
    return initial
  })
  const manualExpansions = useRef<Set<TimeGroupKey>>(new Set())
  const recollapseTimer = useRef<number>()
  const choresByTime: Record<TimeGroupKey, Chore[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    any: [],
  }

  const scheduleRecollapse = useCallback(() => {
    if (recollapseTimer.current) {
      window.clearTimeout(recollapseTimer.current)
    }

    const needsRecollapse = Array.from(manualExpansions.current).some((key) =>
      shouldAutoCollapse(mode, pacificMinutes, key),
    )
    if (!needsRecollapse) return

    recollapseTimer.current = window.setTimeout(() => {
      setCollapsedGroups((prev) => {
        let changed = false
        const next = { ...prev }
        for (const key of Array.from(manualExpansions.current)) {
          if (shouldAutoCollapse(mode, pacificMinutes, key) && !next[key]) {
            next[key] = true
            changed = true
          }
        }
        manualExpansions.current.clear()
        return changed ? next : prev
      })
    }, RECOLLAPSE_IDLE_MS)
  }, [mode, pacificMinutes])

  useEffect(() => {
    setCollapsedGroups((prev) => {
      let changed = false
      const next = { ...prev }
      for (const group of timeGroups) {
        const autoCollapse = shouldAutoCollapse(
          mode,
          pacificMinutes,
          group.key,
        )
        if (!autoCollapse) {
          manualExpansions.current.delete(group.key)
          continue
        }
        if (manualExpansions.current.has(group.key)) continue
        if (!next[group.key]) {
          next[group.key] = true
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [mode, pacificMinutes, timeGroups])

  useEffect(() => {
    const events = ['click', 'keydown', 'pointermove', 'touchstart']
    const handleInteraction = () => scheduleRecollapse()
    events.forEach((event) =>
      window.addEventListener(event, handleInteraction, { passive: true }),
    )
    scheduleRecollapse()
    return () => {
      if (recollapseTimer.current) {
        window.clearTimeout(recollapseTimer.current)
      }
      events.forEach((event) =>
        window.removeEventListener(event, handleInteraction),
      )
    }
  }, [scheduleRecollapse])

  useEffect(() => {
    setAccentOverride(accent)
    setPendingColor(accent)
  }, [accent])

  const handleSaveColor = async () => {
    if (!pendingColor) return
    setIsSavingColor(true)
    const formData = new FormData()
    formData.append('kidId', kid.id)
    formData.append('color', pendingColor)
    try {
      await setKidColor(formData)
      setAccentOverride(pendingColor)
      setColorModalOpen(false)
      router.refresh()
    } finally {
      setIsSavingColor(false)
    }
  }

  const toggleGroup = (key: TimeGroupKey) => {
    setCollapsedGroups((prev) => {
      const nextCollapsed = !prev[key]
      const next = { ...prev, [key]: nextCollapsed }
      if (!nextCollapsed && shouldAutoCollapse(mode, pacificMinutes, key)) {
        manualExpansions.current.add(key)
      } else if (nextCollapsed) {
        manualExpansions.current.delete(key)
      }
      return next
    })
    scheduleRecollapse()
  }

  for (const chore of chores) {
    if (chore.timeOfDay === 'morning') {
      choresByTime.morning.push(chore)
    } else if (chore.timeOfDay === 'afternoon') {
      choresByTime.afternoon.push(chore)
    } else if (chore.timeOfDay === 'evening') {
      choresByTime.evening.push(chore)
    } else {
      choresByTime.any.push(chore)
    }
  }

  return (
    <div
      className="flex flex-col gap-4 overflow-hidden rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900 md:h-full md:min-h-0 md:overflow-y-auto"
      style={{
        borderColor: accentColor,
        backgroundColor: accentSoft,
        boxShadow: `0 14px 40px -22px ${accentSoft}, inset 0 1px 0 ${accentSoft}`,
      }}
    >
      <div
        className="sticky -top-4 z-10 -mx-4 -mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-2"
        style={{
          backgroundColor: accentSoft,
          boxShadow: `0 10px 30px -25px ${accentColor}`,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setPendingColor(accentColor)
            setColorModalOpen(true)
          }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-slate-700 dark:text-slate-50 dark:hover:text-slate-200 xl:text-base"
          aria-label={`Change ${kid.name}'s color`}
        >
          <span>{kid.name}</span>
          <span aria-hidden="true" className="text-base text-slate-500">
            ›
          </span>
        </button>
        <StarBadge value={starTotal} accent={accentColor} />
      </div>

      <div className="space-y-4">
        {chores.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            All clear! Come back when something new pops up.
          </div>
        ) : (
          timeGroups
            .map((group) => ({
              ...group,
              items: choresByTime[group.key],
            }))
            .filter((group) => group.items.length > 0)
            .map((group) => {
              const collapsed = collapsedGroups[group.key]
              return (
                <div key={group.key} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="flex w-full items-center gap-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                    aria-expanded={!collapsed}
                  >
                    <span
                      aria-hidden="true"
                      className={`text-base text-slate-500 transition-transform ${
                        collapsed ? '' : 'rotate-90'
                      }`}
                    >
                      &gt;
                    </span>
                    {group.emoji ? (
                      <span aria-hidden="true">{group.emoji}</span>
                    ) : null}
                    <span>{group.label}</span>
                    {collapsed ? (
                      <span className="ml-auto text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {group.items.length} left
                      </span>
                    ) : null}
                  </button>
                  {!collapsed ? (
                    <div className="space-y-3">
                      {group.items.map((chore) => (
                        <ChoreButton
                          key={chore.id}
                          chore={chore}
                          accent={accentColor}
                          kidId={kid.id}
                          onComplete={onComplete}
                          disabled={disableCompletion}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })
        )}
      </div>

      {doneChores.length ? (
        <div className="mt-6 space-y-2 md:mt-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            <span>Done today</span>
            <span className="h-px flex-1 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="space-y-2">
            {doneChores.map((entry) => (
              <CompletedChoreButton
                key={`${entry.chore.id}-${entry.completionId}`}
                chore={entry.chore}
                completionId={entry.completionId}
                accent={accentColor}
                kidId={kid.id}
                onUndo={onUndo}
              />
            ))}
          </div>
        </div>
      ) : null}

      {colorModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Choose a color
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Pick the color for {kid.name}&apos;s column.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setColorModalOpen(false)}
                className="rounded-md p-1 text-slate-500 transition active:bg-slate-100 active:text-slate-700 dark:active:bg-slate-800"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {swatches.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => setPendingColor(swatch)}
                    className={`h-10 rounded-lg border-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      pendingColor === swatch
                        ? 'border-slate-900 shadow-sm dark:border-slate-100'
                        : 'border-transparent shadow'
                    }`}
                    style={{ backgroundColor: swatch }}
                    aria-label={`Select color ${swatch}`}
                  />
                ))}
              </div>
              <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span>Custom</span>
                <input
                  type="color"
                  value={pendingColor}
                  onChange={(event) => setPendingColor(event.target.value)}
                  className="h-9 w-16 cursor-pointer rounded-md border border-slate-300 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                  aria-label="Pick a custom color"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setColorModalOpen(false)}
                className="inline-flex items-center justify-center rounded-md border border-transparent px-3 py-2 text-xs font-semibold text-slate-600 transition active:text-slate-900 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveColor}
                className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition active:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:active:bg-slate-200"
                disabled={isSavingColor}
              >
                {isSavingColor ? 'Saving…' : 'Save color'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function StarBadge({ value, accent }: { value: number; accent: string }) {
  const accentSoft = withAlpha(accent, 0.26)
  const accentStrong = `color-mix(in srgb, ${accent} 82%, #0f172a)`

  return (
    <div
      className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold shadow-sm"
      style={{ backgroundColor: accentSoft, color: accentStrong }}
    >
      ⭐️ <span className="tabular-nums">{value}</span>
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
  chore: FreshChore
  accent: string
  kidId: string
  onComplete: (
    chore: FreshChore,
    kidId: string,
    accent: string,
    onReward?: () => void,
  ) => Promise<void> | void
  disabled?: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ttsUrlRef = useRef<string | null>(null)
  const prefetchedTitleRef = useRef<string | null>(null)
  const ttsPrefetchingRef = useRef(false)
  const { reward, isAnimating } = useReward(
    REWARD_TARGET_ID,
    chore.emoji ? 'emoji' : 'confetti',
    {
      emoji: chore.emoji ? [chore.emoji, '🎉'] : undefined,
      fps: 60,
      lifetime: 420,
      angle: 90,
      decay: 0.92,
      spread: 170,
      startVelocity: 60,
      elementCount: 120,
    },
  )
  const accentSoft = withAlpha(accent, 0.12)
  const isNew = chore.isNew
  const cardToneClasses = isNew
    ? 'border-amber-200 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/40'
    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
  const accentVars = {
    '--accent': accent,
    '--accent-soft': accentSoft,
  } as CSSProperties
  const completionDisabled = isPending || disabled

  const performSkip = () => {
    if (isSkipping) return
    setIsSkipping(true)
    setMenuOpen(false)
    setSkipConfirmOpen(false)
    const formData = new FormData()
    formData.append('choreId', chore.id)
    formData.append('kidId', kidId)
    startTransition(() => {
      void skipChore(formData).finally(() => {
        setIsSkipping(false)
        setTimeout(() => router.refresh(), 50)
      })
    })
  }

  const fetchTtsUrl = useCallback(async () => {
    if (ttsPrefetchingRef.current) return ttsUrlRef.current
    if (ttsUrlRef.current && prefetchedTitleRef.current === chore.title) {
      return ttsUrlRef.current
    }
    ttsPrefetchingRef.current = true
    try {
      const response = await fetch('/api/chores/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chore.title }),
      })
      if (!response.ok) throw new Error(`TTS failed: ${response.status}`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      if (ttsUrlRef.current && ttsUrlRef.current !== url) {
        URL.revokeObjectURL(ttsUrlRef.current)
      }
      ttsUrlRef.current = url
      prefetchedTitleRef.current = chore.title
      return url
    } catch (error) {
      console.error('Failed to fetch chore audio', error)
      return null
    } finally {
      ttsPrefetchingRef.current = false
    }
  }, [chore.title])

  useEffect(() => {
    if (!menuOpen) return

    let timeoutId: number
    const resetTimer = () => {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => setMenuOpen(false), 30_000)
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current) return
      if (containerRef.current.contains(event.target as Node)) {
        resetTimer()
        return
      }
      setMenuOpen(false)
    }

    resetTimer()
    document.addEventListener('pointerdown', handlePointerDown, true)

    return () => {
      window.clearTimeout(timeoutId)
      document.removeEventListener('pointerdown', handlePointerDown, true)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    void fetchTtsUrl()
  }, [menuOpen, fetchTtsUrl])

  useEffect(() => {
    return () => {
      if (ttsUrlRef.current) {
        URL.revokeObjectURL(ttsUrlRef.current)
        ttsUrlRef.current = null
      }
    }
  }, [])

  const handleSpeak = async () => {
    if (isSpeaking) return
    try {
      setIsSpeaking(true)
      audioRef.current?.pause()
      const url = await fetchTtsUrl()
      if (!url) throw new Error('TTS unavailable')
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => setIsSpeaking(false)
      audio.onerror = () => setIsSpeaking(false)
      await audio.play()
    } catch (error) {
      console.error('Failed to play chore audio', error)
      setIsSpeaking(false)
    }
  }

  const skipConfirmModal =
    skipConfirmOpen && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    Skip this task?
                  </h2>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    Are you sure you want to skip &quot;{chore.title}&quot; for now?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSkipConfirmOpen(false)}
                  className="rounded-md p-1 text-slate-500 transition active:bg-slate-100 active:text-slate-700 dark:active:bg-slate-800"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSkipConfirmOpen(false)}
                  className="inline-flex items-center justify-center rounded-md border border-transparent px-3 py-2 text-xs font-semibold text-slate-600 transition active:text-slate-900 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={performSkip}
                  className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition active:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:active:bg-slate-200"
                  disabled={isSkipping}
                >
                  Skip task
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div
      className={`relative rounded-xl border-2 shadow transition focus-within:-translate-y-0.5 active:-translate-y-0.5 focus-within:border-[var(--accent)] active:border-[var(--accent)] dark:focus-within:border-[var(--accent)] dark:active:border-[var(--accent)] ${cardToneClasses} ${menuOpen ? 'z-20' : ''}`}
      style={accentVars}
      ref={containerRef}
    >
      <button
        type="button"
        onClick={() =>
          startTransition(() => {
            if (completionDisabled || isAnimating) return
            void onComplete(chore, kidId, accent, reward)
          })
        }
        className="group flex w-full items-start gap-3 px-3 py-3 text-left text-slate-900 transition active:bg-[var(--accent-soft)] focus-visible:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:translate-y-0 disabled:opacity-60 dark:text-slate-50 dark:active:bg-[var(--accent-soft)] dark:focus-visible:bg-[var(--accent-soft)] xl:gap-4 xl:px-4 xl:py-4"
        disabled={completionDisabled || isAnimating}
        aria-label={`Mark "${chore.title}" as done`}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xl leading-none transition group-active:text-[var(--accent)] group-focus-visible:text-[var(--accent)] xl:text-3xl">
            {isPending ? '…' : chore.emoji}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold leading-tight xl:text-base">
            {chore.title}
          </div>
        </div>
      </button>
      <div className="flex items-center justify-between border-t border-slate-200 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:border-slate-700 dark:text-amber-200 xl:px-4">
        <div className="flex items-center gap-2 text-sm font-semibold leading-none xl:text-base">
          <div>+{chore.stars} stars</div>
          {chore.requiresApproval ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/50 dark:text-amber-100">
              🔐 Parent OK
            </div>
          ) : null}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-full min-w-[46px] items-center justify-center rounded-lg border-2 border-slate-200 bg-white px-2.5 text-sm transition active:border-[var(--accent)] active:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:translate-y-0 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:active:border-[var(--accent)] dark:active:bg-[var(--accent-soft)] dark:focus-visible:outline-[var(--accent)] xl:min-w-[52px] xl:px-3 xl:text-base"
            aria-expanded={menuOpen}
            aria-label="More actions"
          >
            ⋯
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-full z-40 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-800 transition active:bg-slate-100 focus-visible:bg-slate-100 dark:text-slate-100 dark:active:bg-slate-700 dark:focus-visible:bg-slate-700"
                onClick={() => {
                  void handleSpeak()
                }}
                disabled={isSpeaking}
              >
                <span className="text-base">🔊</span>
                <span>Read task</span>
                {isSpeaking ? (
                  <span className="ml-auto text-xs text-slate-500">…</span>
                ) : null}
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-800 transition active:bg-slate-100 focus-visible:bg-slate-100 dark:text-slate-100 dark:active:bg-slate-700 dark:focus-visible:bg-slate-700"
                onClick={() => {
                  if (isSkipping) return
                  setMenuOpen(false)
                  setSkipConfirmOpen(true)
                }}
                disabled={isSkipping}
              >
                <span className="text-base">⏭️</span>
                <span>Skip task</span>
                {isSkipping ? (
                  <span className="ml-auto text-xs text-slate-500">…</span>
                ) : null}
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {skipConfirmModal}
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
  chore: FreshChore
  completionId: string
  accent: string
  kidId: string
  onUndo: (
    chore: FreshChore,
    completionId: string,
    kidId: string,
  ) => Promise<void> | void
}) {
  const [isPending, startTransition] = useTransition()
  const accentSoft = withAlpha(accent, 0.12)
  const accentVars = {
    '--accent': accent,
    '--accent-soft': accentSoft,
  } as CSSProperties

  const handleUndo = () =>
    startTransition(() => {
      void onUndo(chore, completionId, kidId)
    })

  return (
    <div
      className="relative rounded-xl border-2 border-slate-200 bg-white shadow transition focus-within:-translate-y-0.5 active:-translate-y-0.5 focus-within:border-[var(--accent)] active:border-[var(--accent)] dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-[var(--accent)] dark:active:border-[var(--accent)]"
      style={accentVars}
    >
      <button
        type="button"
        onClick={handleUndo}
        className="group flex w-full items-start gap-3 px-3 py-3 text-left text-slate-900 transition active:bg-[var(--accent-soft)] focus-visible:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:translate-y-0 disabled:opacity-60 dark:text-slate-50 dark:active:bg-[var(--accent-soft)] dark:focus-visible:bg-[var(--accent-soft)] xl:gap-4 xl:px-4 xl:py-4"
        disabled={isPending}
        aria-label={`Undo completion for "${chore.title}"`}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xl leading-none transition group-active:text-[var(--accent)] group-focus-visible:text-[var(--accent)] xl:text-3xl">
            {chore.emoji}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold leading-tight line-through text-slate-500 dark:text-slate-300/80 xl:text-base">
            {chore.title}
          </div>
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-200">
            Marked done
          </div>
        </div>
      </button>
      <div className="flex items-center justify-between border-t border-slate-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-slate-700 dark:text-emerald-200 xl:px-4">
        <div className="flex items-center gap-2 text-sm font-semibold leading-none xl:text-base">
          <div>+{chore.stars} stars</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            className="rounded-lg border-2 border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 transition active:border-[var(--accent)] active:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:translate-y-0 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:active:border-[var(--accent)] dark:active:bg-[var(--accent-soft)] dark:focus-visible:outline-[var(--accent)]"
            disabled={isPending}
          >
            Undo
          </button>
          <SpeakIconButton text={chore.title} accent={accent} />
        </div>
      </div>
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
          if (!response.ok)
            throw new Error(`TTS failed with status ${response.status}`)
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
      className="flex h-full min-w-[46px] items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-2.5 text-sm transition active:-translate-y-0.5 active:border-[var(--accent)] active:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:active:border-[var(--accent)] dark:active:bg-[var(--accent-soft)] dark:focus-visible:outline-[var(--accent)] xl:min-w-[52px] xl:px-3 xl:text-base"
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
