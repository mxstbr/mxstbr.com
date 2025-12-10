"use client"

import { useMemo, useState, type ReactNode } from 'react'

import type { Chore, Kid } from '../data'
import type { TodayContext } from '../utils'
import { updateChoreSettings } from '../actions'

type RevealPanelProps = {
  label: string
  children: ReactNode
  description?: string
  defaultOpen?: boolean
}

export function RevealPanel({ label, children, description, defaultOpen }: RevealPanelProps) {
  const [open, setOpen] = useState(Boolean(defaultOpen))

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
        onClick={() => setOpen((value) => !value)}
      >
        <div className="space-y-0.5">
          <div className="text-base font-bold leading-tight">{label}</div>
          {description ? (
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400">{description}</p>
          ) : null}
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {open ? 'Hide' : 'Show'}
        </span>
      </button>
      {open ? <div className="border-t border-slate-200 p-4 dark:border-slate-800">{children}</div> : null}
    </div>
  )
}

type ChoreEditorProps = {
  chore: Chore
  kids: Kid[]
  ctx: TodayContext
}

export function ChoreEditor({ chore, kids, ctx }: ChoreEditorProps) {
  const [open, setOpen] = useState(false)
  const [cadence, setCadence] = useState<'daily' | 'weekly'>(
    chore.schedule?.cadence === 'weekly' ? 'weekly' : 'daily',
  )

  const defaultDays = useMemo(() => chore.schedule?.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6], [chore.schedule])
  const [weeklyDays, setWeeklyDays] = useState<number[]>(defaultDays)

  const toggleDay = (day: number) => {
    setWeeklyDays((current) =>
      current.includes(day) ? current.filter((entry) => entry !== day) : [...current, day].sort(),
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white/70 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Edit chore</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Update assignments, schedule, and approvals from one panel.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {open ? 'Close editor' : 'Edit settings'}
        </button>
      </div>

      {open ? (
        <form action={updateChoreSettings} className="mt-4 space-y-4">
          <input type="hidden" name="choreId" value={chore.id} />
          <input type="hidden" name="requiresApproval" value="false" />
          <input type="hidden" name="cadence" value={cadence} />

          <fieldset className="space-y-3 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Assignments & timing
            </legend>
            <div className="flex flex-wrap gap-2">
              {kids.map((kid) => {
                const active = chore.kidIds.includes(kid.id)
                return (
                  <label
                    key={kid.id}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      active
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                        : 'border-slate-300 text-slate-700 hover:border-slate-500 dark:border-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <input type="checkbox" name="kidIds" value={kid.id} defaultChecked={active} className="sr-only" />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: kid.color ?? '#0ea5e9' }} />
                    {kid.name}
                  </label>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Time</span>
                <select
                  name="timeOfDay"
                  defaultValue={chore.timeOfDay ?? ''}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">Any time</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                <input
                  type="checkbox"
                  name="requiresApproval"
                  value="true"
                  defaultChecked={chore.requiresApproval}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900"
                />
                <span>Parent pin required</span>
              </label>
            </div>
          </fieldset>

          {chore.type === 'repeated' ? (
            <fieldset className="space-y-3 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Schedule & pauses
              </legend>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <label className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition ${
                  cadence === 'daily'
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-300 text-slate-700 hover:border-slate-500 dark:border-slate-700 dark:text-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="cadenceChoice"
                    value="daily"
                    checked={cadence === 'daily'}
                    onChange={() => setCadence('daily')}
                    className="sr-only"
                  />
                  Daily
                </label>
                <label className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition ${
                  cadence === 'weekly'
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-300 text-slate-700 hover:border-slate-500 dark:border-slate-700 dark:text-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="cadenceChoice"
                    value="weekly"
                    checked={cadence === 'weekly'}
                    onChange={() => setCadence('weekly')}
                    className="sr-only"
                  />
                  Weekly
                </label>
              </div>

              {cadence === 'weekly' ? (
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                    const active = weeklyDays.includes(day)
                    return (
                      <label
                        key={`${chore.id}-day-${day}`}
                        className={`flex cursor-pointer items-center justify-center rounded-md border px-3 py-1 text-xs font-semibold transition ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                            : 'border-slate-300 text-slate-700 hover:border-slate-500 dark:border-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="daysOfWeek"
                          value={day}
                          checked={active}
                          onChange={() => toggleDay(day)}
                          className="sr-only"
                        />
                        {labels[day]}
                      </label>
                    )
                  })}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                  <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Pause until</span>
                  <input
                    type="date"
                    name="pausedUntil"
                    defaultValue={chore.pausedUntil ?? ''}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                  />
                </label>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Empty to resume immediately.
                </span>
              </div>
            </fieldset>
          ) : null}

          {chore.type === 'one-off' ? (
            <fieldset className="space-y-3 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                One-off timing
              </legend>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Date
                <input
                  type="date"
                  name="scheduledFor"
                  defaultValue={chore.scheduledFor ?? ctx.todayIso}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </label>
            </fieldset>
          ) : null}

          <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
            <span>Save applies all changes above at once.</span>
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Save changes
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
