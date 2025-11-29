import type { Metadata } from 'next'
import Link from 'next/link'
import { KidBoard } from './kid-board'
import { type Chore, getChoreState } from './data'
import { getToday, isOpenForKid, pacificDateFromTimestamp, shiftIsoDay, sortByTimeOfDay } from './utils'
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

type ChoresPageProps = {
  searchParams?: {
    day?: string
  }
}

export default async function ChoresPage({ searchParams }: ChoresPageProps) {
  const password = auth()

  if (!isMax()) {
    return <PasswordForm error={password ? 'Invalid password.' : undefined} />
  }

  const state = await getChoreState()
  const todayCtx = getToday()
  const ctx = getToday(searchParams?.day)
  const viewingToday = ctx.todayIso === todayCtx.todayIso
  const prevDay = shiftIsoDay(ctx.todayIso, -1)
  const nextDay = shiftIsoDay(ctx.todayIso, 1)
  const dayDate = new Date(`${ctx.todayIso}T12:00:00Z`)
  const readableDay = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(dayDate)

  const openChoresByKid: Record<string, Chore[]> = {}
  const doneChoresByKid: Record<string, { chore: Chore; completionId: string; timestamp: string }[]> = {}

  for (const kid of state.kids) {
    openChoresByKid[kid.id] = []
    doneChoresByKid[kid.id] = []
  }

  for (const chore of state.chores) {
    for (const kid of state.kids) {
      if (isOpenForKid(chore, kid.id, state.completions, ctx)) {
        openChoresByKid[kid.id]?.push(chore)
      }
    }
  }

  for (const completion of state.completions) {
    if (pacificDateFromTimestamp(completion.timestamp) !== ctx.todayIso) continue
    const chore = state.chores.find((c) => c.id === completion.choreId)
    if (!chore) continue
    if (!chore.kidIds.includes(completion.kidId)) continue

    doneChoresByKid[completion.kidId]?.push({
      chore,
      completionId: completion.id,
      timestamp: completion.timestamp,
    })
  }

  const columns = state.kids.map((kid) => ({
    kid,
    chores: sortByTimeOfDay(openChoresByKid[kid.id] ?? []),
    done: sortByTimeOfDay(
      (doneChoresByKid[kid.id] ?? []).map((entry) => ({
        ...entry,
        timeOfDay: entry.chore.timeOfDay,
        createdAt: entry.timestamp ?? entry.chore.createdAt,
      })),
    ).map(({ timeOfDay, createdAt, timestamp, ...rest }) => rest),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Chores
        </h1>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white p-1 pr-3 text-sm font-semibold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
            <Link
              href={`/chores?day=${prevDay}`}
              aria-label="Previous day"
              className="rounded px-2 py-1 transition hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              ‹
            </Link>
            <Link
              href={viewingToday ? '/chores' : `/chores?day=${todayCtx.todayIso}`}
              className={`rounded px-3 py-1 transition ${
                viewingToday
                  ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Today
            </Link>
            <Link
              href={`/chores?day=${nextDay}`}
              aria-label="Next day"
              className="rounded px-2 py-1 transition hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              ›
            </Link>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {readableDay}
            </span>
          </div>
          <Link
            href="/chores/rewards"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            Rewards →
          </Link>
        </div>
      </div>
      <KidBoard columns={columns} completions={state.completions} />
    </div>
  )
}
