'use client'

import { useEffect, useMemo, useRef, useState, useTransition, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useReward } from 'react-rewards'
import type { Completion, Kid, Reward, RewardRedemption } from './data'
import { redeemReward } from './actions'
import { msUntilNextPacificMidnight, rewardAvailableForKid, starsForKid, withAlpha } from './utils'
import { useRandomAudioCue } from './use-audio-cue'

type Column = {
  kid: Kid
  rewards: Reward[]
}

type RewardBoardProps = {
  columns: Column[]
  completions: Completion[]
  redemptions: RewardRedemption[]
}

const REWARD_TARGET_ID = 'chores-reward-target'

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
  const [selected, setSelected] = useState<{
    reward: Reward
    kidId: string
    accent: string
  } | null>(null)

  const selectedEmoji = selected?.reward.emoji
  const { reward: fireReward } = useReward(
    REWARD_TARGET_ID,
    selectedEmoji ? 'emoji' : 'confetti',
    {
      emoji: selectedEmoji ? [selectedEmoji, '🎉'] : undefined,
      fps: 60,
      lifetime: 420,
      angle: 90,
      decay: 0.92,
      spread: 170,
      startVelocity: 60,
      elementCount: 120,
    },
  )
  const { play: playRedeemSound, prefetch: prefetchRedeemSound } =
    useRandomAudioCue({ type: 'rewardRedeem' })

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
      playRedeemSound()
      fireReward()
    }

    router.refresh()
  }

  return (
    <div className="full-bleed md:h-full md:min-h-0">
      <span
        id={REWARD_TARGET_ID}
        className="pointer-events-none fixed bottom-4 left-1/2 z-40 -translate-x-1/2 text-2xl md:bottom-6"
        aria-hidden="true"
      />
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:h-full md:min-h-0 md:grid-cols-3 md:px-4">
        {columns.map((column) => (
          <RewardColumn
            key={column.kid.id}
            kid={column.kid}
            rewards={column.rewards}
            starTotal={totals[column.kid.id] ?? 0}
            onRedeem={handleRedeem}
            redemptions={redemptions}
            onOpen={(reward, kidId, accent) => {
              prefetchRedeemSound()
              setSelected({ reward, kidId, accent })
            }}
          />
        ))}
      </div>
      {selected && typeof document !== 'undefined'
        ? createPortal(
            <RewardRedeemModal
              reward={selected.reward}
              kidId={selected.kidId}
              accent={selected.accent}
              starTotal={totals[selected.kidId] ?? 0}
              redemptions={redemptions}
              onClose={() => setSelected(null)}
              onRedeem={async () => {
                await handleRedeem(selected.reward, selected.kidId, selected.accent)
              }}
            />,
            document.body,
          )
        : null}
    </div>
  )
}

function RewardColumn({
  kid,
  rewards,
  starTotal,
  onRedeem,
  redemptions,
  onOpen,
}: {
  kid: Kid
  rewards: Reward[]
  starTotal: number
  onRedeem: (reward: Reward, kidId: string, accent: string) => Promise<void>
  redemptions: RewardRedemption[]
  onOpen: (reward: Reward, kidId: string, accent: string) => void
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
              onOpen={onOpen}
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
  onOpen,
}: {
  reward: Reward
  kidId: string
  accent: string
  onRedeem: (reward: Reward, kidId: string, accent: string) => Promise<void>
  starTotal: number
  redemptions: RewardRedemption[]
  onOpen: (reward: Reward, kidId: string, accent: string) => void
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
          onOpen(reward, kidId, accent)
        })
      }
      className={`group flex w-full items-center gap-4 rounded-xl border-2 border-slate-200 bg-white px-4 py-4 text-left text-slate-900 shadow-sm transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 ${
        available
          ? 'focus-within:-translate-y-0.5 active:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:border-[var(--accent)] dark:focus-visible:outline-[var(--accent)]'
          : 'opacity-70'
      }`}
      disabled={isPending || !available}
      style={accentVars}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-slate-300 bg-slate-50 text-lg font-semibold text-slate-700 transition group-hover:-translate-y-0.5 group-hover:border-[var(--accent)] group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--accent)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:group-hover:border-[var(--accent)] dark:group-hover:bg-[var(--accent-soft)]">
        {isPending ? '…' : reward.emoji}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold leading-tight">{reward.title}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            Cost {reward.cost} ⭐️
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

function RewardRedeemModal({
  reward,
  kidId,
  accent,
  starTotal,
  redemptions,
  onClose,
  onRedeem,
}: {
  reward: Reward
  kidId: string
  accent: string
  starTotal: number
  redemptions: RewardRedemption[]
  onClose: () => void
  onRedeem: () => Promise<void>
}) {
  const [isPending, startTransition] = useTransition()
  const available = rewardAvailableForKid(reward, kidId, redemptions)
  const enough = starTotal >= reward.cost
  const accentSoft = withAlpha(accent, 0.12)
  const accentVars = {
    '--accent': accent,
    '--accent-soft': accentSoft,
  } as CSSProperties

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
        style={accentVars}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50 text-2xl dark:border-slate-700 dark:bg-slate-800">
              {reward.emoji}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-tight text-slate-900 dark:text-slate-50">
                {reward.title}
              </h2>
              <div className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                Cost {reward.cost} ⭐️ • You have <span className="tabular-nums">{starTotal}</span> ⭐️
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 transition active:bg-slate-100 active:text-slate-700 dark:active:bg-slate-800"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={() =>
              startTransition(() => {
                if (!available || !enough) return
                void onRedeem().finally(() => onClose())
              })
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xs transition active:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:active:bg-slate-200"
            disabled={isPending || !available || !enough}
          >
            Redeem reward
          </button>
          {!available ? (
            <div className="text-center text-xs font-semibold text-slate-500 dark:text-slate-300">
              This reward has already been taken.
            </div>
          ) : !enough ? (
            <div className="text-center text-xs font-semibold text-slate-500 dark:text-slate-300">
              You need {reward.cost - starTotal} more ⭐️ to redeem this.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
