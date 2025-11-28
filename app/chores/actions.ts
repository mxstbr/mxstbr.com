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
}

function parseNumber(value: FormDataEntryValue | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export async function addChore(formData: FormData): Promise<void> {
  const title = formData.get('title')?.toString().trim()
  const emoji = formData.get('emoji')?.toString().trim() || '⭐️'
  const stars = parseNumber(formData.get('stars')) ?? 1
  const kidId = formData.get('kidId')?.toString()
  const type = (formData.get('type')?.toString() as ChoreType | undefined) ?? 'one-off'
  const cadence = (formData.get('cadence')?.toString() as 'daily' | 'weekly' | undefined) ?? 'daily'
  const rawDays = formData
    .getAll('daysOfWeek')
    .map((value) => parseNumber(value))
    .filter((day): day is number => typeof day === 'number' && day >= 0 && day <= 6)
  const daysOfWeek =
    rawDays.length > 0 ? rawDays : [new Date().getUTCDay()]

  if (!title || !kidId) return

  await withUpdatedState((state) => {
    if (!state.kids.find((kid) => kid.id === kidId)) return

    const createdAt = new Date().toISOString()
    const chore: Chore = {
      id: crypto.randomUUID(),
      kidId,
      title,
      emoji,
      stars: Math.max(0, Math.round(stars)),
      type,
      createdAt,
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

export async function completeChore(formData: FormData): Promise<void> {
  const choreId = formData.get('choreId')?.toString()
  if (!choreId) return

  await withUpdatedState((state) => {
    const chore = state.chores.find((c) => c.id === choreId)
    if (!chore) return

    const today = todayIsoDate()
    const alreadyCompletedToday =
      chore.type === 'repeated' &&
      state.completions.some(
        (completion) =>
          completion.choreId === chore.id &&
          completion.timestamp.slice(0, 10) === today,
      )

    if (chore.type === 'one-off' && chore.completedAt) return
    if (alreadyCompletedToday) return

    state.completions.unshift({
      id: crypto.randomUUID(),
      choreId: chore.id,
      kidId: chore.kidId,
      timestamp: new Date().toISOString(),
      starsAwarded: chore.stars,
    })

    if (chore.type === 'one-off') {
      chore.completedAt = new Date().toISOString()
    }
  })
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
  if (!kidId || !name) return

  await withUpdatedState((state) => {
    const kid = state.kids.find((k) => k.id === kidId)
    if (!kid) return
    kid.name = name
  })
}

export async function archiveChore(formData: FormData): Promise<void> {
  const choreId = formData.get('choreId')?.toString()
  if (!choreId) return

  await withUpdatedState((state) => {
    state.chores = state.chores.filter((chore) => chore.id !== choreId)
  })
}
