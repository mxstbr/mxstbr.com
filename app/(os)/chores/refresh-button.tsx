'use client'

import { useState } from 'react'

export function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  return (
    <button
      type="button"
      aria-label="Refresh chores"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/80 hover:text-slate-950 focus:outline-hidden focus:ring-2 focus:ring-slate-400 disabled:opacity-70 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus:ring-slate-500"
      onClick={() => {
        setIsRefreshing(true)
        window.location.reload()
      }}
      disabled={isRefreshing}
      title="Refresh"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
      >
        <path
          d="M20 7v5h-5M4 17v-5h5M6.1 8.5A7 7 0 0 1 18.7 7M5.3 17A7 7 0 0 0 17.9 15.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </button>
  )
}
