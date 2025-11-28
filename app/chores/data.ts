import { Redis } from '@upstash/redis'

export type ChoreType = 'one-off' | 'repeated' | 'perpetual'
export type RewardType = 'one-off' | 'perpetual'

export type Kid = {
  id: string
  name: string
  color: string
}

export type ChoreSchedule = {
  cadence: 'daily' | 'weekly'
  daysOfWeek?: number[]
}

export type Chore = {
  id: string
  kidIds: string[]
  title: string
  emoji: string
  stars: number
  type: ChoreType
  schedule?: ChoreSchedule
  pausedUntil?: string | null
  createdAt: string
  completedAt?: string | null
  timeOfDay?: 'morning' | 'afternoon' | 'evening'
}

export type Completion = {
  id: string
  choreId: string
  kidId: string
  timestamp: string
  starsAwarded: number
}

export type Reward = {
  id: string
  kidIds: string[]
  title: string
  emoji: string
  cost: number
  type: RewardType
  createdAt: string
  archived?: boolean
}

export type RewardRedemption = {
  id: string
  rewardId: string
  kidId: string
  timestamp: string
  cost: number
}

export type ChoreState = {
  kids: Kid[]
  chores: Chore[]
  completions: Completion[]
  rewards: Reward[]
  rewardRedemptions: RewardRedemption[]
}

const redis = Redis.fromEnv()

export const CHORES_KEY = 'chores:mxstbr:family-board'

const DEFAULT_KIDS: Kid[] = [
  { id: 'kid-1', name: 'Kid One', color: '#0ea5e9' },
  { id: 'kid-2', name: 'Kid Two', color: '#8b5cf6' },
  { id: 'kid-3', name: 'Kid Three', color: '#f59e0b' },
]

function createDefaultChores(kids: Kid[]): Chore[] {
  const createdAt = new Date().toISOString()
  const kidA = kids[0]?.id ?? 'kid-1'
  const kidB = kids[1]?.id ?? 'kid-2'
  const kidC = kids[2]?.id ?? 'kid-3'

  return [
    {
      id: crypto.randomUUID(),
      kidIds: [kidA, kidB, kidC],
      title: 'Pack for our next trip',
      emoji: '🎒',
      stars: 5,
      type: 'one-off',
      createdAt,
      timeOfDay: 'afternoon',
    },
    {
      id: crypto.randomUUID(),
      kidIds: [kidB],
      title: 'Brush, change, and pee',
      emoji: '🪥',
      stars: 3,
      type: 'repeated',
      schedule: { cadence: 'daily' },
      createdAt,
      timeOfDay: 'evening',
    },
    {
      id: crypto.randomUUID(),
      kidIds: [kidB],
      title: 'Shower day',
      emoji: '🚿',
      stars: 2,
      type: 'repeated',
      schedule: { cadence: 'weekly', daysOfWeek: [3] }, // Wednesday
      createdAt,
      timeOfDay: 'evening',
    },
    {
      id: crypto.randomUUID(),
      kidIds: [kidC],
      title: 'Be kind',
      emoji: '💖',
      stars: 1,
      type: 'perpetual',
      createdAt,
      timeOfDay: 'morning',
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

  return filled.slice(0, 3).map((kid, index) => ({
    ...kid,
    color: kid.color || DEFAULT_KIDS[index]?.color || '#0ea5e9',
  }))
}

function ensureChores(chores: Chore[] | undefined, kids: Kid[]): Chore[] {
  if (!Array.isArray(chores)) return createDefaultChores(kids)
  return chores.map((chore) => {
    const kidIds =
      (chore as any).kidIds && Array.isArray((chore as any).kidIds)
        ? (chore as any).kidIds.filter(Boolean)
        : (chore as any).kidId
          ? [(chore as any).kidId]
          : [kids[0]?.id ?? 'kid-1']

    return {
      ...chore,
      kidIds: kidIds.length ? kidIds : [kids[0]?.id ?? 'kid-1'],
      timeOfDay: chore.timeOfDay ?? undefined,
    }
  })
}

function ensureRewards(rewards: Reward[] | undefined, kids: Kid[]): Reward[] {
  if (!Array.isArray(rewards)) return []
  return rewards.map((reward) => {
    const kidIds =
      (reward as any).kidIds && Array.isArray((reward as any).kidIds)
        ? (reward as any).kidIds.filter(Boolean)
        : [kids[0]?.id ?? 'kid-1']

    return {
      ...reward,
      kidIds: kidIds.length ? kidIds : [kids[0]?.id ?? 'kid-1'],
    }
  })
}

export function normalizeState(state: Partial<ChoreState> | null): ChoreState {
  const kids = ensureKids(state?.kids)

  return {
    kids,
    chores: ensureChores(state?.chores, kids),
    completions: state?.completions ?? [],
    rewards: ensureRewards(state?.rewards, kids),
    rewardRedemptions: state?.rewardRedemptions ?? [],
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
