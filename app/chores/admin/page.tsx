import Link from 'next/link'
import type { Metadata } from 'next'
import { AddChoreForm } from '../add-chore-form'
import {
  addChore,
  archiveChore,
  completeChore,
  renameKid,
  setPause,
  setTimeOfDay,
} from '../actions'
import {
  type Chore,
  type Completion,
  type Kid,
  getChoreState,
} from '../data'
import { PasswordForm } from 'app/cal/password-form'
import { auth, isMax } from 'app/auth'
import {
  DAY_NAMES,
  getToday,
  hasCompletedToday,
  isOpenToday,
  isPaused,
  recurringStatus,
  scheduleLabel,
  starsForKid,
  type TodayContext,
  sortByTimeOfDay,
  withAlpha,
} from '../utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Chores admin',
  description: 'Create chores, pause routines, and rename columns for the family chore board.',
}

type ColumnProps = {
  kid: Kid
  openChores: Chore[]
  recurringChores: Chore[]
  completions: Completion[]
  ctx: TodayContext
}

function KidColumn({
  kid,
  openChores,
  recurringChores,
  completions,
  ctx,
}: ColumnProps) {
  const starTotal = starsForKid(completions, kid.id)
  const accent = kid.color ?? '#0ea5e9'
  const accentSoft = withAlpha(accent, 0.1)

  return (
    <div
      className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900"
      style={{
        borderColor: accent,
        backgroundColor: accentSoft,
        boxShadow: `0 12px 40px -20px ${accentSoft}, inset 0 1px 0 ${accentSoft}`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <form action={renameKid} className="flex items-center gap-2">
          <input type="hidden" name="kidId" value={kid.id} />
          <input
            name="name"
            defaultValue={kid.name}
            className="w-28 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
          />
          <input
            type="color"
            name="color"
            defaultValue={kid.color}
            className="h-8 w-10 cursor-pointer rounded-md border border-slate-300 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            aria-label={`${kid.name} color`}
          />
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
          >
            Save
          </button>
        </form>
        <div
          className="flex items-center gap-2 rounded-md px-3 py-1 text-sm font-semibold text-slate-800"
          style={{ backgroundColor: accentSoft, color: accent }}
        >
          ⭐️ <span className="tabular-nums">{starTotal}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Open today
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {openChores.length} chore{openChores.length === 1 ? '' : 's'}
          </span>
        </div>

        {openChores.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Nothing pending. Celebrate the wins or add something new.
          </div>
        ) : (
          openChores.map((chore) => (
            <ChoreCard
              key={chore.id}
              chore={chore}
              ctx={ctx}
              completions={completions}
            />
          ))
        )}
      </div>

      {recurringChores.length > 0 ? (
        <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Recurring and pauses
          </h4>
          <div className="space-y-2">
            {recurringChores.map((chore) => {
              const status = recurringStatus(chore, completions, ctx)
              return (
                <div
                  key={chore.id}
                  className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/60"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{chore.emoji}</span>
                      <div>
                        <div className="font-semibold">{chore.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {scheduleLabel(chore)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          status.tone === 'success'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100'
                            : status.tone === 'muted'
                              ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100'
                        }`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <form action={setPause} className="flex items-center gap-2">
                      <input type="hidden" name="choreId" value={chore.id} />
                      <input
                        type="date"
                        name="pausedUntil"
                        defaultValue={chore.pausedUntil ?? ''}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
                      >
                        Pause
                      </button>
                    </form>
                    {chore.pausedUntil ? (
                      <form action={setPause}>
                        <input type="hidden" name="choreId" value={chore.id} />
                        <input type="hidden" name="pausedUntil" value="" />
                        <button
                          type="submit"
                          className="rounded-md border border-transparent bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                          Resume
                        </button>
                      </form>
                    ) : null}
                    <form action={archiveChore}>
                      <input type="hidden" name="choreId" value={chore.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-transparent px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Archive
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ChoreCard({
  chore,
  ctx,
  completions,
}: {
  chore: Chore
  ctx: TodayContext
  completions: Completion[]
}) {
  const dueLabel = scheduleLabel(chore)
  const paused = isPaused(chore, ctx)
  const doneToday = hasCompletedToday(chore.id, completions, ctx)
  const timeLabel =
    chore.timeOfDay === 'afternoon'
      ? 'Afternoon'
      : chore.timeOfDay === 'evening'
        ? 'Evening'
        : 'Morning'

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="text-2xl leading-none">{chore.emoji}</div>
          <div className="space-y-1">
            <div className="font-semibold leading-tight">{chore.title}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {timeLabel} • {dueLabel}
              {paused ? ` • Paused until ${chore.pausedUntil}` : null}
              {doneToday && !paused ? ' • Done for today' : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow dark:bg-slate-900 dark:text-slate-100">
          ⭐️ {chore.stars}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <form action={completeChore}>
          <input type="hidden" name="choreId" value={chore.id} />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            disabled={doneToday && chore.type === 'repeated'}
          >
            Mark done
          </button>
        </form>
        <form action={setTimeOfDay} className="flex items-center gap-1">
          <input type="hidden" name="choreId" value={chore.id} />
          <select
            name="timeOfDay"
            defaultValue={chore.timeOfDay ?? 'morning'}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            aria-label="Time of day"
          >
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
        </form>
        {chore.type === 'repeated' ? (
          <form action={setPause} className="flex items-center gap-2">
            <input type="hidden" name="choreId" value={chore.id} />
            <input
              type="date"
              name="pausedUntil"
              defaultValue={chore.pausedUntil ?? ''}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
            />
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
            >
              Pause
            </button>
          </form>
        ) : null}
        <form action={archiveChore}>
          <input type="hidden" name="choreId" value={chore.id} />
          <button
            type="submit"
            className="rounded-md border border-transparent px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Archive
          </button>
        </form>
      </div>
    </div>
  )
}

export default async function ChoreAdminPage() {
  const password = auth()

  if (!isMax()) {
    return <PasswordForm error={password ? 'Invalid password.' : undefined} />
  }

  const state = await getChoreState()
  const ctx = getToday()

  const openChoresByKid: Record<string, Chore[]> = {}
  const recurringByKid: Record<string, Chore[]> = {}

  for (const kid of state.kids) {
    openChoresByKid[kid.id] = []
    recurringByKid[kid.id] = []
  }

  for (const chore of state.chores) {
    if (isOpenToday(chore, state.completions, ctx)) {
      openChoresByKid[chore.kidId]?.push(chore)
    }

    if (chore.type === 'repeated') {
      recurringByKid[chore.kidId]?.push(chore)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Chore control center
          </p>
          <h1 className="text-2xl font-bold leading-tight">Manage chores</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Set up new chores, pause routines during travel, archive old tasks, and rename each
            column. All changes sync instantly to the kid-facing board.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Today is {DAY_NAMES[ctx.weekday]}, {ctx.todayIso}.
          </p>
        </div>
        <Link
          href="/chores"
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          Open kid board
        </Link>
      </div>

      <AddChoreForm kids={state.kids} addChoreAction={addChore} />

      <div className="full-bleed">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 md:px-4">
          {state.kids.map((kid) => (
            <KidColumn
              key={kid.id}
              kid={kid}
              openChores={sortByTimeOfDay(openChoresByKid[kid.id] ?? [])}
              recurringChores={sortByTimeOfDay(recurringByKid[kid.id] ?? [])}
              completions={state.completions}
              ctx={ctx}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
