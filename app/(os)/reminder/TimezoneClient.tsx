'use client'

import React, { useMemo, useState } from 'react'

export default function TimezoneClient({
  initialTimezone,
}: {
  initialTimezone: string | null
}) {
  const [current, setCurrent] = useState<string>(initialTimezone ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const browserTz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  )

  async function onUpdate() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/reminder/timezone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: browserTz }),
      })
      if (!res.ok) throw new Error('Failed to update timezone')
      setCurrent(browserTz)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="prose max-w-none py-6">
      {error ? <p style={{ color: 'red' }}>{error}</p> : null}
      <p>
        <strong>Current timezone:</strong> {current || 'not set'}
      </p>
      <p>
        <strong>Browser timezone:</strong> {browserTz}
      </p>
      <button
        className="rounded-sm bg-black px-4 py-2 font-semibold text-white disabled:opacity-50"
        onClick={onUpdate}
        disabled={busy}
      >
        {busy ? 'Updating…' : 'Update to Browser Timezone'}
      </button>
    </div>
  )
}
