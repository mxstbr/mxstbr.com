import type { Metadata } from 'next'
import Link from 'next/link'
import { RewardBoard } from '../reward-board'
import { getChoreState, type Reward } from '../data'
import { PasswordForm } from 'app/cal/password-form'
import { auth, isMax } from 'app/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Rewards',
  description: 'Redeem stars for treats.',
}

export default async function RewardsPage() {
  const password = auth()

  if (!isMax()) {
    return <PasswordForm error={password ? 'Invalid password.' : undefined} />
  }

  const state = await getChoreState()

  const rewardsByKid: Record<string, Reward[]> = {}

  for (const kid of state.kids) {
    rewardsByKid[kid.id] = []
  }

  for (const reward of state.rewards) {
    if (reward.archived) continue
    for (const kid of state.kids) {
      if (reward.kidIds.includes(kid.id)) {
        rewardsByKid[kid.id]?.push(reward)
      }
    }
  }

  const columns = state.kids.map((kid) => ({
    kid,
    rewards: rewardsByKid[kid.id] ?? [],
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Trade stars for treats
          </p>
          <h1 className="text-2xl font-bold leading-tight">Rewards</h1>
        </div>
        <Link
          href="/chores"
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          Back to chores
        </Link>
      </div>

      <RewardBoard
        columns={columns}
        completions={state.completions}
        redemptions={state.rewardRedemptions}
      />
    </div>
  )
}
