import type { Metadata } from 'next'
import { RewardBoard } from '../reward-board'
import { getChoreState, type Reward } from '../data'
import { PasswordForm } from '../../components/password-form'
import { auth, isMax } from 'app/auth'
import { InactivityRedirect } from './inactivity-redirect'
import { ChoresNav, choresViewHref } from '../chores-nav'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Rewards',
  description: 'Redeem stars for treats.',
}

type RewardsPageProps = {
  searchParams?: Promise<{
    os?: string
    pwd?: string
  }>
}

export default async function RewardsPage({ searchParams }: RewardsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const password = await auth()
  const isAuthorized = await isMax()

  if (!isAuthorized) {
    return (
      <PasswordForm
        error={password ? 'Invalid password.' : undefined}
        defaultPassword={resolvedSearchParams?.pwd}
      />
    )
  }

  const state = await getChoreState()
  const osParam = resolvedSearchParams?.os
  const choresHref = choresViewHref('/chores', osParam)

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
    <div className="flex min-h-screen flex-col bg-slate-50 p-6 pb-20 md:h-screen md:overflow-y-hidden md:pb-6">
      <InactivityRedirect href={choresHref} />
      <div className="md:flex-1 md:min-h-0 pb-16 md:pb-12">
        <RewardBoard
          columns={columns}
          completions={state.completions}
          redemptions={state.rewardRedemptions}
        />
      </div>
      <ChoresNav current="rewards" osParam={osParam} />
    </div>
  )
}
