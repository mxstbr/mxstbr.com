'use client'

import { useActionState, useMemo } from 'react'
import type { Kid } from '../data'
import { BEDTIME_TEMPLATES, type BedtimeTemplateKey } from './constants'
import type { BedtimeActionState } from './types'

type BedtimeApprovalFormProps = {
  action: (state: BedtimeActionState, formData: FormData) => Promise<BedtimeActionState>
  dayIso: string
  defaultSelections: Record<BedtimeTemplateKey, string[]>
  kids: Kid[]
}

const initialState: BedtimeActionState = { status: 'idle' }

export function BedtimeApprovalForm({
  action,
  dayIso,
  defaultSelections,
  kids,
}: BedtimeApprovalFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  const templatesByKey = useMemo(
    () => Object.fromEntries(BEDTIME_TEMPLATES.map((template) => [template.key, template])),
    [],
  )

  const renderResultList = (entries: BedtimeActionState & { status: 'success' }) => {
    if (!entries.result.created.length && !entries.result.skipped.length) return null

    const items = [...entries.result.created, ...entries.result.skipped]
    const grouped = items.reduce<
      Record<string, { kidId: string; kidName: string; chores: string[] }>
    >(
      (acc, entry) => {
        const template = templatesByKey[entry.template]
        const description = template
          ? `${template.emoji} ${template.stars} ⭐️ — ${template.title}`
          : `${entry.stars} ⭐️ — ${entry.title}`

        const existing =
          acc[entry.kidId] ?? { kidId: entry.kidId, kidName: entry.kidName, chores: [] }
        existing.chores.push(description)
        acc[entry.kidId] = existing
        return acc
      },
      {},
    )

    return (
      <ul className="mt-2 space-y-1 text-sm">
        {Object.values(grouped).map((entry) => (
          <li
            key={entry.kidId}
            className="flex flex-col rounded-md border border-emerald-100 bg-white/60 px-3 py-2 text-emerald-900 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/60 dark:text-emerald-50"
          >
            <span className="font-semibold">{entry.kidName}</span>
            <span className="mt-1 space-y-0.5 text-emerald-800 dark:text-emerald-100">
              {entry.chores.map((chore) => (
                <span key={chore} className="block">
                  {chore}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="day" value={dayIso} />

      <div className="grid gap-5">
        {BEDTIME_TEMPLATES.map((template) => (
          <div
            key={template.key}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Bedtime option
                </p>
                <h2 className="text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100">
                  {template.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Add this as a morning chore for the kids it applies to.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                <span className="text-base">{template.emoji}</span>
                <span>
                  {template.stars} {template.stars === 1 ? 'star' : 'stars'}
                </span>
              </div>
            </div>

            <div className="grid gap-3 bg-white px-4 py-4 dark:bg-slate-950 sm:grid-cols-2 lg:grid-cols-3">
              {kids.map((kid) => {
                const checked = defaultSelections[template.key]?.includes(kid.id)
                return (
                  <label
                    key={`${template.key}-${kid.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-semibold text-slate-900 shadow-inner transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700"
                  >
                    <input
                      type="checkbox"
                      name={template.key}
                      value={kid.id}
                      defaultChecked={checked}
                      className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-slate-300"
                      aria-label={`Add ${kid.name}`}
                    />
                    <div className="flex flex-col">
                      <span>{kid.name}</span>
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                        Assign to {kid.name} for this morning.
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {state.status === 'error' ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 shadow-inner dark:border-rose-900/50 dark:bg-rose-950 dark:text-rose-100">
            {state.message}
          </div>
        ) : null}
        {state.status === 'success' ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-inner dark:border-emerald-900/50 dark:bg-emerald-950 dark:text-emerald-100">
            <p className="font-semibold">
              Bedtime chores are ready for {state.result.dayIso}.
            </p>
            {state.result.created.length ? (
              <p className="mt-1 text-emerald-800 dark:text-emerald-100">
                Added {state.result.created.length} new chore
                {state.result.created.length === 1 ? '' : 's'}.
              </p>
            ) : (
              <p className="mt-1 text-emerald-800 dark:text-emerald-100">
                No new chores were added because they already exist for today.
              </p>
            )}
            {state.result.skipped.length ? (
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-200">
                {state.result.skipped.length} chore
                {state.result.skipped.length === 1 ? '' : 's'} were already scheduled and left
                untouched.
              </p>
            ) : null}
            {renderResultList(state)}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-[1px] hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-75 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:outline-slate-100"
        >
          {pending ? 'Saving...' : 'Create bedtime chores'}
        </button>
      </div>
    </form>
  )
}
