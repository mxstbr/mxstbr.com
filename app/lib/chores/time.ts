import { PERIODS, type Group, type Period } from './types'

export const TIME_ZONE = 'America/Los_Angeles'
// Pacific windows share their boundaries so the board and command checks agree.
export const WINDOWS: Record<Period, [number, number]> = {
  morning: [6 * 60, 7 * 60 + 30],
  'before-lunch': [7 * 60 + 30, 12 * 60],
  afternoon: [12 * 60, 17 * 60],
  evening: [17 * 60, 20 * 60 + 15],
  night: [20 * 60 + 15, 22 * 60],
}
export const PERIOD_LABELS: Record<Group, string> = {
  morning: 'Morning',
  'before-lunch': 'Before lunch',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
  bonus: 'Bonus',
}
const boundaries = Array.from(
  new Set([...Object.values(WINDOWS).flat(), 1440]),
).sort((a, b) => a - b)
const clockTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
export const TIME_WINDOWS = PERIODS.map((id) => ({
  id,
  name: PERIOD_LABELS[id],
  opensAt: clockTime(WINDOWS[id][0]),
  closesAt: clockTime(WINDOWS[id][1]),
}))
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})
function parts(date: Date) {
  return Object.fromEntries(
    formatter.formatToParts(date).map((p) => [p.type, p.value]),
  )
}
export function pacificDay(date: Date): string {
  const p = parts(date)
  return `${p.year}-${p.month}-${p.day}`
}
export function validDay(day: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    !Number.isNaN(Date.parse(day)) &&
    new Date(`${day}T12:00:00Z`).toISOString().slice(0, 10) === day
  )
}
export function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}
export function weekday(day: string) {
  return new Date(`${day}T12:00:00Z`).getUTCDay()
}
export function pacificInstant(day: string, minutes: number): string {
  if (minutes === 1440) return pacificInstant(shiftDay(day, 1), 0)
  const target = Date.parse(`${day}T00:00:00Z`) + minutes * 60000
  let guess = target + 8 * 3600000
  for (let i = 0; i < 3; i++) {
    const p = parts(new Date(guess))
    const represented = Date.parse(
      `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`,
    )
    const correction = target - represented
    if (!correction) break
    guess += correction
  }
  return new Date(guess).toISOString()
}
export function windowFor(day: string, group: Group) {
  const [start, end] = group === 'bonus' ? [0, 1440] : WINDOWS[group]
  return {
    opensAt: pacificInstant(day, start),
    closesAt: pacificInstant(day, end),
  }
}
export function currentTime(now: Date) {
  const day = pacificDay(now)
  const p = parts(now)
  const minutes = Number(p.hour) * 60 + Number(p.minute)
  const period =
    PERIODS.find((p) => minutes >= WINDOWS[p][0] && minutes < WINDOWS[p][1]) ??
    null
  const next = boundaries.find((n) => n > minutes)!
  return { day, period, boundary: pacificInstant(day, next) }
}

export function blackoutWindow(now: Date) {
  const day = pacificDay(now)
  const p = parts(now)
  const minutes = Number(p.hour) * 60 + Number(p.minute)
  const start = 20 * 60 + 30
  const end = 6 * 60
  return {
    active: minutes >= start || minutes < end,
    boundary: pacificInstant(
      minutes >= start ? shiftDay(day, 1) : day,
      minutes < end || minutes >= start ? end : start,
    ),
  }
}
