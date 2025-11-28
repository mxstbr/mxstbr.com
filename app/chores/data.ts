import { Redis } from '@upstash/redis'

export type ChoreType = 'one-off' | 'repeated' | 'perpetual'

export type Kid = {
  id: string
  name: string
}

export type ChoreSchedule = {
  cadence: 'daily' | 'weekly'
  daysOfWeek?: number[]
}

export type Chore = {
  id: string
  kidId: string
  title: string
  emoji: string
  stars: number
  type: ChoreType
  schedule?: ChoreSchedule
  pausedUntil?: string | null
  createdAt: string
  completedAt?: string | null
}

export type Completion = {
  id: string
  choreId: string
  kidId: string
  timestamp: string
  starsAwarded: number
}

export type ChoreState = {
  kids: Kid[]
  chores: Chore[]
  completions: Completion[]
}

const redis = Redis.fromEnv()

export const CHORES_KEY = 'chores:mxstbr:family-board'

const DEFAULT_KIDS: Kid[] = [
  { id: 'kid-1', name: 'Kid One' },
  { id: 'kid-2', name: 'Kid Two' },
  { id: 'kid-3', name: 'Kid Three' },
]

function createDefaultChores(kids: Kid[]): Chore[] {
  const createdAt = new Date().toISOString()
  const kidA = kids[0]?.id ?? 'kid-1'
  const kidB = kids[1]?.id ?? 'kid-2'
  const kidC = kids[2]?.id ?? 'kid-3'

  return [
    {
      id: crypto.randomUUID(),
      kidId: kidA,
      title: 'Pack for our next trip',
      emoji: '🎒',
      stars: 5,
      type: 'one-off',
      createdAt,
    },
    {
      id: crypto.randomUUID(),
      kidId: kidB,
      title: 'Brush, change, and pee',
      emoji: '🪥',
      stars: 3,
      type: 'repeated',
      schedule: { cadence: 'daily' },
      createdAt,
    },
    {
      id: crypto.randomUUID(),
      kidId: kidB,
      title: 'Shower day',
      emoji: '🚿',
      stars: 2,
      type: 'repeated',
      schedule: { cadence: 'weekly', daysOfWeek: [3] }, // Wednesday
      createdAt,
    },
    {
      id: crypto.randomUUID(),
      kidId: kidC,
      title: 'Be kind',
      emoji: '💖',
      stars: 1,
      type: 'perpetual',
      createdAt,
    },
  ]
}

function ensureKids(kids: Kid[] | undefined): Kid[] {
  if (!kids?.length) return [...DEFAULT_KIDS]

  const filled = [...kids]
  for (let i = filled.length; i < 3; i++) {
    filled.push({
      ...DEFAULT_KIDS[i],
      id: `kid-${i + 1}`,
    })
  }

  return filled.slice(0, 3)
}

function ensureChores(chores: Chore[] | undefined, kids: Kid[]): Chore[] {
  if (Array.isArray(chores)) return chores
  return createDefaultChores(kids)
}

export function normalizeState(state: Partial<ChoreState> | null): ChoreState {
  const kids = ensureKids(state?.kids)

  return {
    kids,
    chores: ensureChores(state?.chores, kids),
    completions: state?.completions ?? [],
  }
}

export async function getChoreState(): Promise<ChoreState> {
  const stored = await redis.json.get<ChoreState>(CHORES_KEY)
  const normalized = normalizeState(stored)

  if (!stored) {
    await redis.json.set(CHORES_KEY, '$', normalized)
  }

  return normalized
}

export async function saveChoreState(state: ChoreState): Promise<void> {
  await redis.json.set(CHORES_KEY, '$', state)
}
