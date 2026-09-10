'use client'
import { useEffect, useRef, useState } from 'react'

export default function Activate() {
  const started = useRef(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (started.current) return
    started.current = true
    const code =
      new URLSearchParams(window.location.hash.slice(1)).get('code') || ''
    history.replaceState(null, '', '/chores2/activate')
    void fetch('/api/chores2/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok)
          throw new Error(data.error?.message || 'Could not open this board.')
        window.location.replace('/chores2')
      })
      .catch((e) => setError(e.message))
  }, [])
  return (
    <main className="c2-lock">
      <span aria-hidden="true">🌈</span>
      <h1>{error ? 'We need a new link.' : 'Opening your board…'}</h1>
      <p role="status">{error || 'Getting everything ready.'}</p>
    </main>
  )
}
