import type { Metadata } from 'next'
import Link from 'next/link'
import { KidBoard } from './kid-board'
import { type Chore, getChoreState } from '../chores/data'
import {
  getToday,
  getDailyChoreProgress,
  isOpenForKid,
  pacificDateFromTimestamp,
  shiftIsoDay,
  sortByTimeOfDay,
} from '../chores/utils'
import { ScreenSaver } from '../chores/screen-saver'
import { RefreshButton } from './refresh-button'
import { PasswordForm } from '../components/password-form'
import { auth, isMax } from '../../auth'
import { ChoresErrorBoundary } from '../chores/error-boundary'
import { choresViewHref } from '../chores/chores-nav'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Chores Preview',
  description:
    'Kid-facing chore board with one column per kid and a single tap to claim stars.',
  robots: { index: false, follow: false },
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
    state.kids.some((kid) =>
      isOpenForKid(chore, kid.id, state.completions, todayCtx),
    ),
  )

  const choresHref = (day?: string) => {
    const params = new URLSearchParams()
    if (day) params.set('day', day)
    if (osParam) params.set('os', osParam)
    const query = params.toString()
    return query ? `/chores-new?${query}` : '/chores-new'
  }

  const openChoresByKid: Record<string, Chore[]> = {}
  const doneChoresByKid: Record<
    string,
    { chore: Chore; completionId: string; timestamp: string }[]
  > = {}
  const progressByKid: Record<
    string,
    ReturnType<typeof getDailyChoreProgress>
  > = {}

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

  return (
    <div
      className={`relative flex min-h-screen flex-col bg-cover bg-center bg-fixed md:h-screen md:overflow-hidden ${
        viewingToday ? '' : 'grayscale-[0.35]'
      }`}
      style={{
        backgroundColor: '#dfe8e4',
        backgroundImage: "url('/chores/daybreak-preview.webp')",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-white/10 dark:bg-slate-950/45"
        aria-hidden="true"
      />
      <ChoresErrorBoundary label="the toolbar">
        <header className="relative z-20 shrink-0 border-b border-white/70 bg-white/75 px-3 py-2 shadow-[0_1px_12px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/75 sm:px-5">
          <div className="mx-auto grid max-w-[1800px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-4">
            <nav className="flex items-center gap-1 text-[11px] font-bold text-slate-500 sm:gap-3 sm:text-xs dark:text-slate-300">
              <Link
                href={choresViewHref('/chores-new', osParam)}
                className="rounded-lg bg-slate-950 px-2 py-1.5 text-white shadow-sm dark:bg-white dark:text-slate-950 sm:px-3"
                aria-current="page"
              >
                Chores
              </Link>
              <Link
                href={choresViewHref('/chores/rewards', osParam)}
                className="rounded-lg px-1.5 py-1.5 transition hover:bg-white/70 hover:text-slate-950 dark:hover:bg-slate-800 dark:hover:text-white sm:px-2"
              >
                Rewards
              </Link>
              <Link
                href={choresViewHref('/chores/packing', osParam)}
                className="rounded-lg px-1.5 py-1.5 transition hover:bg-white/70 hover:text-slate-950 dark:hover:bg-slate-800 dark:hover:text-white sm:px-2"
              >
                Packing
              </Link>
            </nav>

            <div className="flex min-w-0 items-center justify-center gap-0.5 text-xs font-bold text-slate-800 dark:text-slate-100 sm:gap-1 sm:text-sm">
              <Link
                href={choresHref(prevDay)}
                prefetch
                aria-label="Previous day"
                className="flex h-8 w-7 shrink-0 items-center justify-center rounded-lg text-lg transition hover:bg-white/80 dark:hover:bg-slate-800"
              >
                ‹
              </Link>
              <h1 className="truncate text-center">
                <span className="hidden sm:inline">
                  {viewingToday ? 'Today · ' : ''}
                </span>
                {readableDay}
              </h1>
              <Link
                href={choresHref(nextDay)}
                prefetch
                aria-label="Next day"
                className="flex h-8 w-7 shrink-0 items-center justify-center rounded-lg text-lg transition hover:bg-white/80 dark:hover:bg-slate-800"
              >
                ›
              </Link>
              {!viewingToday ? (
                <Link
                  href={choresHref()}
                  prefetch
                  className="ml-1 hidden rounded-lg bg-white/80 px-2 py-1 text-[11px] shadow-sm transition hover:bg-white sm:inline-flex dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  Today
                </Link>
              ) : null}
            </div>
            <RefreshButton />
          </div>
        </header>
      </ChoresErrorBoundary>

      <main className="relative z-10 mx-auto flex w-full max-w-[1800px] flex-1 flex-col px-3 py-4 sm:px-5 md:min-h-0 md:px-6 md:py-5 xl:px-8">
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
      </main>
      <ChoresErrorBoundary label="the screen saver">
        <ScreenSaver noChoresToday={!hasOpenChoresToday} />
      </ChoresErrorBoundary>
    </div>
  )
}
