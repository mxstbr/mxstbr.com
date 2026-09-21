export const PERIODS = ['morning', 'afternoon', 'evening', 'night'] as const
export type Period = (typeof PERIODS)[number]
export type Group = Period | 'bonus'
export type Kid = { id: string; name: string; color: string }
export type Chore = {
  id: string
  title: string
  emoji: string
  stars: number
  kidIds: string[]
  type: 'one-off' | 'repeated' | 'perpetual'
  timeOfDay?: Period
  requiresApproval?: boolean
  scheduledFor?: string
  archivedFrom?: string | null
  schedule?: { cadence: 'daily' | 'weekly'; daysOfWeek?: number[] }
  pausedUntil?: string | null
  snoozedUntil?: string | null
  snoozedForKids?: Record<string, string | null>
  createdAt: string
}
export type Reward = {
  id: string
  title: string
  emoji: string
  cost: number
  kidIds: string[]
  type: 'one-off' | 'perpetual'
  createdAt: string
  archived?: boolean
}
export type Actor =
  | { kind: 'parent'; id: string }
  | { kind: 'kid'; id: string; kidIds: string[] }
export type Occurrence = {
  id: string
  day: string
  kidId: string
  choreId: string
  chore: Chore
  group: Group
  opensAt: string
  closesAt: string
  required: boolean
  order: number
  withdrawn?: boolean
  // Parent-hidden work is excluded from targets without deleting its history.
  waived?: boolean
}
export type Submission = {
  id: string
  occurrenceId: string
  kidId: string
  submittedAt: string
  stars: number
  notifiedAt?: string
  notificationRetrying?: boolean
  status: 'pending' | 'approved' | 'rejected' | 'undone'
  reviewedAt?: string
  reviewedBy?: string
  undoneAt?: string
  source: 'chores2' | 'legacy'
  legacyId?: string
}
export type LedgerEntry = {
  id: string
  kidId: string
  amount: number
  kind:
    | 'chore'
    | 'period-bonus'
    | 'daily-bonus' // Historical ledger entries only; no new daily awards.
    | 'reward'
    | 'adjustment'
    | 'reversal'
    | 'legacy'
  sourceId: string
  timestamp: string
  actor: string
  note: string
  reverses?: string
  legacySource?: {
    index: number
    timestampMissing: boolean
    originalId?: string
  }
}
export type Redemption = {
  id: string
  kidId: string
  reward: Reward
  timestamp: string
  ledgerId: string
}
export type Day = {
  day: string
  occurrences: Occurrence[]
  submissions: Submission[]
  ledger: LedgerEntry[]
  redemptions: Redemption[]
  awards: Record<string, string | null>
  planned: boolean
}
export type Core = {
  version: 2
  revision: number
  initializedAt: string
  kids: Kid[]
  chores: Chore[]
  rewards: Reward[]
  balances: Record<string, number>
  orders: Record<string, string[]>
  pending: Record<string, string>
  oneOffCompletions: Record<string, string>
  oneOffRedemptions: Record<string, string>
  lastCompleted: Record<string, string>
  packing: Record<string, Record<string, boolean>>
  packingImported: boolean
  notificationsEnabled: boolean
  migration: {
    sourceKey: string
    timestamp: string
    counts: Record<string, number>
    openingBalances: Record<string, number>
  }
}
export type Notification = {
  id: string
  text: string
  createdAt: string
  status: 'pending' | 'sending' | 'delivered'
  attempts: number
  nextAttemptAt: number
  leaseUntil?: number
  lastError?: string
  deliveredAt?: string
  day?: string
  submissionId?: string
}
export type Transaction = {
  core: Core
  days: Record<string, Day>
  notifications: Notification[]
}
export type CommandResult = {
  status:
    | 'completed'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'undone'
    | 'redeemed'
    | 'updated'
    | 'already_processed'
  id?: string
  stars?: number
  periodBonus?: number
  balance?: number
  message: string
}
export type RequestIdentity = {
  id: string
  actorId: string
  fingerprint: string
}
export type Repository = {
  readCore(): Promise<Core>
  readDay(day: string): Promise<Day | null>
  transact<T>(
    days: string[],
    request: RequestIdentity | null,
    operation: (tx: Transaction) => T,
  ): Promise<T>
}
export type Progress = {
  total: number
  completed: number
  pending: number
  missed: number
  stars: number
  earned: boolean
}
export type ChoreCard = {
  occurrenceId: string
  choreId: string
  title: string
  emoji: string
  stars: number
  requiresApproval: boolean
  repeatable: boolean
  group: Group
  isNew: boolean
  availableAt?: string
}
export type CompletedCard = ChoreCard & {
  submissionId: string
  status: Submission['status']
  submittedAt: string
  notificationStatus: 'queued' | 'delivered' | 'retrying'
}
export type KidView = Kid & {
  balance: number
  chores: ChoreCard[]
  bonus: ChoreCard[]
  completed: CompletedCard[]
  periodProgress: Progress
  dailyProgress: Progress
  rewards: (Reward & { redeemed: boolean })[]
  packing: Record<string, boolean>
}
export type Board = {
  revision: number
  serverNow: string
  day: string
  period: Period | null
  boundary: string
  kids: KidView[]
  packingImported: boolean
}

export class ChoresError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ChoresError'
  }
}
export function fail(code: string, message: string): never {
  throw new ChoresError(code, message)
}
