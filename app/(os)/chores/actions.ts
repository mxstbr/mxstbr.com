'use server'

import { revalidatePath } from 'next/cache'
import {
  Chore,
  ChoreState,
  ChoreType,
  getChoreState,
  saveChoreState,
  type RewardType,
} from './data'
import { formatPacificDate, pacificDateFromTimestamp, shiftIsoDay, starsForKid } from './utils'
import { bot } from 'app/lib/telegram'
import { isMax } from 'app/auth'

function todayIsoDate(): string {
  return formatPacificDate(new Date())
}

async function isAuthorized(): Promise<boolean> {
  return isMax()
}

async function withUpdatedState(
  updater: (state: ChoreState) => Promise<void> | void,
): Promise<void> {
  const state = await getChoreState()
  const before = JSON.stringify(state)

  await updater(state)

  const after = JSON.stringify(state)
  if (before === after) return

  await saveChoreState(state)
  revalidatePath('/chores')
  revalidatePath('/chores/admin')
  revalidatePath('/chores/rewards')
}

function parseNumber(value: FormDataEntryValue | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseColor(value: FormDataEntryValue | null): string | null {
  if (!value) return null
  const raw = value.toString().trim()
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) {
    return raw.length === 4
      ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
      : raw
  }
  return null
}

function parseIsoDay(value: FormDataEntryValue | null): string | null {
  if (!value) return null
  const raw = value.toString().trim()
  if (!raw) return null
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null
}

export async function addChore(formData: FormData): Promise<void> {
  if (!(await isAuthorized())) return

  const title = formData.get('title')?.toString().trim()
  const emoji = formData.get('emoji')?.toString().trim() || '⭐️'
  const stars = parseNumber(formData.get('stars')) ?? 1
  const kidIds = formData
    .getAll('kidIds')
    .map((value) => value.toString())
    .filter(Boolean)
  const type = (formData.get('type')?.toString() as ChoreType | undefined) ?? 'one-off'
  const cadence = (formData.get('cadence')?.toString() as 'daily' | 'weekly' | undefined) ?? 'daily'
  const timeOfDay = parseTimeOfDay(formData.get('timeOfDay')) ?? undefined
  const scheduledFor = type === 'one-off' ? parseIsoDay(formData.get('scheduledFor')) : null
  const rawDays = formData
    .getAll('daysOfWeek')
    .map((value) => parseNumber(value))
    .filter((day): day is number => typeof day === 'number' && day >= 0 && day <= 6)
  const daysOfWeek =
    rawDays.length > 0 ? rawDays : [new Date().getUTCDay()]
  const requiresApprovalValues = formData
    .getAll('requiresApproval')
    .map((value) => value.toString().toLowerCase())
  const requiresApproval = requiresApprovalValues.includes('on') || requiresApprovalValues.includes('true')

  if (!title || kidIds.length === 0) return

  await withUpdatedState((state) => {
    const validKidIds = kidIds.filter((id) => state.kids.some((kid) => kid.id === id))
    if (!validKidIds.length) return

    const createdAt = new Date().toISOString()
    const chore: Chore = {
      id: crypto.randomUUID(),
      kidIds: validKidIds,
      title,
      emoji,
      stars: Math.max(0, Math.round(stars)),
      type,
      createdAt,
      timeOfDay,
      requiresApproval,
      scheduledFor: scheduledFor ?? todayIsoDate(),
    }

    if (type === 'repeated') {
      chore.schedule = {
        cadence,
        daysOfWeek: cadence === 'weekly' ? daysOfWeek : undefined,
      }
    }

    state.chores.unshift(chore)
  })
}

export async function completeChore(formData: FormData): Promise<{ awarded: number }> {
  if (!(await isAuthorized())) return { awarded: 0 }

  const choreId = formData.get('choreId')?.toString()
  const kidId = formData.get('kidId')?.toString()
  if (!choreId || !kidId) return { awarded: 0 }

  const requestedDay = parseIsoDay(formData.get('day'))
  const today = todayIsoDate()
  const targetDay = requestedDay ?? today
  const completionTimestamp =
    targetDay === today
      ? new Date().toISOString()
      : new Date(`${targetDay}T12:00:00Z`).toISOString()

  let awarded = 0
  let telegramMessage: string | null = null

  await withUpdatedState((state) => {
    const chore = state.chores.find((c) => c.id === choreId)
    if (!chore) return
    if (!chore.kidIds.includes(kidId)) return

    const alreadyCompletedToday =
      chore.type === 'repeated' &&
      state.completions.some(
        (completion) =>
          completion.choreId === chore.id &&
          completion.kidId === kidId &&
          pacificDateFromTimestamp(completion.timestamp) === targetDay,
      )

    if (chore.type === 'one-off' && chore.completedAt) return
    if (alreadyCompletedToday) return

    awarded = chore.stars

    state.completions.unshift({
      id: crypto.randomUUID(),
      choreId: chore.id,
      kidId,
      timestamp: completionTimestamp,
      starsAwarded: chore.stars,
    })

    if (chore.type === 'one-off') {
      const allDone = chore.kidIds.every((id) =>
        state.completions.some((completion) => completion.choreId === chore.id && completion.kidId === id),
      )
      if (allDone) {
        chore.completedAt = completionTimestamp
      }
    }

    const kid = state.kids.find((k) => k.id === kidId)
    if (kid && process.env.TELEGRAM_BOT_TOKEN) {
      const starTotal = starsForKid(state.completions, kidId)
      telegramMessage = `${kid.name} completed "${chore.title}" (+${awarded} ⭐️, ${starTotal} ⭐️ total)`
    }
  })

  if (telegramMessage) {
    bot.telegram
      .sendMessage('-4904434425', telegramMessage)
      .catch((err) => console.error('Failed to send Telegram completion message', err))
  }

  return { awarded }
}

export async function undoChore(formData: FormData): Promise<{ delta: number }> {
  if (!(await isAuthorized())) return { delta: 0 }

  const choreId = formData.get('choreId')?.toString()
  const kidId = formData.get('kidId')?.toString()
  const completionId = formData.get('completionId')?.toString()
  if (!choreId || !kidId) return { delta: 0 }

  let delta = 0
  const targetDay = parseIsoDay(formData.get('day')) ?? todayIsoDate()
  let telegramMessage: string | null = null

  await withUpdatedState((state) => {
    const chore = state.chores.find((c) => c.id === choreId)
    if (!chore) return

    const matchesDay = (entry: (typeof state.completions)[number]) =>
      pacificDateFromTimestamp(entry.timestamp) === targetDay
    let index = -1
    if (completionId) {
      index = state.completions.findIndex(
        (entry) =>
          entry.id === completionId &&
          entry.choreId === choreId &&
          entry.kidId === kidId &&
          matchesDay(entry),
      )
    }

    if (index === -1) {
      index = state.completions.findIndex(
        (entry) =>
          entry.choreId === choreId &&
          entry.kidId === kidId &&
          matchesDay(entry),
      )
    }

    if (index === -1) return

    const [removed] = state.completions.splice(index, 1)
    delta = -removed.starsAwarded

    if (chore.type === 'one-off') {
      const allDone = chore.kidIds.every((id) =>
        state.completions.some((entry) => entry.choreId === chore.id && entry.kidId === id),
      )
      if (!allDone) {
        chore.completedAt = null
      }
    }

    const kid = state.kids.find((k) => k.id === kidId)
    if (kid && process.env.TELEGRAM_BOT_TOKEN) {
      const starTotal = starsForKid(state.completions, kidId)
      telegramMessage = `${kid.name} undid "${chore.title}" (${delta} ⭐️, ${starTotal} ⭐️ total)`
    }
  })

  if (telegramMessage) {
    bot.telegram
      .sendMessage('-4904434425', telegramMessage)
      .catch((err) => console.error('Failed to send Telegram undo message', err))
  }

  return { delta }
}

export async function setPause(formData: FormData): Promise<void> {
  if (!(await isAuthorized())) return

  const choreId = formData.get('choreId')?.toString()
  const pausedUntil = formData.get('pausedUntil')?.toString()
  if (!choreId) return

  await withUpdatedState((state) => {
    const chore = state.chores.find((c) => c.id === choreId)
    if (!chore || chore.type !== 'repeated') return

    chore.pausedUntil = pausedUntil || null
  })
}

export async function pauseAllChores(formData: FormData): Promise<void> {
  if (!(await isAuthorized())) return

  const pausedUntil = formData.get('pausedUntil')?.toString() || null

  await withUpdatedState((state) => {
    for (const chore of state.chores) {
      chore.pausedUntil = pausedUntil
      chore.snoozedUntil = pausedUntil
    }
  })
}

export async function skipChore(formData: FormData): Promise<void> {
  if (!(await isAuthorized())) return

  const choreId = formData.get('choreId')?.toString()
  const kidId = formData.get('kidId')?.toString()
  if (!choreId || !kidId) return

  const nextDay = shiftIsoDay(todayIsoDate(), 1)

  await withUpdatedState((state) => {
    const chore = state.chores.find((c) => c.id === choreId)
    if (!chore || !chore.kidIds.includes(kidId)) return

    chore.snoozedForKids = {
      ...chore.snoozedForKids,
      [kidId]: nextDay,
    }
  })
}

export async function setChoreSchedule(formData: FormData): Promise<void> {
  if (!(await isAuthorized())) return

  const choreId = formData.get('choreId')?.toString()
  const cadence =
    (formData.get('cadence')?.toString() as 'daily' | 'weekly' | undefined) ?? 'daily'
  const daysOfWeek = formData
    .getAll('daysOfWeek')
    .map((value) => parseNumber(value))
    .filter((day): day is number => typeof day === 'number' && day >= 0 && day <= 6)

  if (!choreId) return

  await withUpdatedState((state) => {
    const chore = state.chores.find((c) => c.id === choreId)
    if (!chore || chore.type !== 'repeated') return

    chore.schedule = {
      cadence,
      daysOfWeek: cadence === 'weekly' ? (daysOfWeek.length ? daysOfWeek : undefined) : undefined,
    }
  })
}

export async function renameKid(formData: FormData): Promise<void> {
  if (!(await isAuthorized())) return

  const kidId = formData.get('kidId')?.toString()
  const name = formData.get('name')?.toString().trim()
  const color = parseColor(formData.get('color'))
  if (!kidId || !name) return

  await withUpdatedState((state) => {
    const kid = state.kids.find((k) => k.id === kidId)
    if (!kid) return
    kid.name = name
    if (color) {
      kid.color = color
    }
  })
}

export async function setKidColor(formData: FormData): Promise<void> {
  if (!(await isAuthorized())) return

  const kidId = formData.get('kidId')?.toString()
  const color = parseColor(formData.get('color'))
  if (!kidId || !color) return

  await withUpdatedState((state) => {
    const kid = state.kids.find((k) => k.id === kidId)
    if (!kid) return
    kid.color = color
  })
}

export async function archiveChore(formData: FormData): Promise<void> {
  if (!(await isAuthorized())) return

  const choreId = formData.get('choreId')?.toString()
  if (!choreId) return

  await withUpdatedState((state) => {
    state.chores = state.chores.filter((chore) => chore.id !== choreId)
  })
}

export async function setTimeOfDay(formData: FormData): Promise<void> {
  if (!(await isAuthorized())) return

  const choreId = formData.get('choreId')?.toString()
  const timeOfDay = parseTimeOfDay(formData.get('timeOfDay'))
  if (!choreId) return

  await withUpdatedState((state) => {
    const chore = state.chores.find((c) => c.id === choreId)
    if (!chore) return
    chore.timeOfDay = timeOfDay ?? undefined
  })
}

export async function adjustKidStars(formData: FormData): Promise<void> {
  if (!(await isAuthorized())) return

  const kidId = formData.get('kidId')?.toString()
  const rawDelta = parseNumber(formData.get('delta'))
  const mode = formData.get('mode')?.toString()
  if (!kidId || rawDelta === null) return

  const delta = Math.round(Math.abs(rawDelta)) * (mode === 'remove' ? -1 : 1)
  if (delta === 0) return

  await withUpdatedState((state) => {
    const kid = state.kids.find((k) => k.id === kidId)
    if (!kid) return

    state.completions.unshift({
      id: crypto.randomUUID(),
      choreId: `manual-${Date.now()}`,
      kidId,
      timestamp: new Date().toISOString(),
      starsAwarded: delta,
    })
  })
}

export async function setChoreKids(formData: FormData): Promise<void> {
  if (!(await isAuthorized())) return

  const choreId = formData.get('choreId')?.toString()
  const timeValue = formData.get('timeOfDay')
  const timeOfDay = parseTimeOfDay(timeValue)
  const approvalEntries = formData
    .getAll('requiresApproval')
    .map((value) => value.toString().toLowerCase())
  const shouldSetApproval = approvalEntries.length > 0
  const requiresApproval = approvalEntries.includes('true') || approvalEntries.includes('on')
  const kidIds = formData
    .getAll('kidIds')
    .map((value) => value.toString())
    .filter(Boolean)
  if (!choreId || kidIds.length === 0) return

  await withUpdatedState((state) => {
    const chore = state.chores.find((c) => c.id === choreId)
    if (!chore) return

    const validKidIds = kidIds.filter((id) => state.kids.some((kid) => kid.id === id))
    if (!validKidIds.length) return

    chore.kidIds = validKidIds
    if (timeValue !== null) {
      chore.timeOfDay = timeOfDay ?? undefined
    }
    if (shouldSetApproval) {
      chore.requiresApproval = requiresApproval
    }
  })
}

export async function setOneOffDate(formData: FormData): Promise<void> {
  if (!(await isAuthorized())) return

  const choreId = formData.get('choreId')?.toString()
  const scheduledFor = parseIsoDay(formData.get('scheduledFor')) ?? todayIsoDate()
  if (!choreId) return

  await withUpdatedState((state) => {
    const chore = state.chores.find((c) => c.id === choreId)
    if (!chore || chore.type !== 'one-off') return

    chore.scheduledFor = scheduledFor
  })
}

export async function addReward(formData: FormData): Promise<void> {
  if (!(await isAuthorized())) return

  const title = formData.get('title')?.toString().trim()
  const emoji = formData.get('emoji')?.toString().trim() || '🎁'
  const cost = parseNumber(formData.get('cost')) ?? 1
  const type = (formData.get('rewardType')?.toString() as RewardType | undefined) ?? 'perpetual'
  const kidIds = formData
    .getAll('kidIds')
    .map((value) => value.toString())
    .filter(Boolean)

  if (!title || kidIds.length === 0) return

  await withUpdatedState((state) => {
    const validKidIds = kidIds.filter((id) => state.kids.some((kid) => kid.id === id))
    if (!validKidIds.length) return

    state.rewards.unshift({
      id: crypto.randomUUID(),
      kidIds: validKidIds,
      title,
      emoji,
      cost: Math.max(0, Math.round(cost)),
      type,
      createdAt: new Date().toISOString(),
    })
  })
}

export async function archiveReward(formData: FormData): Promise<void> {
  if (!(await isAuthorized())) return

  const rewardId = formData.get('rewardId')?.toString()
  if (!rewardId) return

  await withUpdatedState((state) => {
    state.rewards = state.rewards.filter((reward) => reward.id !== rewardId)
    state.rewardRedemptions = state.rewardRedemptions.filter((entry) => entry.rewardId !== rewardId)
  })
}

export async function setRewardKids(formData: FormData): Promise<void> {
  if (!(await isAuthorized())) return

  const rewardId = formData.get('rewardId')?.toString()
  const kidIds = formData
    .getAll('kidIds')
    .map((value) => value.toString())
    .filter(Boolean)
  if (!rewardId || kidIds.length === 0) return

  await withUpdatedState((state) => {
    const reward = state.rewards.find((r) => r.id === rewardId)
    if (!reward) return

    const validKidIds = kidIds.filter((id) => state.kids.some((kid) => kid.id === id))
    if (!validKidIds.length) return

    reward.kidIds = validKidIds
  })
}

export async function redeemReward(formData: FormData): Promise<{ success: boolean }> {
  if (!(await isAuthorized())) return { success: false }

  const rewardId = formData.get('rewardId')?.toString()
  const kidId = formData.get('kidId')?.toString()
  if (!rewardId || !kidId) return { success: false }

  let success = false

  await withUpdatedState((state) => {
    const reward = state.rewards.find((r) => r.id === rewardId)
    if (!reward) return
    if (!reward.kidIds.includes(kidId) || reward.archived) return

    if (reward.type === 'one-off') {
      const alreadyRedeemed = state.rewardRedemptions.some(
        (entry) => entry.rewardId === rewardId && entry.kidId === kidId,
      )
      if (alreadyRedeemed) return
    }

    const starBalance = starsForKid(state.completions, kidId)
    if (starBalance < reward.cost) return

    const timestamp = new Date().toISOString()

    state.completions.unshift({
      id: crypto.randomUUID(),
      choreId: `reward:${reward.id}`,
      kidId,
      timestamp,
      starsAwarded: -Math.max(0, Math.round(reward.cost)),
    })

    state.rewardRedemptions.unshift({
      id: crypto.randomUUID(),
      rewardId: reward.id,
      kidId,
      timestamp,
      cost: reward.cost,
    })

    success = true

    const kid = state.kids.find((k) => k.id === kidId)
    if (kid && process.env.TELEGRAM_BOT_TOKEN) {
      const message = `${kid.name} redeemed "${reward.title}" for ${reward.cost} ⭐️`
      bot.telegram
        .sendMessage('-4904434425', message)
        .catch((err) => console.error('Failed to send Telegram reward message', err))
    }
  })

  return { success }
}
function parseTimeOfDay(
  value: FormDataEntryValue | null,
): 'morning' | 'afternoon' | 'evening' | null {
  if (!value) return null
  const normalized = value.toString()
  if (normalized === 'morning' || normalized === 'afternoon' || normalized === 'evening') {
    return normalized
  }
  return null
}
