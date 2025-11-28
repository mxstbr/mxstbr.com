'use server'

import { revalidatePath } from 'next/cache'
import {
  Chore,
  ChoreState,
  ChoreType,
  getChoreState,
  saveChoreState,
} from './data'

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
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

export async function addChore(formData: FormData): Promise<void> {
  const title = formData.get('title')?.toString().trim()
  const emoji = formData.get('emoji')?.toString().trim() || '⭐️'
  const stars = parseNumber(formData.get('stars')) ?? 1
  const kidIds = formData
    .getAll('kidIds')
    .map((value) => value.toString())
    .filter(Boolean)
  const type = (formData.get('type')?.toString() as ChoreType | undefined) ?? 'one-off'
  const cadence = (formData.get('cadence')?.toString() as 'daily' | 'weekly' | undefined) ?? 'daily'
  const timeOfDay = parseTimeOfDay(formData.get('timeOfDay')) ?? 'morning'
  const rawDays = formData
    .getAll('daysOfWeek')
    .map((value) => parseNumber(value))
    .filter((day): day is number => typeof day === 'number' && day >= 0 && day <= 6)
  const daysOfWeek =
    rawDays.length > 0 ? rawDays : [new Date().getUTCDay()]

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
  const choreId = formData.get('choreId')?.toString()
  const kidId = formData.get('kidId')?.toString()
  if (!choreId || !kidId) return { awarded: 0 }

  let awarded = 0

  await withUpdatedState((state) => {
    const chore = state.chores.find((c) => c.id === choreId)
    if (!chore) return
    if (!chore.kidIds.includes(kidId)) return

    const today = todayIsoDate()
    const alreadyCompletedToday =
      chore.type === 'repeated' &&
      state.completions.some(
        (completion) =>
          completion.choreId === chore.id &&
          completion.kidId === kidId &&
          completion.timestamp.slice(0, 10) === today,
      )

    if (chore.type === 'one-off' && chore.completedAt) return
    if (alreadyCompletedToday) return

    awarded = chore.stars

    state.completions.unshift({
      id: crypto.randomUUID(),
      choreId: chore.id,
      kidId,
      timestamp: new Date().toISOString(),
      starsAwarded: chore.stars,
    })

    if (chore.type === 'one-off') {
      const allDone = chore.kidIds.every((id) =>
        state.completions.some((completion) => completion.choreId === chore.id && completion.kidId === id),
      )
      if (allDone) {
        chore.completedAt = new Date().toISOString()
      }
    }
  })

  return { awarded }
}

export async function setPause(formData: FormData): Promise<void> {
  const choreId = formData.get('choreId')?.toString()
  const pausedUntil = formData.get('pausedUntil')?.toString()
  if (!choreId) return

  await withUpdatedState((state) => {
    const chore = state.chores.find((c) => c.id === choreId)
    if (!chore || chore.type !== 'repeated') return

    chore.pausedUntil = pausedUntil || null
  })
}

export async function renameKid(formData: FormData): Promise<void> {
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

export async function archiveChore(formData: FormData): Promise<void> {
  const choreId = formData.get('choreId')?.toString()
  if (!choreId) return

  await withUpdatedState((state) => {
    state.chores = state.chores.filter((chore) => chore.id !== choreId)
  })
}

export async function setTimeOfDay(formData: FormData): Promise<void> {
  const choreId = formData.get('choreId')?.toString()
  const timeOfDay = parseTimeOfDay(formData.get('timeOfDay'))
  if (!choreId || !timeOfDay) return

  await withUpdatedState((state) => {
    const chore = state.chores.find((c) => c.id === choreId)
    if (!chore) return
    chore.timeOfDay = timeOfDay
  })
}

export async function adjustKidStars(formData: FormData): Promise<void> {
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
  const choreId = formData.get('choreId')?.toString()
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
  })
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
