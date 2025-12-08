'use client'

import { useState } from 'react'

export function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  return (
    <button
      type="button"
      aria-label="Refresh chores"
      className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-white text-lg shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:focus:ring-slate-500"
      onClick={() => {
        setIsRefreshing(true)
        window.location.reload()
      }}
      disabled={isRefreshing}
      title="Refresh"
    >
      🔄
    </button>
  )
}
