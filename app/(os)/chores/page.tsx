import type { Metadata } from 'next'
import Link from 'next/link'
import { KidBoard } from './kid-board'
import { type Chore, getChoreState } from './data'
import {
  getToday,
  getDailyChoreProgress,
  isOpenForKid,
  pacificDateFromTimestamp,
  shiftIsoDay,
  sortByTimeOfDay,
} from './utils'
import { ScreenSaver } from './screen-saver'
import { RefreshButton } from './refresh-button'
import { PasswordForm } from '../components/password-form'
import { auth, isMax } from '../../auth'
import { ChoresErrorBoundary } from './error-boundary'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Chores',
  description:
    'Kid-facing chore board with one column per kid and a single tap to claim stars.',
}

type ChoresPageProps = {
  searchParams?: Promise<{
    day?: string
    os?: string
    kid?: string
    pwd?: string
  }>
}

export default async function ChoresPage({ searchParams }: ChoresPageProps) {
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
  const todayCtx = getToday()
  const ctx = getToday(resolvedSearchParams?.day)
  const now = Date.now()
  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000
  const isNewChore = (chore: Chore) => {
    const createdMs = Date.parse(chore.createdAt ?? '')
    return Number.isFinite(createdMs) && now - createdMs <= FOUR_HOURS_MS
  }
  const viewingToday = ctx.todayIso === todayCtx.todayIso
  const viewingPast = ctx.todayIso < todayCtx.todayIso
  const viewingFuture = ctx.todayIso > todayCtx.todayIso
  const prevDay = shiftIsoDay(ctx.todayIso, -1)
  const nextDay = shiftIsoDay(ctx.todayIso, 1)
  const dayDate = new Date(`${ctx.todayIso}T12:00:00Z`)
  const readableDay = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(dayDate)
  const osParam = resolvedSearchParams?.os
  const kidParam = resolvedSearchParams?.kid
  const hasOpenChoresToday = state.chores.some((chore) =>
    state.kids.some((kid) => isOpenForKid(chore, kid.id, state.completions, todayCtx)),
  )

  const choresHref = (day?: string) => {
    const params = new URLSearchParams()
    if (day) params.set('day', day)
    if (osParam) params.set('os', osParam)
    const query = params.toString()
    return query ? `/chores?${query}` : '/chores'
  }

  const rewardsHref = () => {
    const params = new URLSearchParams()
    if (osParam) params.set('os', osParam)
    const query = params.toString()
    return query ? `/chores/rewards?${query}` : '/chores/rewards'
  }

  const openChoresByKid: Record<string, Chore[]> = {}
  const doneChoresByKid: Record<
    string,
    { chore: Chore; completionId: string; timestamp: string }[]
  > = {}
  const progressByKid: Record<string, ReturnType<typeof getDailyChoreProgress>> = {}

  for (const kid of state.kids) {
    openChoresByKid[kid.id] = []
    doneChoresByKid[kid.id] = []
    progressByKid[kid.id] = getDailyChoreProgress(
      state.chores,
      state.completions,
      kid.id,
      ctx,
    )
  }

  for (const chore of state.chores) {
    const choreWithFreshness = { ...chore, isNew: isNewChore(chore) }
    for (const kid of state.kids) {
      if (isOpenForKid(chore, kid.id, state.completions, ctx)) {
        openChoresByKid[kid.id]?.push(choreWithFreshness)
      }
    }
  }

  for (const completion of state.completions) {
    if (pacificDateFromTimestamp(completion.timestamp) !== ctx.todayIso)
      continue
    const chore = state.chores.find((c) => c.id === completion.choreId)
    if (!chore) continue
    if (!chore.kidIds.includes(completion.kidId)) continue
    const choreWithFreshness = { ...chore, isNew: isNewChore(chore) }

    doneChoresByKid[completion.kidId]?.push({
      chore: choreWithFreshness,
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
    progress: progressByKid[kid.id],
  }))

  const backgroundClass = viewingToday
    ? 'bg-slate-50 dark:bg-slate-900'
    : 'bg-slate-200 dark:bg-slate-950'

  return (
    <div
      className={`flex min-h-screen flex-col p-6 pb-20 md:h-screen md:overflow-y-hidden md:pb-6 ${backgroundClass}`}
    >
      <ChoresErrorBoundary label="the toolbar">
        <div className="mb-5 text-sm md:mb-6">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="inline-flex w-fit justify-self-start items-center gap-2 rounded-md border border-slate-300 bg-white p-1 pr-3 text-xs font-semibold text-slate-800 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <Link
                href={choresHref(prevDay)}
                prefetch
                aria-label="Previous day"
                className="rounded-sm px-2 py-1 transition hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                ‹
              </Link>
              <Link
                href={viewingToday ? choresHref() : choresHref(todayCtx.todayIso)}
                prefetch
                className={`rounded-sm px-3 py-1 transition ${
                  viewingToday
                    ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Today
              </Link>
              <Link
                href={choresHref(nextDay)}
                prefetch
                aria-label="Next day"
                className="rounded-sm px-2 py-1 transition hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                ›
              </Link>
            </div>
            <div className="flex justify-center text-base font-semibold text-slate-900 dark:text-slate-100">
              <h1>
                {readableDay}
                {viewingToday ? ' ✅' : ''}
              </h1>
            </div>
            <div className="flex justify-end">
              <RefreshButton />
            </div>
          </div>
        </div>
      </ChoresErrorBoundary>
      <div className="md:flex-1 md:min-h-0 pb-20 md:pb-16">
        <ChoresErrorBoundary label="the chore board">
          <KidBoard
            columns={columns}
            completions={state.completions}
            mode={viewingToday ? 'today' : viewingFuture ? 'future' : 'past'}
            dayIso={ctx.todayIso}
            dayLabel={readableDay}
            todayHref={choresHref()}
            selectedKidId={kidParam}
          />
        </ChoresErrorBoundary>
      </div>
      <ChoresErrorBoundary label="the screen saver">
        <ScreenSaver noChoresToday={!hasOpenChoresToday} />
      </ChoresErrorBoundary>
      <ChoresErrorBoundary label="the navigation bar">
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-300 bg-slate-100/95 px-2 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
          <div className="grid grid-cols-2 divide-x divide-slate-300 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:divide-slate-700 dark:text-slate-200">
            <Link
              href={choresHref()}
              className="flex h-11 items-center justify-center text-slate-900 transition hover:text-slate-900 dark:text-white"
              aria-current="page"
            >
              Chores
            </Link>
            <Link
              href={rewardsHref()}
              className="flex h-11 items-center justify-center transition hover:text-slate-900 dark:hover:text-white"
            >
              Rewards
            </Link>
          </div>
        </div>
      </ChoresErrorBoundary>
    </div>
  )
}
