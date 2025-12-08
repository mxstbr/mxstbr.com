'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { PARENTAL_PIN } from './parental-pin'

export function ParentalPinGate({ children }: { children: React.ReactNode }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.sessionStorage.getItem('chores-parent-pin') : null
    if (stored === PARENTAL_PIN) {
      setUnlocked(true)
    }
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = pin.trim()
    if (normalized.length !== 4) {
      setError('Enter all four digits.')
      return
    }
    if (normalized === PARENTAL_PIN) {
      setUnlocked(true)
      setError('')
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('chores-parent-pin', PARENTAL_PIN)
      }
      return
    }
    setError('Incorrect pin. Please try again.')
  }

  if (unlocked) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950">
      <div className="mx-auto flex max-w-md flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Chores admin
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Enter parental pin</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            A parent needs to unlock this page before changes can be made.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex flex-col gap-2 text-left">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pin</span>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              value={pin}
              onChange={(event) => {
                const next = event.target.value.replace(/[^0-9]/g, '').slice(0, 4)
                setPin(next)
                setError('')
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-lg font-semibold tracking-widest text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
              placeholder="1234"
              aria-label="Parental pin"
              autoFocus
            />
          </label>
          {error ? <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p> : null}
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Unlock admin
          </button>
        </form>
      </div>
    </div>
  )
}
