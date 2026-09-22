'use client'
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="chores-lock">
      <span aria-hidden="true">🌤️</span>
      <h1>Let’s try again.</h1>
      <p>Your saved stars are still there.</p>
      <button className="chores-button" onClick={reset}>
        Reload the board
      </button>
    </main>
  )
}
