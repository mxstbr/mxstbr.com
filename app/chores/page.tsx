import type { Metadata } from 'next'
import { completeChore } from './actions'
import { type Chore, type Completion, type Kid, getChoreState } from './data'
import { DAY_NAMES, getToday, isOpenToday, starsForKid } from './utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Chores',
  description:
    'Kid-facing chore board with one column per kid and a single tap to claim stars.',
}

type ColumnProps = {
  kid: Kid
  chores: Chore[]
  completions: Completion[]
}

function KidColumn({ kid, chores, completions }: ColumnProps) {
  const starTotal = starsForKid(completions, kid.id)

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {kid.name}
        </div>
        <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800 shadow-sm dark:bg-amber-900/50 dark:text-amber-50">
          ⭐️ <span className="tabular-nums">{starTotal}</span>
        </div>
      </div>

      <div className="space-y-3">
        {chores.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            All clear! Come back when something new pops up.
          </div>
        ) : (
          chores.map((chore) => <ChoreButton key={chore.id} chore={chore} />)
        )}
      </div>
    </div>
  )
}

function ChoreButton({ chore }: { chore: Chore }) {
  return (
    <form action={completeChore}>
      <input type="hidden" name="choreId" value={chore.id} />
      <button
        type="submit"
        className="group flex w-full items-center gap-4 rounded-xl border-2 border-slate-200 bg-white px-4 py-4 text-left text-slate-900 shadow transition hover:-translate-y-0.5 hover:border-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 active:translate-y-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-slate-300 bg-slate-50 text-lg font-semibold text-slate-700 transition group-hover:-translate-y-0.5 group-hover:border-emerald-500 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:group-hover:border-emerald-400 dark:group-hover:bg-emerald-900/40">
          ✓
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="text-3xl leading-none">{chore.emoji}</span>
          <div className="min-w-0">
            <div className="text-lg font-semibold leading-tight">
              {chore.title}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end justify-center text-sm font-semibold text-amber-700 dark:text-amber-200">
          <span className="leading-tight">+{chore.stars}</span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-300">
            stars
          </span>
        </div>
      </button>
    </form>
  )
}

export default async function ChoresPage() {
  const state = await getChoreState()
  const ctx = getToday()

  const openChoresByKid: Record<string, Chore[]> = {}

  for (const kid of state.kids) {
    openChoresByKid[kid.id] = []
  }

  for (const chore of state.chores) {
    if (isOpenToday(chore, state.completions, ctx)) {
      openChoresByKid[chore.kidId]?.push(chore)
    }
  }

  return (
    <div className="space-y-6">
      <div className="full-bleed">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 md:px-4">
          {state.kids.map((kid) => (
            <KidColumn
              key={kid.id}
              kid={kid}
              chores={openChoresByKid[kid.id] ?? []}
              completions={state.completions}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
