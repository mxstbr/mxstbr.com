import type { Metadata } from 'next'
import { KidBoard } from './kid-board'
import { type Chore, getChoreState } from './data'
import { getToday, isOpenForKid, sortByTimeOfDay } from './utils'
import { PasswordForm } from 'app/cal/password-form'
import { auth, isMax } from 'app/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Chores',
  description:
    'Kid-facing chore board with one column per kid and a single tap to claim stars.',
}

export default async function ChoresPage() {
  const password = auth()

  if (!isMax()) {
    return <PasswordForm error={password ? 'Invalid password.' : undefined} />
  }

  const state = await getChoreState()
  const ctx = getToday()

  const openChoresByKid: Record<string, Chore[]> = {}

  for (const kid of state.kids) {
    openChoresByKid[kid.id] = []
  }

  for (const chore of state.chores) {
    for (const kid of state.kids) {
      if (isOpenForKid(chore, kid.id, state.completions, ctx)) {
        openChoresByKid[kid.id]?.push(chore)
      }
    }
  }

  const columns = state.kids.map((kid) => ({
    kid,
    chores: sortByTimeOfDay(openChoresByKid[kid.id] ?? []),
  }))

  return (
    <div className="space-y-6">
      <KidBoard columns={columns} completions={state.completions} />
    </div>
  )
}
