'use client'

import { useEffect, useMemo, useRef, useState, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import type { Completion, Kid, Reward, RewardRedemption } from './data'
import { redeemReward } from './actions'
import { msUntilNextPacificMidnight, rewardAvailableForKid, starsForKid, withAlpha } from './utils'

type Column = {
  kid: Kid
  rewards: Reward[]
}

type RewardBoardProps = {
  columns: Column[]
  completions: Completion[]
  redemptions: RewardRedemption[]
}

export function RewardBoard({ columns, completions, redemptions }: RewardBoardProps) {
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

  const handleRedeem = async (reward: Reward, kidId: string, accent: string) => {
    const formData = new FormData()
    formData.append('rewardId', reward.id)
    formData.append('kidId', kidId)
    const result = await redeemReward(formData)

    if (result?.success) {
      setTotals((prev) => ({
        ...prev,
        [kidId]: (prev[kidId] ?? 0) - reward.cost,
      }))
      fireConfetti(accent)
    }

    router.refresh()
  }

  return (
    <div className="full-bleed md:h-full md:min-h-0">
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:h-full md:min-h-0 md:grid-cols-3 md:px-4">
        {columns.map((column) => (
          <RewardColumn
            key={column.kid.id}
            kid={column.kid}
            rewards={column.rewards}
            starTotal={totals[column.kid.id] ?? 0}
            onRedeem={handleRedeem}
            redemptions={redemptions}
          />
        ))}
      </div>
    </div>
  )
}

function RewardColumn({
  kid,
  rewards,
  starTotal,
  onRedeem,
  redemptions,
}: {
  kid: Kid
  rewards: Reward[]
  starTotal: number
  onRedeem: (reward: Reward, kidId: string, accent: string) => Promise<void>
  redemptions: RewardRedemption[]
}) {
  const accent = kid.color ?? '#0ea5e9'
  const accentSoft = withAlpha(accent, 0.12)
  const sortedRewards = [...rewards].sort((a, b) => {
    if (a.cost !== b.cost) return a.cost - b.cost
    return a.title.localeCompare(b.title)
  })

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-xs dark:bg-slate-900 md:h-full md:min-h-0 md:overflow-y-auto"
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
        <div
          className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold shadow-xs"
          style={{ backgroundColor: accentSoft, color: accent }}
        >
          ⭐️ <span className="tabular-nums">{starTotal}</span>
        </div>
      </div>

      <div className="space-y-3">
        {sortedRewards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            No rewards yet. Check back soon!
          </div>
        ) : (
          sortedRewards.map((reward) => (
            <RewardButton
              key={reward.id}
              reward={reward}
              kidId={kid.id}
              accent={accent}
              onRedeem={onRedeem}
              starTotal={starTotal}
              redemptions={redemptions}
            />
          ))
        )}
      </div>
    </div>
  )
}

function RewardButton({
  reward,
  kidId,
  accent,
  onRedeem,
  starTotal,
  redemptions,
}: {
  reward: Reward
  kidId: string
  accent: string
  onRedeem: (reward: Reward, kidId: string, accent: string) => Promise<void>
  starTotal: number
  redemptions: RewardRedemption[]
}) {
  const [isPending, startTransition] = useTransition()
  const available = rewardAvailableForKid(reward, kidId, redemptions)
  const enough = starTotal >= reward.cost
  const accentSoft = withAlpha(accent, 0.12)
  const accentVars = {
    '--accent': accent,
    '--accent-soft': accentSoft,
  } as CSSProperties

  const statusLabel = !available
    ? 'Taken'
    : enough
      ? 'Redeem'
      : `${reward.cost - starTotal} more ⭐️`

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(() => {
          if (available && enough) {
            void onRedeem(reward, kidId, accent)
          }
        })
      }
      className={`group flex w-full items-center gap-4 rounded-xl border-2 border-slate-200 bg-white px-4 py-4 text-left text-slate-900 shadow-sm transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 ${
        available && enough
          ? 'focus-within:-translate-y-0.5 active:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:border-[var(--accent)] dark:focus-visible:outline-[var(--accent)]'
          : 'opacity-70'
      }`}
      disabled={isPending || !available || !enough}
      style={accentVars}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-slate-300 bg-slate-50 text-lg font-semibold text-slate-700 transition group-hover:-translate-y-0.5 group-hover:border-[var(--accent)] group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--accent)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:group-hover:border-[var(--accent)] dark:group-hover:bg-[var(--accent-soft)]">
        {isPending ? '…' : reward.emoji}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold leading-tight">{reward.title}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            Cost {reward.cost} ⭐️ • {reward.type === 'perpetual' ? 'Perpetual' : 'One-off'}
          </div>
        </div>
      </div>
      <div
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          available && enough
            ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
        }`}
      >
        {statusLabel}
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
  const pieces = 60

  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('span')
    const size = 5 + Math.random() * 6
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
