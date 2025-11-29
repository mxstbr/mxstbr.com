import type { Chore, Completion, Reward, RewardRedemption } from './data'

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const PACIFIC_TIMEZONE = 'America/Los_Angeles'
const TIME_ORDER: Record<'morning' | 'afternoon' | 'evening', number> = {
  morning: 0,
  afternoon: 1,
  evening: 2,
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

export type TodayContext = {
  todayIso: string
  weekday: number
  nowMs: number
}

export function getToday(): TodayContext {
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

export function isPaused(chore: Chore, ctx: TodayContext): boolean {
  return (
    chore.type === 'repeated' &&
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

  if (chore.type === 'one-off') {
    return !completions.some(
      (completion) =>
        completion.choreId === chore.id &&
        completion.kidId === kidId,
    )
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
  if (cadence === 'weekly') {
    const days = chore.schedule?.daysOfWeek ?? []
    if (!days.includes(ctx.weekday)) return false
  }

  if (hasCompletedTodayForKid(chore.id, kidId, completions, ctx)) return false

  return true
}

export function scheduleLabel(chore: Chore): string {
  if (chore.type === 'one-off') return 'One-off'
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

export function sortByTimeOfDay<T extends { timeOfDay?: 'morning' | 'afternoon' | 'evening'; createdAt?: string }>(
  chores: T[],
): T[] {
  return [...chores].sort((a, b) => {
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
