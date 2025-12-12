'use client'

import { type FormEvent, createContext, useContext, useEffect, useState } from 'react'
import { PARENTAL_PIN } from '../chores/parental-pin'

interface MoneyVisibilityContextValue {
  unlocked: boolean
  requestUnlock: () => void
}

const MoneyVisibilityContext = createContext<MoneyVisibilityContextValue | null>(null)

export function MoneyVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const storedFinancePin = typeof window !== 'undefined' ? window.sessionStorage.getItem('finance-parent-pin') : null
    const storedChoresPin = typeof window !== 'undefined' ? window.sessionStorage.getItem('chores-parent-pin') : null
    if (storedFinancePin === PARENTAL_PIN || storedChoresPin === PARENTAL_PIN) {
      setUnlocked(true)
    }
  }, [])

  const requestUnlock = () => {
    setShowPrompt(true)
  }

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
      setShowPrompt(false)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('finance-parent-pin', PARENTAL_PIN)
        window.sessionStorage.setItem('chores-parent-pin', PARENTAL_PIN)
      }
      return
    }
    setError('Incorrect pin. Please try again.')
  }

  return (
    <MoneyVisibilityContext.Provider value={{ unlocked, requestUnlock }}>
      {children}
      {showPrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Finance</p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Enter parental pin</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">Amounts are hidden until a parent unlocks them.</p>
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
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-lg font-semibold tracking-widest text-slate-900 shadow-xs outline-hidden transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                  placeholder="1234"
                  aria-label="Parental pin"
                  autoFocus
                />
              </label>
              {error ? <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p> : null}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex flex-1 items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Unlock amounts
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPrompt(false)
                    setPin('')
                    setError('')
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </MoneyVisibilityContext.Provider>
  )
}

export function useMoneyVisibility() {
  const context = useContext(MoneyVisibilityContext)
  if (!context) {
    throw new Error('useMoneyVisibility must be used within MoneyVisibilityProvider')
  }
  return context
}

export function BlurredValue({ children, className }: { children: React.ReactNode; className?: string }) {
  const { unlocked, requestUnlock } = useMoneyVisibility()

  if (unlocked) {
    return <span className={className}>{children}</span>
  }

  return (
    <button type="button" onClick={requestUnlock} className={`relative cursor-pointer ${className ?? ''}`}>
      <span aria-hidden className="blur-sm select-none">{children}</span>
      <span className="sr-only">Hidden amount. Click to enter the parental pin.</span>
    </button>
  )
}
