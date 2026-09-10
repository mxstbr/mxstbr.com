'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type {
  ChoreCard,
  CommandResult,
  KidView,
  Period,
} from 'app/lib/chores2/types'
import type { Command } from 'app/lib/chores2/commands'
import { ChildPanel, type PanelName } from './panels'
import type { PendingAction } from './use-board'
import { useChoreSounds } from './sounds'

type Props = {
  kid: KidView
  day: string
  period: Period | null
  stale: boolean
  request?: PendingAction
  act: (
    kidId: string,
    command: Command,
    retry?: boolean,
  ) => Promise<CommandResult | null>
  dismiss: (kidId: string) => void
  showPacking: number
}
function palette(color: string, id: string): CSSProperties {
  const fallback =
    id === 'kid-2' ? '#af4f13' : id === 'kid-3' ? '#9250b3' : '#2870c6'
  const value = /^#[\da-f]{6}$/i.test(color) ? color : fallback
  const rgb = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16))
  const mix = (target: number, amount: number) =>
    `rgb(${rgb.map((n) => Math.round(n * (1 - amount) + target * amount)).join(',')})`
  const luminance = (amount: number) =>
    rgb
      .map((n) => (n * (1 - amount)) / 255)
      .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4))
      .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0)
  let darken = 0
  while (luminance(darken) > 0.175 && darken < 0.85) darken += 0.05
  return {
    '--c2-identity': mix(0, Math.max(darken, 0.2)),
    '--c2-tint': mix(255, 0.83),
    '--c2-shadow': mix(255, 0.6),
    '--c2-button': mix(0, darken),
    '--c2-button-shadow': mix(0, Math.min(darken + 0.25, 1)),
    '--c2-dark-tint': mix(24, 0.7),
    '--c2-dark-identity': mix(255, 0.65),
    '--c2-dark-button': mix(255, 0.6),
  } as CSSProperties
}
export function KidColumn({
  kid,
  day,
  period,
  stale,
  request,
  act,
  dismiss,
  showPacking,
}: Props) {
  const [view, setView] = useState<PanelName>('now')
  const [selected, setSelected] = useState<string | null>(null)
  const [isBonus, setIsBonus] = useState(false)
  const [note, setNote] = useState('')
  const [burst, setBurst] = useState(0)
  const [dailyParty, setDailyParty] = useState(false)
  const [reading, setReading] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speech = useRef<{
    audio?: HTMLAudioElement
    url?: string
    controller?: AbortController
  }>({})
  const previousDaily = useRef(kid.dailyProgress.earned)
  const previousBalance = useRef(kid.balance)
  const primary = useRef<HTMLButtonElement>(null)
  const sounds = useChoreSounds()
  const waiting = kid.periodProgress.pending
  const completedIds = new Set(
    kid.completed
      .filter((c) => c.status === 'approved')
      .map((c) => c.occurrenceId),
  )
  const candidates = isBonus ? kid.bonus : kid.chores
  const current = stale
    ? undefined
    : candidates.find((c) => c.occurrenceId === selected) ||
      (isBonus
        ? undefined
        : candidates.find((c) => !completedIds.has(c.occurrenceId)))
  const busy = Boolean(request?.busy)
  const blocked = busy || Boolean(request?.error)
  const close = () => {
    setView('now')
    setSelected(null)
    setIsBonus(false)
  }
  const touch = () => {
    if (idle.current) clearTimeout(idle.current)
    idle.current = setTimeout(close, 90000)
  }
  useEffect(
    () => () => {
      if (idle.current) clearTimeout(idle.current)
    },
    [],
  )
  useEffect(() => {
    close()
    setNote('')
    setDailyParty(false)
  }, [day, period])
  useEffect(() => {
    if (stale) close()
  }, [stale])
  useEffect(() => {
    if (showPacking) {
      setView('packing')
      touch()
    }
  }, [showPacking])
  useEffect(() => {
    if (kid.dailyProgress.earned && !previousDaily.current) setDailyParty(true)
    if (kid.balance > previousBalance.current && !busy)
      setNote(`+${kid.balance - previousBalance.current} stars arrived!`)
    previousDaily.current = kid.dailyProgress.earned
    previousBalance.current = kid.balance
  }, [kid.dailyProgress.earned, kid.balance, busy])
  useEffect(() => {
    setCooldown(Boolean(current?.availableAt))
    if (!current?.availableAt) return
    const timer = setTimeout(() => setCooldown(false), 5000)
    return () => clearTimeout(timer)
  }, [current?.availableAt])
  useEffect(() => {
    speech.current.controller?.abort()
    speech.current.audio?.pause()
    if (speech.current.url) URL.revokeObjectURL(speech.current.url)
    speech.current = {}
    setReading(false)
    return () => {
      speech.current.controller?.abort()
      speech.current.audio?.pause()
      if (speech.current.url) URL.revokeObjectURL(speech.current.url)
    }
  }, [current?.occurrenceId, stale])
  async function perform(command: Command, retry = false) {
    touch()
    if (command.action === 'submit' || command.action === 'redeem')
      sounds.prime(command.action === 'redeem' ? 'reward' : 'chore')
    const result = await act(kid.id, command, retry)
    if (!result) return
    setNote(result.message)
    if (
      result.status === 'completed' ||
      result.status === 'approved' ||
      result.status === 'redeemed'
    ) {
      sounds.play(result.status === 'redeemed' ? 'reward' : 'chore')
      setBurst((n) => n + 1)
    }
    if (result.dailyBonus) setDailyParty(true)
    if (['submit', 'redeem', 'undo', 'set_color'].includes(command.action))
      close()
    setTimeout(() => primary.current?.focus({ preventScroll: true }), 0)
  }
  function select(c: ChoreCard) {
    setSelected(c.occurrenceId)
    setIsBonus(c.group === 'bonus')
    setView('now')
    touch()
  }
  async function hear() {
    if (!current || reading) return
    setReading(true)
    touch()
    // Unlock this same audio element during the tap for older iPad Safari.
    const audio = new Audio('/static/audio/chores/cha-ching-money.mp3')
    audio.muted = true
    const primed = audio
      .play()
      .then(() => {
        audio.pause()
        audio.currentTime = 0
      })
      .catch(() => {})
    speech.current.audio = audio
    const controller = new AbortController()
    speech.current.controller = controller
    try {
      const r = await fetch('/api/chores2/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ occurrenceId: current.occurrenceId }),
        signal: controller.signal,
      })
      if (!r.ok) throw new Error('Read-aloud is unavailable. Please try again.')
      const url = URL.createObjectURL(await r.blob())
      await primed
      if (controller.signal.aborted) {
        URL.revokeObjectURL(url)
        return
      }
      speech.current = { controller, url, audio }
      audio.src = url
      audio.muted = false
      audio.onended = () => setReading(false)
      await audio.play()
    } catch (e) {
      if (!controller.signal.aborted) {
        setReading(false)
        setNote(e instanceof Error ? e.message : 'Please tap Hear it again.')
      }
    }
  }
  const allDone =
    kid.periodProgress.total > 0 &&
    kid.periodProgress.completed === kid.periodProgress.total
  const allSubmitted =
    kid.periodProgress.total > 0 &&
    kid.periodProgress.completed + waiting === kid.periodProgress.total
  const doneTitle = stale
    ? 'Getting your chores…'
    : allDone
      ? 'All done for now.'
      : allSubmitted && waiting
        ? 'Your part is done.'
        : 'Nothing to do right now.'
  return (
    <section
      className="c2-child"
      data-kid={kid.id}
      aria-label={`${kid.name} chores`}
      style={palette(kid.color, kid.id)}
      onPointerDown={touch}
      onKeyDown={touch}
    >
      <header className="c2-child-head">
        <button
          className="c2-name"
          aria-label={`Choose ${kid.name}’s color`}
          onClick={() => setView('color')}
        >
          {kid.name}
        </button>
        <button
          className="c2-wallet"
          aria-label={`${kid.name} rewards, ${kid.balance} stars`}
          onClick={() => setView('rewards')}
        >
          {kid.balance} ★
        </button>
      </header>
      {view === 'now' || stale ? (
        <>
          <div className="c2-focus">
            <div className="c2-stage">
              {current ? (
                <>
                  <div className="c2-task-top">
                    <span className="c2-task-emoji" aria-hidden="true">
                      {current.emoji}
                    </span>
                    <div className="c2-task-tools">
                      <span className="c2-label">
                        {isBonus ? 'Bonus · anytime' : 'Do this now'}
                        {current.isNew && <small>New</small>}
                      </span>
                      <button
                        className="c2-read"
                        disabled={reading}
                        onClick={hear}
                        aria-label={`Read ${kid.name}’s chore aloud`}
                      >
                        {reading ? 'Reading…' : '♪ Hear it'}
                      </button>
                    </div>
                  </div>
                  <h2 className="c2-task-title">{current.title}</h2>
                  {current.requiresApproval && (
                    <p className="c2-task-detail">A parent checks this</p>
                  )}
                </>
              ) : (
                <>
                  <div className="c2-done-mark" aria-hidden="true">
                    {stale
                      ? '🌤️'
                      : allDone
                        ? '🙌'
                        : allSubmitted && waiting
                          ? '💌'
                          : '🌈'}
                  </div>
                  <h2 className="c2-task-title">{doneTitle}</h2>
                  {!stale && (
                    <p className="c2-done-text">
                      {waiting > 0 && (
                        <>
                          {waiting} waiting for a parent.
                          <br />
                        </>
                      )}
                      You can go play.
                    </p>
                  )}
                </>
              )}
            </div>
            {current ? (
              <button
                ref={primary}
                className="c2-primary"
                disabled={blocked || stale || cooldown}
                onPointerDown={() => sounds.prime('chore')}
                onClick={() =>
                  perform({
                    action: 'submit',
                    occurrenceId: current.occurrenceId,
                  })
                }
              >
                <span>
                  {busy
                    ? 'Saving…'
                    : cooldown
                      ? 'One moment…'
                      : current.requiresApproval
                        ? 'Ask for approval'
                        : 'I did it!'}
                </span>
                <span className="c2-action-stars">+{current.stars} ★</span>
              </button>
            ) : (
              <div className="c2-button-space" />
            )}
          </div>
          <button
            className="c2-choose"
            style={{
              visibility:
                !stale &&
                (isBonus ||
                  kid.chores.length > 1 ||
                  (allDone && kid.chores.length > 0))
                  ? 'visible'
                  : 'hidden',
            }}
            onClick={() => (isBonus ? close() : setView('choose'))}
          >
            {isBonus ? 'Back to my chores' : 'Choose another'}
          </button>
          {kid.periodProgress.total > 0 && !isBonus && !stale ? (
            <button
              className="c2-period-reward"
              onClick={() => setView('progress')}
              aria-label={`${kid.periodProgress.completed} of ${kid.periodProgress.total} done. ${kid.periodProgress.earned ? 'Two bonus stars earned.' : 'Finish all tasks in this period for two bonus stars.'}`}
            >
              <span className="c2-period-title">
                <span>
                  {kid.periodProgress.earned
                    ? 'Bonus earned!'
                    : allSubmitted && waiting
                      ? 'Waiting for approval'
                      : `Finish this ${period}`}
                </span>
                <strong>{kid.periodProgress.earned ? '✓ ' : ''}+2 ★</strong>
              </span>
              <span className="c2-stamps" aria-hidden="true">
                {Array.from({ length: kid.periodProgress.total }, (_, i) => (
                  <span
                    key={i}
                    className={`c2-stamp ${i < kid.periodProgress.completed ? 'done' : i < kid.periodProgress.completed + waiting ? 'pending' : ''}`}
                  >
                    {i < kid.periodProgress.completed
                      ? '✓'
                      : i < kid.periodProgress.completed + waiting
                        ? '◷'
                        : i + 1}
                  </span>
                ))}
              </span>
              <span className="c2-period-count">
                {kid.periodProgress.completed} of {kid.periodProgress.total}{' '}
                done{waiting ? ` · ${waiting} waiting` : ''}
              </span>
            </button>
          ) : (
            <div className="c2-period-space">
              <button onClick={() => setView('progress')}>My progress</button>
            </div>
          )}
          <div className="c2-bottom">
            <button disabled={stale} onClick={() => setView('bonus')}>
              Bonus chores
            </button>
            <button disabled={stale} onClick={() => setView('done')}>
              Done{kid.completed.length ? ` · ${kid.completed.length}` : ''}
            </button>
          </div>
        </>
      ) : (
        <ChildPanel
          key={view}
          view={view}
          kid={kid}
          day={day}
          disabled={blocked || stale}
          onView={setView}
          onSelect={select}
          onAct={(c) => void perform(c)}
          onPrimeReward={() => sounds.prime('reward')}
        />
      )}
      <div className="c2-note" role="status" aria-live="polite">
        {busy ? 'Saving…' : note}
      </div>
      {request?.error && (
        <div className="c2-action-error" role="alert">
          <p>{request.error}</p>
          <button
            disabled={busy}
            onClick={() => perform(request.command, true)}
          >
            Retry saving
          </button>
          {request.retryable === false && (
            <button onClick={() => dismiss(kid.id)}>Back to board</button>
          )}
        </div>
      )}
      {burst > 0 && (
        <div key={burst} className="c2-burst" aria-hidden="true">
          <span>⭐</span>
          <span>⭐</span>
          <span>⭐</span>
        </div>
      )}
      {dailyParty && (
        <div className="c2-party" role="dialog" aria-label="Daily bonus earned">
          <span aria-hidden="true">🎉</span>
          <h2>You did it!</h2>
          <p>All your required chores for today are done.</p>
          <strong>+10 bonus stars</strong>
          <button className="c2-primary" onClick={() => setDailyParty(false)}>
            Yay!
          </button>
        </div>
      )}
    </section>
  )
}
