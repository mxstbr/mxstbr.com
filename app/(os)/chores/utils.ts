import type { Chore, Completion, Reward, RewardRedemption } from './data'

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const PACIFIC_TIMEZONE = 'America/Los_Angeles'
export const DAILY_BONUS_STARS = 5
const DAILY_BONUS_PREFIX = 'daily-bonus'
const TIME_ORDER: Record<'morning' | 'afternoon' | 'evening' | 'night', number> = {
  morning: 0,
  afternoon: 1,
  evening: 2,
  night: 3,
}

const pacificDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: PACIFIC_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const pacificWeekdayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PACIFIC_TIMEZONE,
  weekday: 'short',
})

const pacificDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PACIFIC_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

export type TodayContext = {
  todayIso: string
  weekday: number
  nowMs: number
}

const ISO_DAY_REGEX = /^\d{4}-\d{2}-\d{2}$/
const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]

export type DailyChoreProgress = {
  total: number
  completed: number
  skipped: number
  remaining: number
}

function dateFromIsoDay(day: string): Date | null {
  if (!ISO_DAY_REGEX.test(day)) return null
  const parsed = new Date(`${day}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export function getToday(day?: string): TodayContext {
  if (day) {
    const parsed = dateFromIsoDay(day)
    if (parsed) {
      return {
        todayIso: formatPacificDate(parsed),
        weekday: pacificWeekdayIndex(parsed),
        nowMs: parsed.getTime(),
      }
    }
  }

  const now = new Date()
  return {
    todayIso: formatPacificDate(now),
    weekday: pacificWeekdayIndex(now),
    nowMs: now.getTime(),
  }
}

export function formatPacificDate(date: Date): string {
  return pacificDateFormatter.format(date)
}

export function formatRelativeTargetDay(targetDay: string, todayIso: string): string {
  const targetDate = dateFromIsoDay(targetDay)
  const todayDate = dateFromIsoDay(todayIso)

  if (!targetDate || !todayDate) {
    return targetDay === todayIso ? 'today' : `⚠️ ${targetDay}`
  }

  const diffDays = Math.round((targetDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))

  const relative = (() => {
    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'tomorrow'
    if (diffDays === -1) return 'yesterday'
    if (diffDays > 1) return `in ${diffDays}d`
    return `${Math.abs(diffDays)}d ago`
  })()

  const needsHighlight = diffDays !== 0
  const prefix = needsHighlight ? '⚠️ ' : ''
  const dateSuffix = ` (${targetDay})`

  return `${prefix}${relative}${dateSuffix}`
}

export function pacificWeekdayIndex(date: Date): number {
  const weekday = pacificWeekdayFormatter.format(date)
  const index = DAY_ABBRS.indexOf(weekday)
  return index === -1 ? 0 : index
}

export function pacificDateFromTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return formatPacificDate(new Date())
  }
  return formatPacificDate(date)
}

export function dailyBonusChoreId(dayIso: string): string {
  return `${DAILY_BONUS_PREFIX}:${dayIso}`
}

export function hasDailyBonus(
  completions: Completion[],
  kidId: string,
  dayIso: string,
): boolean {
  const bonusId = dailyBonusChoreId(dayIso)
  return completions.some(
    (completion) => completion.kidId === kidId && completion.choreId === bonusId,
  )
}

const NIGHT_START_MINUTES = 20 * 60
const MORNING_START_MINUTES = 7 * 60

export function pacificTimeInMinutes(date: Date = new Date()): number {
  const parts = pacificDateTimeFormatter.formatToParts(date)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0')
  return hour * 60 + minute
}

export function isPacificNighttime(date: Date = new Date()): boolean {
  const minutes = pacificTimeInMinutes(date)
  return minutes >= NIGHT_START_MINUTES || minutes < MORNING_START_MINUTES
}

export function hasCompletedTodayForKid(
  choreId: string,
  kidId: string,
  completions: Completion[],
  ctx: TodayContext,
): boolean {
  return completions.some(
    (completion) =>
      completion.choreId === choreId &&
      completion.kidId === kidId &&
      pacificDateFromTimestamp(completion.timestamp) === ctx.todayIso,
  )
}

function hasCompletionInWindow(
  choreId: string,
  kidId: string,
  startIso: string,
  endIso: string | null,
  completions: Completion[],
  ctx: TodayContext,
): boolean {
  return completions.some((completion) => {
    if (completion.choreId !== choreId || completion.kidId !== kidId) return false
    const day = pacificDateFromTimestamp(completion.timestamp)
    if (day < startIso) return false
    if (day > ctx.todayIso) return false
    if (endIso && day >= endIso) return false
    return true
  })
}

export function isPaused(chore: Chore, ctx: TodayContext): boolean {
  return (
    !!chore.pausedUntil &&
    chore.pausedUntil >= ctx.todayIso
  )
}

export function isOpenForKid(
  chore: Chore,
  kidId: string,
  completions: Completion[],
  ctx: TodayContext,
): boolean {
  if (!chore.kidIds.includes(kidId)) return false
  const createdDay = pacificDateFromTimestamp(chore.createdAt)
  const scheduledDay = chore.scheduledFor || createdDay
  if (scheduledDay > ctx.todayIso) return false
  const snoozedForKid = chore.snoozedForKids?.[kidId]
  if (snoozedForKid && snoozedForKid > ctx.todayIso) return false
  if (chore.snoozedUntil && chore.snoozedUntil > ctx.todayIso) return false

  if (chore.type === 'one-off') {
    const done = completions.some((completion) => {
      if (completion.choreId !== chore.id || completion.kidId !== kidId) return false
      const day = pacificDateFromTimestamp(completion.timestamp)
      return day <= ctx.todayIso
    })
    return !done
  }

  if (chore.type === 'perpetual') {
    const nowMs = ctx.nowMs ?? Date.now()
    const last = completions.find(
      (completion) =>
        completion.choreId === chore.id && completion.kidId === kidId,
    )
    if (last) {
      const elapsed = nowMs - new Date(last.timestamp).getTime()
      if (elapsed < 5000) return false
    }
    return true
  }

  if (isPaused(chore, ctx)) return false

  const cadence = chore.schedule?.cadence ?? 'daily'
  const daysOfWeek = (chore.schedule?.daysOfWeek ?? []).filter(
    (day) => typeof day === 'number' && day >= 0 && day <= 6,
  )
  const allowedDays = daysOfWeek.length ? daysOfWeek : ALL_WEEKDAYS
  const isScheduledToday = allowedDays.includes(ctx.weekday)

  if (cadence === 'weekly') {
    if (!isScheduledToday) return false
    const windowEnd = nextScheduledAfter(ctx.todayIso, allowedDays)
    const doneInWindow = hasCompletionInWindow(
      chore.id,
      kidId,
      ctx.todayIso,
      windowEnd,
      completions,
      ctx,
    )
    return !doneInWindow
  }

  // daily cadence
  if (daysOfWeek.length && !isScheduledToday) return false
  const windowEnd = shiftIsoDay(ctx.todayIso, 1)
  const doneToday = hasCompletionInWindow(
    chore.id,
    kidId,
    ctx.todayIso,
    windowEnd,
    completions,
    ctx,
  )
  return !doneToday
}

export function isChoreExpectedForDay(
  chore: Chore,
  kidId: string,
  completions: Completion[],
  ctx: TodayContext,
): boolean {
  if (!chore.kidIds.includes(kidId)) return false
  if (chore.type === 'perpetual') return false
  const createdDay = pacificDateFromTimestamp(chore.createdAt)
  const scheduledDay = chore.scheduledFor || createdDay
  if (scheduledDay > ctx.todayIso) return false
  if (isPaused(chore, ctx)) return false
  if (chore.snoozedUntil && chore.snoozedUntil > ctx.todayIso) return false

  if (chore.type === 'one-off') {
    const completedBeforeDay = completions.some((completion) => {
      if (completion.choreId !== chore.id || completion.kidId !== kidId)
        return false
      const day = pacificDateFromTimestamp(completion.timestamp)
      return day < ctx.todayIso
    })
    return !completedBeforeDay
  }

  const cadence = chore.schedule?.cadence ?? 'daily'
  const daysOfWeek = (chore.schedule?.daysOfWeek ?? []).filter(
    (day) => typeof day === 'number' && day >= 0 && day <= 6,
  )
  const allowedDays = daysOfWeek.length ? daysOfWeek : ALL_WEEKDAYS
  const isScheduledToday = allowedDays.includes(ctx.weekday)

  if (cadence === 'weekly') {
    return isScheduledToday
  }

  if (daysOfWeek.length && !isScheduledToday) return false
  return true
}

export function getDailyChoreProgress(
  chores: Chore[],
  completions: Completion[],
  kidId: string,
  ctx: TodayContext,
): DailyChoreProgress {
  const progress: DailyChoreProgress = {
    total: 0,
    completed: 0,
    skipped: 0,
    remaining: 0,
  }

  for (const chore of chores) {
    if (!isChoreExpectedForDay(chore, kidId, completions, ctx)) continue
    progress.total += 1
    if (isOpenForKid(chore, kidId, completions, ctx)) {
      progress.remaining += 1
      continue
    }
    if (hasCompletedTodayForKid(chore.id, kidId, completions, ctx)) {
      progress.completed += 1
    } else {
      progress.skipped += 1
    }
  }

  return progress
}

export function scheduleLabel(chore: Chore): string {
  if (chore.type === 'one-off') {
    return chore.scheduledFor ? `One-off · ${chore.scheduledFor}` : 'One-off'
  }
  if (chore.type === 'perpetual') return 'Perpetual'
  if (chore.schedule?.cadence === 'weekly') {
    const days = chore.schedule.daysOfWeek ?? []
    if (!days.length) return 'Weekly'
    return `Weekly · ${days.map((day) => DAY_ABBRS[day]).join(', ')}`
  }
  return 'Daily'
}

export function recurringStatus(
  chore: Chore,
  kidId: string,
  completions: Completion[],
  ctx: TodayContext,
): { label: string; tone: 'neutral' | 'success' | 'muted' } {
  if (isPaused(chore, ctx)) {
    return {
      label: `Paused until ${chore.pausedUntil}`,
      tone: 'muted',
    }
  }

  if (isOpenForKid(chore, kidId, completions, ctx)) {
    return { label: 'Due today', tone: 'neutral' }
  }

  if (hasCompletedTodayForKid(chore.id, kidId, completions, ctx)) {
    return { label: 'Done today', tone: 'success' }
  }

  if (chore.schedule?.cadence === 'weekly' && chore.schedule.daysOfWeek?.length) {
    return {
      label: `Next: ${chore.schedule.daysOfWeek
        .map((day) => DAY_ABBRS[day])
        .join(', ')}`,
      tone: 'muted',
    }
  }

  return { label: 'Back tomorrow', tone: 'muted' }
}

export function starsForKid(completions: Completion[], kidId: string): number {
  return completions
    .filter((completion) => completion.kidId === kidId)
    .reduce((total, completion) => total + completion.starsAwarded, 0)
}

export function withAlpha(color: string, alpha: number): string {
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
    const hex = color.slice(1)
    const fullHex =
      hex.length === 3
        ? hex
            .split('')
            .map((c) => c + c)
            .join('')
        : hex
    const r = parseInt(fullHex.slice(0, 2), 16)
    const g = parseInt(fullHex.slice(2, 4), 16)
    const b = parseInt(fullHex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return color
}

export function appliesToKid(chore: Chore, kidId: string): boolean {
  return chore.kidIds.includes(kidId)
}

export function shiftIsoDay(dayIso: string, delta: number): string {
  const base = dateFromIsoDay(dayIso) ?? new Date()
  base.setUTCDate(base.getUTCDate() + delta)
  return formatPacificDate(base)
}

function nearestScheduledOnOrBefore(dayIso: string, daysOfWeek: number[]): string | null {
  const day = dateFromIsoDay(dayIso)
  if (!day) return null
  const allowed = daysOfWeek.length ? daysOfWeek : ALL_WEEKDAYS

  for (let offset = 0; offset < 7; offset++) {
    const candidate = new Date(day)
    candidate.setUTCDate(candidate.getUTCDate() - offset)
    if (allowed.includes(candidate.getUTCDay())) {
      return formatPacificDate(candidate)
    }
  }

  return formatPacificDate(day)
}

function nextScheduledAfter(dayIso: string, daysOfWeek: number[]): string | null {
  const day = dateFromIsoDay(dayIso)
  if (!day) return null
  const allowed = daysOfWeek.length ? daysOfWeek : ALL_WEEKDAYS

  for (let offset = 1; offset <= 7; offset++) {
    const candidate = new Date(day)
    candidate.setUTCDate(candidate.getUTCDate() + offset)
    if (allowed.includes(candidate.getUTCDay())) {
      return formatPacificDate(candidate)
    }
  }

  const fallback = new Date(day)
  fallback.setUTCDate(fallback.getUTCDate() + 7)
  return formatPacificDate(fallback)
}

export function sortByTimeOfDay<
  T extends {
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
    createdAt?: string
    type?: 'one-off' | 'repeated' | 'perpetual'
  },
>(
  chores: T[],
): T[] {
  return [...chores].sort((a, b) => {
    const isPerpetualA = a.type === 'perpetual'
    const isPerpetualB = b.type === 'perpetual'
    if (isPerpetualA !== isPerpetualB) return isPerpetualA ? 1 : -1

    const orderA = a.timeOfDay ? TIME_ORDER[a.timeOfDay] : Number.POSITIVE_INFINITY
    const orderB = b.timeOfDay ? TIME_ORDER[b.timeOfDay] : Number.POSITIVE_INFINITY
    if (orderA !== orderB) return orderA - orderB
    const createdA = a.createdAt ?? ''
    const createdB = b.createdAt ?? ''
    return createdB.localeCompare(createdA)
  })
}

export function rewardAvailableForKid(
  reward: Reward,
  kidId: string,
  redemptions: RewardRedemption[],
): boolean {
  if (!reward.kidIds.includes(kidId) || reward.archived) return false
  if (reward.type === 'perpetual') return true

  return !redemptions.some(
    (entry) => entry.rewardId === reward.id && entry.kidId === kidId,
  )
}

export function msUntilNextPacificMidnight(): number {
  const now = new Date()
  const parts = pacificDateTimeFormatter.formatToParts(now)
  const get = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? '0')

  const year = get('year')
  const month = get('month')
  const day = get('day')
  const hour = get('hour')
  const minute = get('minute')
  const second = get('second')

  const pacificNow = Date.UTC(year, month - 1, day, hour, minute, second)
  const pacificMidnight = Date.UTC(year, month - 1, day + 1, 0, 0, 0)
  const diff = pacificMidnight - pacificNow

  return Number.isFinite(diff) && diff > 0 ? diff : 1_000 * 60 * 60
}
