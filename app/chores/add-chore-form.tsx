'use client'

import { useMemo, useState } from 'react'
import type { Kid } from './data'
import { pacificWeekdayIndex } from './utils'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type AddChoreFormProps = {
  kids: Kid[]
  addChoreAction: (formData: FormData) => void
}

export function AddChoreForm({ kids, addChoreAction }: AddChoreFormProps) {
  const pacificWeekday = useMemo(() => pacificWeekdayIndex(new Date()), [])
  const [type, setType] = useState<'one-off' | 'repeated' | 'perpetual'>('one-off')
  const [cadence, setCadence] = useState<'daily' | 'weekly'>('daily')
  const [selectedDays, setSelectedDays] = useState<number[]>([pacificWeekday])
  const [timeOfDay, setTimeOfDay] = useState<'' | 'morning' | 'afternoon' | 'evening'>('morning')
  const [selectedKids, setSelectedKids] = useState<string[]>(kids.map((kid) => kid.id))

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  const toggleKid = (id: string) => {
    setSelectedKids((prev) =>
      prev.includes(id) ? prev.filter((kidId) => kidId !== id) : [...prev, id],
    )
  }

  const selectAllKids = () => setSelectedKids(kids.map((kid) => kid.id))

  return (
    <form
      action={addChoreAction}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-semibold text-lg">Add a chore</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Define the task, assign a kid, and choose how often it should show up.
          </p>
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Save chore
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          Title
          <input
            name="title"
            required
            placeholder="Pack for trip"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          Emoji
          <input
            name="emoji"
            maxLength={4}
            placeholder="🎒"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          Stars
          <input
            name="stars"
            type="number"
            min={0}
            defaultValue={1}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          Kids
          <div className="flex flex-wrap gap-2">
            {kids.map((kid) => {
              const active = selectedKids.includes(kid.id)
              return (
                <label
                  key={kid.id}
                  className={`flex items-center gap-2 rounded-md border px-2 py-1 text-xs font-semibold transition ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-300 text-slate-700 hover:border-slate-500 dark:border-slate-700 dark:text-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="kidIds"
                    value={kid.id}
                    checked={active}
                    onChange={() => toggleKid(kid.id)}
                    className="sr-only"
                  />
                  {kid.name}
                </label>
              )
            })}
            <button
              type="button"
              onClick={selectAllKids}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
            >
              All kids
            </button>
          </div>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          Time of day
          <select
            name="timeOfDay"
            value={timeOfDay}
            onChange={(event) =>
              setTimeOfDay(event.target.value as '' | 'morning' | 'afternoon' | 'evening')
            }
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
          >
            <option value="">Any time</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          Type
          <select
            name="type"
            value={type}
            onChange={(event) =>
              setType(event.target.value as 'one-off' | 'repeated' | 'perpetual')
            }
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
          >
            <option value="one-off">One-off</option>
            <option value="repeated">Repeated</option>
            <option value="perpetual">Perpetual</option>
          </select>
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
            One-off disappears when done, perpetual reopens instantly.
          </span>
        </label>

        {type === 'repeated' ? (
          <>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
              Frequency
              <select
                name="cadence"
                value={cadence}
                onChange={(event) => setCadence(event.target.value as 'daily' | 'weekly')}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                Daily chores re-open every day; weekly ones only on selected days.
              </span>
            </label>

            {cadence === 'weekly' ? (
              <div className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Days
                <div className="flex flex-wrap gap-2">
                  {DAY_LABELS.map((label, index) => {
                    const active = selectedDays.includes(index)
                    return (
                      <label
                        key={index}
                        className={`flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm transition ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                            : 'border-slate-300 text-slate-700 hover:border-slate-500 dark:border-slate-700 dark:text-slate-200'
                        }`}
                        title={DAY_NAMES[index]}
                      >
                        <input
                          type="checkbox"
                          name="daysOfWeek"
                          value={index}
                          checked={active}
                          onChange={() => toggleDay(index)}
                          className="sr-only"
                        />
                        {label}
                      </label>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </form>
  )
}
