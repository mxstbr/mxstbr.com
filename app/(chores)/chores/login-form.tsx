'use client'

import { useState, type FormEvent } from 'react'

export function LoginForm() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const password = new FormData(event.currentTarget).get('password')
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/chores/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await response.json()
      if (!response.ok)
        throw new Error(
          data.error?.message ||
            'Could not unlock the board. Please try again.',
        )
      window.location.replace('/chores')
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Could not connect. Please try again.',
      )
      setBusy(false)
    }
  }
  return (
    <main className="chores-lock">
      <span aria-hidden="true">🌈</span>
      <h1>Your chore board</h1>
      <p>Use the site password.</p>
      <form className="chores-login" onSubmit={unlock}>
        <label htmlFor="chores-password">Site password</label>
        <input
          id="chores-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={busy}
          aria-describedby={error ? 'chores-login-error' : undefined}
        />
        {error && (
          <p id="chores-login-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy}>
          {busy ? 'Opening…' : 'Open chore board'}
        </button>
      </form>
    </main>
  )
}
