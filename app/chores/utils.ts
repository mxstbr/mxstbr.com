import type { Chore, Completion } from './data'

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TIME_ORDER: Record<'morning' | 'afternoon' | 'evening', number> = {
  morning: 0,
  afternoon: 1,
  evening: 2,
}

export type TodayContext = {
  todayIso: string
  weekday: number
}

export function getToday(): TodayContext {
  const now = new Date()
  return {
    todayIso: now.toISOString().slice(0, 10),
    weekday: now.getUTCDay(),
  }
}

export function hasCompletedToday(
  choreId: string,
  completions: Completion[],
  ctx: TodayContext,
): boolean {
  return completions.some(
    (completion) =>
      completion.choreId === choreId &&
      completion.timestamp.slice(0, 10) === ctx.todayIso,
  )
}

export function isPaused(chore: Chore, ctx: TodayContext): boolean {
  return (
    chore.type === 'repeated' &&
    !!chore.pausedUntil &&
    chore.pausedUntil >= ctx.todayIso
  )
}

export function isOpenToday(
  chore: Chore,
  completions: Completion[],
  ctx: TodayContext,
): boolean {
  if (chore.type === 'one-off') {
    return !chore.completedAt
  }

  if (chore.type === 'perpetual') {
    return true
  }

  if (isPaused(chore, ctx)) return false

  const cadence = chore.schedule?.cadence ?? 'daily'
  if (cadence === 'weekly') {
    const days = chore.schedule?.daysOfWeek ?? []
    if (!days.includes(ctx.weekday)) return false
  }

  if (hasCompletedToday(chore.id, completions, ctx)) return false

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
  completions: Completion[],
  ctx: TodayContext,
): { label: string; tone: 'neutral' | 'success' | 'muted' } {
  if (isPaused(chore, ctx)) {
    return {
      label: `Paused until ${chore.pausedUntil}`,
      tone: 'muted',
    }
  }

  if (isOpenToday(chore, completions, ctx)) {
    return { label: 'Due today', tone: 'neutral' }
  }

  if (hasCompletedToday(chore.id, completions, ctx)) {
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

export function sortByTimeOfDay<T extends { timeOfDay?: 'morning' | 'afternoon' | 'evening'; createdAt?: string }>(
  chores: T[],
): T[] {
  return [...chores].sort((a, b) => {
    const orderA = TIME_ORDER[a.timeOfDay ?? 'morning']
    const orderB = TIME_ORDER[b.timeOfDay ?? 'morning']
    if (orderA !== orderB) return orderA - orderB
    const createdA = a.createdAt ?? ''
    const createdB = b.createdAt ?? ''
    return createdB.localeCompare(createdA)
  })
}
