'use client'

import '../global.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function GlobalError({
  error: _error,
  reset: _reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <html
      lang="en"
      className={`${inter.className} text-black`}
      style={{ backgroundColor: '#c0c0c0' }}
    >
      <body className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50/70 via-white to-slate-100/80 px-6 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-slate-700">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              Refresh
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
