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
import {
  formatPacificDate,
  pacificDateFromTimestamp,
  shiftIsoDay,
  starsForKid,
} from './utils'
import { BEDTIME_TEMPLATES, type BedtimeTemplateKey } from './bedtime-approval/constants'
import type { BedtimeCreationResult, BedtimeCreationSummary } from './bedtime-approval/types'
import { getBaseUrl } from 'app/lib/base-url'
import { bot } from 'app/lib/telegram'
import { isMax } from 'app/auth'

const AUTOMATION_TOKEN =
  process.env.CLIPPY_AUTOMATION_TOKEN ?? process.env.CAL_PASSWORD ?? ''

function todayIsoDate(): string {
  return formatPacificDate(new Date())
}

export type CompletionResult = {
  awarded: number
  completionId?: string
  choreTitle?: string
  kidName?: string
  telegramMessage?: string | null
  undoLink?: string | null
  status: 'completed' | 'skipped' | 'invalid' | 'unauthorized'
}

function hasAutomationToken(formData?: FormData | null): boolean {
  if (!AUTOMATION_TOKEN) return false
  const token = formData?.get('automationToken')?.toString()
  return Boolean(token && token === AUTOMATION_TOKEN)
}

async function isAuthorized(formData?: FormData | null): Promise<boolean> {
  if (hasAutomationToken(formData)) return true
  return isMax()
}

async function requireAuthorization(formData?: FormData | null): Promise<void> {
  if (await isAuthorized(formData)) return
  throw new Error('Unauthorized')
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
  revalidatePath('/chores/bedtime-approval')
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

async function approvalUrl(choreId: string, kidId: string, dayIso: string): Promise<string> {
  const baseUrl = await getBaseUrl()
  const url = new URL(`/chores/approve/${encodeURIComponent(choreId)}`, baseUrl)
  url.searchParams.set('kidId', kidId)
  url.searchParams.set('day', dayIso)
  return url.toString()
}

async function undoUrl(
  completionId: string,
  choreId: string,
  kidId: string,
  dayIso: string,
): Promise<string> {
  const baseUrl = await getBaseUrl()
  const url = new URL(`/chores/undo/${encodeURIComponent(completionId)}`, baseUrl)
  url.searchParams.set('choreId', choreId)
  url.searchParams.set('kidId', kidId)
  url.searchParams.set('day', dayIso)
  return url.toString()
}

async function applyCompletion({
  choreId,
  kidId,
  targetDay,
  notifyTelegram = true,
}: {
  choreId: string
  kidId: string
  notifyTelegram?: boolean
  targetDay: string
}): Promise<CompletionResult> {
  const today = todayIsoDate()
  const completionTimestamp =
    targetDay === today
      ? new Date().toISOString()
      : new Date(`${targetDay}T12:00:00Z`).toISOString()
  let telegramMessage: string | null = null
  let undoLink: string | null = null
  let result: CompletionResult = {
    awarded: 0,
    telegramMessage: null,
    undoLink: null,
    status: 'invalid',
  }

  await withUpdatedState((state) => {
    const chore = state.chores.find((c) => c.id === choreId)
    const kid = state.kids.find((k) => k.id === kidId)
    if (!chore || !kid) return
    if (!chore.kidIds.includes(kidId)) return

    result = {
      awarded: 0,
      choreTitle: chore.title,
      kidName: kid.name,
      status: 'skipped',
    }

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

    const awarded = chore.stars

    const completionId = crypto.randomUUID()

    state.completions.unshift({
      id: completionId,
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

    const starTotal = starsForKid(state.completions, kidId)
    if (process.env.TELEGRAM_BOT_TOKEN) {
      telegramMessage = `${kid.name} completed "${chore.title}" (+${awarded} ⭐️, ${starTotal} ⭐️ total)`
    }

    result = {
      awarded,
      choreTitle: chore.title,
      kidName: kid.name,
      completionId,
      status: 'completed',
    }
  })

  if (telegramMessage && result.completionId) {
    const link = await undoUrl(result.completionId, choreId, kidId, targetDay)
    if (link.includes('localhost') && process.env.NODE_ENV === 'production') {
      console.error('Undo link resolved to localhost in production, not sending')
    } else {
      undoLink = link
    }
  }

  result.telegramMessage = telegramMessage
  result.undoLink = undoLink

  if (telegramMessage && notifyTelegram) {
    const keyboard = undoLink
      ? { reply_markup: { inline_keyboard: [[{ text: 'Undo', url: undoLink }]] } }
      : undefined

    bot.telegram
      .sendMessage('-4904434425', telegramMessage, keyboard)
      .catch((err) => console.error('Failed to send Telegram completion message', err))
  }

  return result
}

export async function addChore(formData: FormData): Promise<void> {
  await requireAuthorization(formData)

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

export async function completeChore(formData: FormData): Promise<CompletionResult> {
  await requireAuthorization(formData)

  const choreId = formData.get('choreId')?.toString()
  const kidId = formData.get('kidId')?.toString()
  if (!choreId || !kidId) return { awarded: 0, status: 'invalid' }

  const targetDay = parseIsoDay(formData.get('day')) ?? todayIsoDate()
  return applyCompletion({ choreId, kidId, targetDay })
}

export async function approveChoreViaLink(
  choreId: string,
  kidId: string,
  targetDay: string,
): Promise<CompletionResult> {
  return applyCompletion({ choreId, kidId, targetDay, notifyTelegram: false })
}

export async function requestApproval(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const choreId = formData.get('choreId')?.toString()
  const kidId = formData.get('kidId')?.toString()
  if (!choreId || !kidId) return { ok: false, error: 'Missing chore or kid' }

  const targetDay = parseIsoDay(formData.get('day')) ?? todayIsoDate()
  const state = await getChoreState()
  const chore = state.chores.find((c) => c.id === choreId)
  const kid = state.kids.find((k) => k.id === kidId)
  if (!chore || !kid) return { ok: false, error: 'Chore or kid not found' }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return { ok: false, error: 'Telegram is not configured' }
  }

  const link = await approvalUrl(chore.id, kid.id, targetDay)
  if (link.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.error('Approval link resolved to localhost in production, not sending')
    return { ok: false, error: 'Invalid approval link' }
  }
  const dayLabel = targetDay === todayIsoDate() ? 'today' : targetDay
  const message = `${kid.name} requested approval for "${chore.title}" (${dayLabel}).`

  try {
    await bot.telegram.sendMessage('-4904434425', message, {
      reply_markup: { inline_keyboard: [[{ text: 'Approve', url: link }]] },
    })
  } catch (error) {
    console.error('Failed to send Telegram approval request', error)
    return { ok: false, error: 'Could not send approval request' }
  }

  return { ok: true }
}

type UndoResult = {
  choreTitle?: string
  delta: number
  kidName?: string
  telegramMessage?: string | null
  status: 'undone' | 'not_found' | 'invalid'
}

async function applyUndo({
  choreId,
  completionId,
  kidId,
  targetDay,
  notifyTelegram = true,
}: {
  choreId: string
  completionId?: string | null
  kidId: string
  notifyTelegram?: boolean
  targetDay: string
}): Promise<UndoResult> {
  let telegramMessage: string | null = null
  let result: UndoResult = { delta: 0, status: 'invalid', telegramMessage: null }

  await withUpdatedState((state) => {
    const chore = state.chores.find((c) => c.id === choreId)
    const kid = state.kids.find((k) => k.id === kidId)
    if (!chore || !kid) return

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

    if (index === -1) {
      result = { delta: 0, status: 'not_found' }
      return
    }

    const [removed] = state.completions.splice(index, 1)
    const delta = -removed.starsAwarded

    if (chore.type === 'one-off') {
      const allDone = chore.kidIds.every((id) =>
        state.completions.some((entry) => entry.choreId === chore.id && entry.kidId === id),
      )
      if (!allDone) {
        chore.completedAt = null
      }
    }

    const starTotal = starsForKid(state.completions, kidId)

    if (process.env.TELEGRAM_BOT_TOKEN) {
      telegramMessage = `${kid.name} undid "${chore.title}" (${delta} ⭐️, ${starTotal} ⭐️ total)`
    }

    result = {
      choreTitle: chore.title,
      delta,
      kidName: kid.name,
      telegramMessage,
      status: 'undone',
    }
  })

  if (telegramMessage && notifyTelegram) {
    bot.telegram
      .sendMessage('-4904434425', telegramMessage)
      .catch((err) => console.error('Failed to send Telegram undo message', err))
  }

  return result
}

export async function undoChore(formData: FormData): Promise<{ delta: number }> {
  await requireAuthorization(formData)

  const choreId = formData.get('choreId')?.toString()
  const kidId = formData.get('kidId')?.toString()
  const completionId = formData.get('completionId')?.toString()
  if (!choreId || !kidId) return { delta: 0 }

  const targetDay = parseIsoDay(formData.get('day')) ?? todayIsoDate()
  const result = await applyUndo({ choreId, kidId, completionId, targetDay })

  return { delta: result.delta }
}

export async function undoChoreViaLink({
  choreId,
  completionId,
  kidId,
  targetDay,
}: {
  choreId: string
  completionId?: string | null
  kidId: string
  targetDay: string
}): Promise<UndoResult> {
  return applyUndo({ choreId, kidId, completionId, targetDay, notifyTelegram: false })
}

export async function setPause(formData: FormData): Promise<void> {
  await requireAuthorization(formData)

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
  await requireAuthorization(formData)

  const pausedUntil = formData.get('pausedUntil')?.toString() || null

  await withUpdatedState((state) => {
    for (const chore of state.chores) {
      chore.pausedUntil = pausedUntil
      chore.snoozedUntil = pausedUntil
    }
  })
}

export async function skipChore(formData: FormData): Promise<void> {
  await requireAuthorization(formData)

  const choreId = formData.get('choreId')?.toString()
  const kidId = formData.get('kidId')?.toString()
  if (!choreId || !kidId) return

  const today = todayIsoDate()
  const nextDay = shiftIsoDay(today, 1)
  let telegramMessage: string | null = null

  await withUpdatedState((state) => {
    const chore = state.chores.find((c) => c.id === choreId)
    const kid = state.kids.find((k) => k.id === kidId)
    if (!chore || !kid || !chore.kidIds.includes(kidId)) return

    const alreadySnoozedForDay = chore.snoozedForKids?.[kidId] === nextDay
    if (alreadySnoozedForDay) return

    chore.snoozedForKids = {
      ...chore.snoozedForKids,
      [kidId]: nextDay,
    }

    if (process.env.TELEGRAM_BOT_TOKEN) {
      const dayLabel = nextDay === today ? 'today' : `tomorrow (${nextDay})`
      telegramMessage = `${kid.name} skipped "${chore.title}" (snoozed to ${dayLabel})`
    }
  })

  if (telegramMessage) {
    bot.telegram
      .sendMessage('-4904434425', telegramMessage)
      .catch((err) => console.error('Failed to send Telegram skip message', err))
  }
}

export async function setChoreSchedule(formData: FormData): Promise<void> {
  await requireAuthorization(formData)

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
  await requireAuthorization(formData)

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
  await requireAuthorization(formData)

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
  await requireAuthorization(formData)

  const choreId = formData.get('choreId')?.toString()
  if (!choreId) return

  await withUpdatedState((state) => {
    state.chores = state.chores.filter((chore) => chore.id !== choreId)
  })
}

export async function setTimeOfDay(formData: FormData): Promise<void> {
  await requireAuthorization(formData)

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
  await requireAuthorization(formData)

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
  await requireAuthorization(formData)

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
  await requireAuthorization(formData)

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
  await requireAuthorization(formData)

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
  await requireAuthorization(formData)

  const rewardId = formData.get('rewardId')?.toString()
  if (!rewardId) return

  await withUpdatedState((state) => {
    state.rewards = state.rewards.filter((reward) => reward.id !== rewardId)
    state.rewardRedemptions = state.rewardRedemptions.filter((entry) => entry.rewardId !== rewardId)
  })
}

export async function setRewardKids(formData: FormData): Promise<void> {
  await requireAuthorization(formData)

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
  await requireAuthorization(formData)

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

export async function createBedtimeChores(
  formData: FormData,
): Promise<BedtimeCreationResult> {
  await requireAuthorization(formData)

  const targetDay = parseIsoDay(formData.get('day')) ?? todayIsoDate()
  const selections = new Map<BedtimeTemplateKey, Set<string>>()
  for (const template of BEDTIME_TEMPLATES) {
    const kidIds = formData
      .getAll(template.key)
      .map((value) => value.toString())
      .filter(Boolean)
    selections.set(template.key, new Set(kidIds))
  }

  const selectedKidIds = new Set<string>()
  selections.forEach((set) => {
    set.forEach((kidId) => selectedKidIds.add(kidId))
  })

  const created: BedtimeCreationSummary[] = []
  const skipped: BedtimeCreationSummary[] = []

  await withUpdatedState((state) => {
    const now = new Date().toISOString()
    for (const kidId of Array.from(selectedKidIds)) {
      const kid = state.kids.find((entry) => entry.id === kidId)
      if (!kid) continue

      for (const template of BEDTIME_TEMPLATES) {
        const kidSelection = selections.get(template.key)
        if (!kidSelection?.has(kid.id)) continue

        const matchesTemplate = (chore: Chore) =>
          chore.type === 'one-off' &&
          chore.timeOfDay === 'morning' &&
          (chore.scheduledFor ?? pacificDateFromTimestamp(chore.createdAt)) === targetDay &&
          chore.title === template.title &&
          chore.stars === template.stars &&
          chore.kidIds.length === 1 &&
          chore.kidIds.includes(kid.id)

        const exists = state.chores.some(matchesTemplate)
        const summary: BedtimeCreationSummary = {
          kidId: kid.id,
          kidName: kid.name,
          stars: template.stars,
          title: template.title,
          template: template.key,
        }

        if (exists) {
          skipped.push(summary)
          continue
        }

        const chore: Chore = {
          id: crypto.randomUUID(),
          kidIds: [kid.id],
          title: template.title,
          emoji: template.emoji,
          stars: template.stars,
          type: 'one-off',
          createdAt: now,
          timeOfDay: 'morning',
          requiresApproval: false,
          scheduledFor: targetDay,
        }

        state.chores.unshift(chore)
        created.push(summary)
      }
    }
  })

  return { created, skipped, dayIso: targetDay }
}
function parseTimeOfDay(
  value: FormDataEntryValue | null,
): 'morning' | 'afternoon' | 'evening' | 'night' | null {
  if (!value) return null
  const normalized = value.toString()
  if (
    normalized === 'morning' ||
    normalized === 'afternoon' ||
    normalized === 'evening' ||
    normalized === 'night'
  ) {
    return normalized
  }
  return null
}
