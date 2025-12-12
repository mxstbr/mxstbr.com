'use client'

import { useState } from 'react'
import type { Kid } from './data'

type AddRewardFormProps = {
  kids: Kid[]
  addRewardAction: (formData: FormData) => void
}

export function AddRewardForm({ kids, addRewardAction }: AddRewardFormProps) {
  const [selectedKids, setSelectedKids] = useState<string[]>(
    kids.map((kid) => kid.id),
  )
  const [type, setType] = useState<'one-off' | 'perpetual'>('perpetual')

  const toggleKid = (id: string) => {
    setSelectedKids((prev) =>
      prev.includes(id) ? prev.filter((kidId) => kidId !== id) : [...prev, id],
    )
  }

  const selectAllKids = () => setSelectedKids(kids.map((kid) => kid.id))

  return (
    <form
      action={addRewardAction}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-semibold text-lg">Add a reward</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create treats the kids can unlock with their stars.
          </p>
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Save reward
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          Title
          <input
            name="title"
            required
            placeholder="RC car"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-hidden transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          Emoji
          <input
            name="emoji"
            maxLength={4}
            placeholder="🚗"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-hidden transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          Cost (stars)
          <input
            name="cost"
            type="number"
            min={1}
            defaultValue={5}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-hidden transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          Type
          <select
            name="rewardType"
            value={type}
            onChange={(event) =>
              setType(event.target.value as 'one-off' | 'perpetual')
            }
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-hidden transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
          >
            <option value="one-off">One-off</option>
            <option value="perpetual">Perpetual</option>
          </select>
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
            Perpetual rewards reappear after purchase.
          </span>
        </label>
      </div>

      <div className="mt-3">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
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
      </div>
    </form>
  )
}
