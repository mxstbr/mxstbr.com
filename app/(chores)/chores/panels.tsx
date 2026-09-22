'use client'
import { useEffect, useState } from 'react'
import type { ChoreCard, KidView } from 'app/lib/chores/types'
import type { Command } from 'app/lib/chores/commands'
import { PACKING_ITEMS } from 'app/lib/chores/packing'

export type PanelName =
  | 'now'
  | 'choose'
  | 'bonus'
  | 'done'
  | 'rewards'
  | 'packing'
  | 'color'
  | 'progress'
  | `reward:${string}`
type Props = {
  view: PanelName
  kid: KidView
  day: string
  disabled: boolean
  onView: (view: PanelName) => void
  onBack: () => void
  onSelect: (card: ChoreCard) => void
  onAct: (command: Command) => void
  onPrimeReward: () => void
}
const title = (v: PanelName) =>
  ({
    choose: 'For right now',
    bonus: 'Bonus chores',
    done: 'Done & waiting',
    rewards: 'Rewards',
    packing: 'Packing',
    color: 'My color',
    progress: 'My progress',
  })[v] || 'Your reward'
const dateLabel = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
const shift = (day: string, n: number) => {
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function ChildPanel({
  view,
  kid,
  day,
  disabled,
  onView,
  onBack,
  onSelect,
  onAct,
  onPrimeReward,
}: Props) {
  const [color, setColor] = useState(kid.color)
  const [reset, setReset] = useState(false)
  const [summaryDay, setSummaryDay] = useState(day)
  const [summary, setSummary] = useState<{
    earned: number
    spent: number
    progress: KidView['dailyProgress']
  } | null>(null)
  const [summaryError, setSummaryError] = useState('')
  useEffect(() => {
    if (view !== 'progress') return
    const controller = new AbortController()
    setSummary(null)
    setSummaryError('')
    void fetch(`/api/chores/summary?day=${summaryDay}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok)
          throw new Error(data.error?.message || 'Could not load progress.')
        setSummary(data.kids.find((k: { kidId: string }) => k.kidId === kid.id))
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setSummaryError(e.message)
      })
    return () => controller.abort()
  }, [view, summaryDay, kid.id, kid.dailyProgress.completed, kid.balance])
  const choose = (cards: ChoreCard[]) =>
    cards.length ? (
      cards.map((c) => (
        <button
          className="chores-row"
          key={c.occurrenceId}
          disabled={disabled}
          onClick={() => onSelect(c)}
        >
          <span className="chores-row-icon" aria-hidden="true">
            {c.emoji}
          </span>
          <span className="chores-row-label">
            {c.title}
            {c.isNew && <small>New</small>}
          </span>
          <span className="chores-row-value">{c.stars} ★</span>
        </button>
      ))
    ) : (
      <p className="chores-panel-note">Nothing else to do right now.</p>
    )
  const selectedReward = view.startsWith('reward:')
    ? kid.rewards.find((r) => r.id === view.slice(7))
    : null
  return (
    <div className="chores-panel">
      <div className="chores-panel-head">
        <h3>{title(view)}</h3>
        <button onClick={onBack}>Back</button>
      </div>
      <div className="chores-panel-scroll">
        {view === 'choose' && (
          <>
            {choose(kid.chores)}
            <button
              className="chores-choose"
              onClick={() => onView('progress')}
            >
              My progress
            </button>
          </>
        )}
        {view === 'bonus' && (
          <>
            <p className="chores-panel-note">
              Something extra, whenever you want.
            </p>
            {choose(kid.bonus)}
          </>
        )}
        {view === 'done' &&
          (kid.completed.length ? (
            kid.completed
              .slice()
              .reverse()
              .map((c) => (
                <div className="chores-row" key={c.submissionId}>
                  <span className="chores-row-icon" aria-hidden="true">
                    {c.emoji}
                  </span>
                  <span className="chores-row-label">
                    {c.title}
                    <small>
                      {c.status === 'pending'
                        ? c.notificationStatus === 'retrying'
                          ? 'Request saved · retrying notification'
                          : c.notificationStatus === 'queued'
                            ? 'Request saved · notification queued'
                            : 'Waiting for your parent'
                        : `${c.stars} ${c.stars === 1 ? 'star' : 'stars'} earned`}
                    </small>
                  </span>
                  {c.status === 'approved' && (
                    <button
                      disabled={disabled}
                      onClick={() =>
                        onAct({ action: 'undo', submissionId: c.submissionId })
                      }
                    >
                      Undo
                    </button>
                  )}
                </div>
              ))
          ) : (
            <p className="chores-panel-note">
              Your finished chores will appear here.
            </p>
          ))}
        {view === 'rewards' && (
          <>
            <p className="chores-panel-note">You have {kid.balance} stars.</p>
            {kid.rewards.length ? (
              kid.rewards.map((r) => (
                <button
                  className="chores-row"
                  key={r.id}
                  onClick={() => onView(`reward:${r.id}`)}
                >
                  <span className="chores-row-icon" aria-hidden="true">
                    {r.emoji}
                  </span>
                  <span className="chores-row-label">
                    {r.title}
                    <small>
                      {r.redeemed
                        ? 'Already yours ✓'
                        : kid.balance < r.cost
                          ? `${r.cost - kid.balance} more stars to go`
                          : 'You can get this!'}
                    </small>
                  </span>
                  <span className="chores-row-value">{r.cost} ★</span>
                </button>
              ))
            ) : (
              <p className="chores-panel-note">No rewards here yet.</p>
            )}
          </>
        )}
        {selectedReward && (
          <div className="chores-reward-detail">
            <span className="chores-detail-emoji" aria-hidden="true">
              {selectedReward.emoji}
            </span>
            <h3>{selectedReward.title}</h3>
            <p>{selectedReward.cost} stars</p>
            <p className="chores-panel-note">
              {selectedReward.redeemed
                ? 'You already have this one.'
                : kid.balance >= selectedReward.cost
                  ? `You’ll have ${kid.balance - selectedReward.cost} stars left.`
                  : `${selectedReward.cost - kid.balance} more stars to go.`}
            </p>
            <button
              className="chores-primary"
              disabled={
                disabled ||
                selectedReward.redeemed ||
                kid.balance < selectedReward.cost
              }
              onPointerDown={onPrimeReward}
              onClick={() =>
                onAct({
                  action: 'redeem',
                  kidId: kid.id,
                  rewardId: selectedReward.id,
                  expectedCost: selectedReward.cost,
                })
              }
            >
              Get this reward
            </button>
            <button className="chores-choose" onClick={() => onView('rewards')}>
              Keep my stars
            </button>
          </div>
        )}
        {view === 'packing' && (
          <>
            <p className="chores-panel-note">
              {PACKING_ITEMS.filter((i) => kid.packing[i.id]).length} of{' '}
              {PACKING_ITEMS.length} packed
            </p>
            <progress
              className="chores-packing-progress"
              aria-label={`${kid.name} packing progress`}
              value={PACKING_ITEMS.filter((i) => kid.packing[i.id]).length}
              max={PACKING_ITEMS.length}
            />
            <div className="chores-packing-actions">
              <button
                disabled={disabled}
                onClick={() =>
                  onAct({ action: 'packing', kidId: kid.id, checked: true })
                }
              >
                All packed
              </button>
              <button
                disabled={disabled}
                onClick={() =>
                  onAct({ action: 'packing', kidId: kid.id, checked: false })
                }
              >
                Clear mine
              </button>
            </div>
            {PACKING_ITEMS.map((i) => (
              <label className="chores-row chores-pack-item" key={i.id}>
                <input
                  type="checkbox"
                  checked={kid.packing[i.id] === true}
                  disabled={disabled}
                  onChange={(e) =>
                    onAct({
                      action: 'packing',
                      kidId: kid.id,
                      itemId: i.id,
                      checked: e.target.checked,
                    })
                  }
                />
                <span className="chores-row-icon" aria-hidden="true">
                  {i.emoji}
                </span>
                <span className="chores-row-label">{i.title}</span>
              </label>
            ))}
            {reset ? (
              <div className="chores-confirm">
                <p>Clear everyone’s packing for a new trip?</p>
                <button
                  disabled={disabled}
                  onClick={() => {
                    onAct({ action: 'packing', checked: false })
                    setReset(false)
                  }}
                >
                  Yes, new trip
                </button>
                <button onClick={() => setReset(false)}>
                  Keep our progress
                </button>
              </div>
            ) : (
              <button className="chores-choose" onClick={() => setReset(true)}>
                New trip for everyone
              </button>
            )}
          </>
        )}
        {view === 'color' && (
          <>
            <p className="chores-panel-note">Pick your favorite color.</p>
            <div className="chores-colors">
              {[
                '#2870c6',
                '#af4f13',
                '#9250b3',
                '#23844e',
                '#c13968',
                '#967200',
                '#ffffff',
              ].map((c) => (
                <button
                  key={c}
                  className="chores-swatch"
                  style={{ background: c }}
                  aria-label={`Choose ${c}`}
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                >
                  {color === c ? '✓' : ''}
                </button>
              ))}
            </div>
            <label className="chores-custom-color">
              Another color{' '}
              <input
                type="color"
                value={/^#[\da-f]{6}$/i.test(color) ? color : '#2870c6'}
                onChange={(e) => setColor(e.target.value)}
              />
            </label>
            <button
              className="chores-primary"
              disabled={disabled}
              onClick={() =>
                onAct({ action: 'set_color', kidId: kid.id, color })
              }
            >
              Save my color
            </button>
            <button className="chores-choose" onClick={() => onView('now')}>
              Cancel
            </button>
          </>
        )}
        {view === 'progress' && (
          <>
            <div className="chores-date-controls">
              <button
                aria-label="Previous day"
                onClick={() => setSummaryDay(shift(summaryDay, -1))}
              >
                ‹
              </button>
              <span>{dateLabel(summaryDay)}</span>
              <button
                aria-label="Next day"
                onClick={() => setSummaryDay(shift(summaryDay, 1))}
              >
                ›
              </button>
            </div>
            {summaryDay !== day && (
              <button
                className="chores-choose"
                onClick={() => setSummaryDay(day)}
              >
                Back to today
              </button>
            )}
            <div role="status">
              {summaryError ? (
                <p>{summaryError}</p>
              ) : summary ? (
                <>
                  <p className="chores-big-number">
                    {summary.progress.completed} / {summary.progress.total}
                  </p>
                  <p className="chores-panel-note">
                    {summaryDay > day
                      ? 'Scheduled tasks'
                      : 'Required tasks completed'}
                    {summary.progress.pending
                      ? ` · ${summary.progress.pending} waiting`
                      : ''}
                  </p>
                  <p className="chores-period-bonus">
                    Finish every task in a time period
                    <strong>+2 ★ per period</strong>
                  </p>
                  {summaryDay <= day && (
                    <p className="chores-panel-note">
                      {summary.earned} stars added · {summary.spent} stars used
                      or undone
                    </p>
                  )}
                </>
              ) : (
                <p className="chores-panel-note">Loading progress…</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
