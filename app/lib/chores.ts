import z from 'zod/v3'
import {
  addChore,
  addReward,
  archiveChore,
  archiveReward,
  completeChore,
  undoChore,
  setPause,
  pauseAllChores,
  setChoreSchedule,
  adjustKidStars,
  renameKid,
  setChoreKids,
  setRewardKids,
  redeemReward,
  setOneOffDate,
} from 'app/(os)/chores/actions'
import {
  CHORES_KEY,
  getChoreState,
  normalizeState,
  type Chore,
  type Kid,
  type Reward,
} from 'app/(os)/chores/data'
import {
  getToday,
  isOpenForKid,
  pacificDateFromTimestamp,
  sortByTimeOfDay,
  scheduleLabel,
} from 'app/(os)/chores/utils'
import { Redis } from '@upstash/redis'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

const isoDaySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe('Pacific date in YYYY-MM-DD format')

const choreIdSchema = z
  .string()
  .min(1)
  .describe(
    'Chore ID from `search_chores.results[].id`. Never invent IDs manually.',
  )

const rewardIdSchema = z
  .string()
  .min(1)
  .describe(
    'Reward ID from `search_rewards.results[].id`. Never invent IDs manually.',
  )

const kidIdSchema = z
  .string()
  .min(1)
  .describe(
    'Kid ID from `search_kids.results[]`, `search_chores.kids[]`, or `search_rewards.kids[]` (for example `kid-1`).',
  )

const completionIdSchema = z
  .string()
  .min(1)
  .describe(
    'Optional completion ID to undo a specific completion instead of the latest match.',
  )

const includeSnapshotSchema = z
  .boolean()
  .optional()
  .default(false)
  .describe(
    'Set true only when you need the full board snapshot in the response. Defaults to false to keep context small.',
  )

const automationToken =
  process.env.CLIPPY_AUTOMATION_TOKEN ?? process.env.CAL_PASSWORD

const redis = Redis.fromEnv()

function appendAutomationToken(formData: FormData) {
  if (!automationToken) return
  formData.append('automationToken', automationToken)
}

const kidIdsSchema = z
  .array(kidIdSchema)
  .min(1, 'At least one kid ID is required')
  .describe('One or more kid IDs that should be assigned to the item.')

const dayOfWeekSchema = z
  .number()
  .int()
  .min(0)
  .max(6)
  .describe('Weekday index where 0=Sunday, 1=Monday, ..., 6=Saturday.')

const daysOfWeekSchema = z
  .array(dayOfWeekSchema)
  .optional()
  .describe(
    'Used with weekly cadence. If omitted for a weekly chore, the server keeps/uses its own defaults.',
  )

const timeOfDaySchema = z
  .enum(['morning', 'afternoon', 'evening', 'night'])
  .describe(
    'Optional time bucket used for display and ordering (morning/afternoon/evening/night).',
  )
  .optional()

const limitSchema = z
  .number()
  .int()
  .min(1)
  .max(100)
  .default(25)
  .describe(
    'Maximum number of matching rows to return. Keep this small unless you really need a large list.',
  )

const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  .describe('Hex color such as #0ea5e9 or #0af')

const cadenceSchema = z
  .enum(['daily', 'weekly'])
  .describe('How often a repeated chore should recur.')

const choreTypeSchema = z
  .enum(['one-off', 'repeated', 'perpetual'])
  .describe('Chore type: one-off, repeated, or perpetual.')

const rewardTypeSchema = z
  .enum(['one-off', 'perpetual'])
  .describe('Reward type: redeem once (one-off) or repeatedly (perpetual).')

const kidSchema = z.object({
  id: kidIdSchema,
  name: z.string().describe('Display name shown on the chores board.'),
  color: hexColorSchema.describe('Accent color for the kid column.'),
})

const choreScheduleSchema = z.object({
  cadence: cadenceSchema,
  daysOfWeek: z.array(dayOfWeekSchema).optional(),
})

const choreSchema = z.object({
  id: choreIdSchema,
  kidIds: z.array(kidIdSchema).describe('Kids assigned to this chore.'),
  title: z.string().describe('Chore title shown to kids.'),
  emoji: z.string().describe('Emoji shown with the chore title.'),
  stars: z.number().describe('Stars awarded per completion.'),
  type: choreTypeSchema,
  requiresApproval: z
    .boolean()
    .optional()
    .describe('Whether this chore requires parental approval.'),
  scheduledFor: isoDaySchema
    .nullable()
    .optional()
    .describe('For one-off chores: the day it becomes available.'),
  schedule: choreScheduleSchema
    .optional()
    .describe('For repeated chores: cadence and optional weekday settings.'),
  pausedUntil: isoDaySchema
    .nullable()
    .optional()
    .describe('If set, repeated chore is paused through this day (inclusive).'),
  snoozedUntil: isoDaySchema
    .nullable()
    .optional()
    .describe('Optional global snooze day for the chore.'),
  snoozedForKids: z
    .record(kidIdSchema, isoDaySchema.nullable())
    .optional()
    .describe('Optional per-kid snooze days.'),
  createdAt: z.string().describe('ISO timestamp when the chore was created.'),
  completedAt: z
    .string()
    .nullable()
    .optional()
    .describe(
      'For one-off chores: completion timestamp once all kids are done.',
    ),
  timeOfDay: timeOfDaySchema,
})

const completionSchema = z.object({
  id: completionIdSchema,
  choreId: choreIdSchema,
  kidId: kidIdSchema,
  timestamp: z.string().describe('ISO timestamp when completion was recorded.'),
  starsAwarded: z.number().describe('Star delta applied for this entry.'),
})

const rewardSchema = z.object({
  id: rewardIdSchema,
  kidIds: z.array(kidIdSchema).describe('Kids allowed to redeem this reward.'),
  title: z.string().describe('Reward title shown on the board.'),
  emoji: z.string().describe('Emoji shown with the reward title.'),
  cost: z.number().describe('Stars removed when redeemed.'),
  type: rewardTypeSchema,
  createdAt: z.string().describe('ISO timestamp when reward was created.'),
  archived: z
    .boolean()
    .optional()
    .describe('Whether the reward has been archived.'),
})

const rewardRedemptionSchema = z.object({
  id: z.string().describe('Reward redemption entry ID.'),
  rewardId: rewardIdSchema,
  kidId: kidIdSchema,
  timestamp: z.string().describe('ISO timestamp when the reward was redeemed.'),
  cost: z.number().describe('Cost charged at redemption time.'),
})

const todayContextSchema = z.object({
  todayIso: isoDaySchema.describe(
    'Effective Pacific day used for this snapshot.',
  ),
  weekday: dayOfWeekSchema,
  nowMs: z
    .number()
    .describe('Unix timestamp in milliseconds for server "now".'),
})

const completedEntrySchema = z.object({
  chore: choreSchema.describe('Chore associated with the completion.'),
  completionId: completionIdSchema,
  timestamp: z
    .string()
    .describe('ISO timestamp when this completion was recorded.'),
})

const choreSnapshotSchema = z.object({
  ctx: todayContextSchema,
  kids: z.array(kidSchema).describe('All kids on the chores board.'),
  chores: z.array(choreSchema).describe('All chores currently on the board.'),
  completions: z
    .array(completionSchema)
    .describe(
      'Completion ledger including manual adjustments and redemptions.',
    ),
  rewards: z
    .array(rewardSchema)
    .describe('All rewards currently on the board.'),
  rewardRedemptions: z
    .array(rewardRedemptionSchema)
    .describe('Reward redemption ledger.'),
  openChoresByKid: z
    .record(kidIdSchema, z.array(choreSchema))
    .describe(
      'For each kid ID, chores that are currently open for the selected day.',
    ),
  completedTodayByKid: z
    .record(kidIdSchema, z.array(completedEntrySchema))
    .describe('For each kid ID, chores completed on the selected day.'),
})

const messageWithSnapshotSchema = z.object({
  message: z
    .string()
    .describe('Human-readable summary of what changed (or was attempted).'),
  snapshot: choreSnapshotSchema
    .optional()
    .describe('Optional full board snapshot when `include_snapshot=true`.'),
})

const completionResultSchema = z.object({
  message: z
    .string()
    .describe('Human-readable result summary for the completion attempt.'),
  awarded: z.number().optional().describe('Stars awarded for this completion.'),
  completionId: completionIdSchema.optional(),
  choreTitle: z
    .string()
    .optional()
    .describe('Resolved chore title if available.'),
  kidName: z.string().optional().describe('Resolved kid name if available.'),
  telegramMessage: z
    .string()
    .nullable()
    .optional()
    .describe('Telegram message text generated by the action, if any.'),
  undoLink: z
    .string()
    .nullable()
    .optional()
    .describe('Undo link generated for Telegram flows, if any.'),
  status: z
    .enum(['completed', 'skipped', 'invalid', 'unauthorized'])
    .optional()
    .describe('Machine-friendly status for this completion call.'),
  snapshot: choreSnapshotSchema
    .optional()
    .describe('Optional full board snapshot when `include_snapshot=true`.'),
})

const undoResultSchema = z.object({
  message: z
    .string()
    .describe('Human-readable result summary for the undo attempt.'),
  delta: z
    .number()
    .optional()
    .describe(
      'Net star change after undo (negative means stars were removed).',
    ),
  status: z
    .enum(['undone', 'not_found', 'invalid'])
    .optional()
    .describe('Machine-friendly status for this undo call.'),
  choreTitle: z
    .string()
    .optional()
    .describe('Resolved chore title if available.'),
  kidName: z.string().optional().describe('Resolved kid name if available.'),
  snapshot: choreSnapshotSchema
    .optional()
    .describe('Optional full board snapshot when `include_snapshot=true`.'),
})

const redeemResultSchema = z.object({
  message: z.string().describe('Human-readable result summary.'),
  success: z
    .boolean()
    .optional()
    .describe('True if redemption succeeded and stars were deducted.'),
  snapshot: choreSnapshotSchema
    .optional()
    .describe('Optional full board snapshot when `include_snapshot=true`.'),
})

const searchKidSchema = z.object({
  id: kidIdSchema,
  name: z.string().describe('Kid display name.'),
  color: hexColorSchema.describe('Kid accent color.'),
})

const choreSearchRowSchema = z.object({
  id: choreIdSchema,
  title: z.string().describe('Chore title.'),
  emoji: z.string().optional().describe('Chore emoji.'),
  stars: z.number().describe('Stars awarded when completed.'),
  type: choreTypeSchema,
  schedule_label: z
    .string()
    .describe(
      'Human-readable schedule label for display (for example `Daily`).',
    ),
  kid_ids: z.array(kidIdSchema).describe('Assigned kid IDs.'),
  kid_names: z
    .array(z.string())
    .describe('Assigned kid names, aligned to kid_ids.'),
  requires_approval: z
    .boolean()
    .optional()
    .describe('Whether this chore requires parental approval.'),
  scheduled_for: isoDaySchema
    .nullable()
    .optional()
    .describe('One-off scheduled day, when relevant.'),
  time_of_day: timeOfDaySchema,
  paused_until: isoDaySchema
    .nullable()
    .optional()
    .describe('Pause date for repeated chores, if present.'),
  snoozed_until: isoDaySchema
    .nullable()
    .optional()
    .describe('Global snooze-until date, if present.'),
  created_at: z.string().optional().describe('Creation timestamp (ISO).'),
})

const rewardSearchRowSchema = z.object({
  id: rewardIdSchema,
  title: z.string().describe('Reward title.'),
  emoji: z.string().optional().describe('Reward emoji.'),
  cost: z.number().describe('Stars required to redeem.'),
  type: rewardTypeSchema,
  kid_ids: z.array(kidIdSchema).describe('Kid IDs who can redeem this reward.'),
  kid_names: z.array(z.string()).describe('Kid names aligned to kid_ids.'),
  created_at: z.string().describe('Creation timestamp (ISO).'),
  archived: z.boolean().optional().describe('Whether the reward is archived.'),
})

const choreSearchResultSchema = z.object({
  query: z
    .string()
    .describe('Raw query string that was used for this search request.'),
  count: z.number().describe('Total matching chores before limit was applied.'),
  kids: z
    .array(searchKidSchema)
    .describe(
      'Current kid roster so future calls can reuse canonical kid IDs.',
    ),
  results: z
    .array(choreSearchRowSchema)
    .describe('Matching chores sorted by newest first.'),
})

const rewardSearchResultSchema = z.object({
  query: z
    .string()
    .describe('Raw query string that was used for this search request.'),
  count: z
    .number()
    .describe('Total matching rewards before limit was applied.'),
  kids: z
    .array(searchKidSchema)
    .describe(
      'Current kid roster so future calls can reuse canonical kid IDs.',
    ),
  results: z
    .array(rewardSearchRowSchema)
    .describe('Matching rewards sorted by newest first.'),
})

const kidSearchResultSchema = z.object({
  query: z
    .string()
    .describe('Raw query string that was used for this search request.'),
  count: z.number().describe('Total matching kids before limit was applied.'),
  results: z
    .array(searchKidSchema)
    .describe(
      'Matching kids sorted alphabetically by name; use `results[].id` as canonical kid IDs in mutate tools.',
    ),
})

async function loadChoreSnapshot(day?: string) {
  const state = await getChoreState()
  const ctx = getToday(day)
  const openChoresByKid: Record<string, typeof state.chores> = {}
  const doneTodayByKid: Record<
    string,
    {
      chore: (typeof state.chores)[number]
      completionId: string
      timestamp: string
    }[]
  > = {}

  for (const kid of state.kids) {
    openChoresByKid[kid.id] = []
    doneTodayByKid[kid.id] = []
  }

  for (const chore of state.chores) {
    for (const kid of state.kids) {
      if (isOpenForKid(chore, kid.id, state.completions, ctx)) {
        openChoresByKid[kid.id]?.push(chore)
      }
    }
  }

  for (const completion of state.completions) {
    if (pacificDateFromTimestamp(completion.timestamp) !== ctx.todayIso)
      continue
    const chore = state.chores.find((entry) => entry.id === completion.choreId)
    if (!chore) continue
    if (!chore.kidIds.includes(completion.kidId)) continue

    doneTodayByKid[completion.kidId]?.push({
      chore,
      completionId: completion.id,
      timestamp: completion.timestamp,
    })
  }

  const sortedOpen = Object.fromEntries(
    Object.entries(openChoresByKid).map(([kidId, chores]) => [
      kidId,
      sortByTimeOfDay(chores),
    ]),
  )

  const sortedDone = Object.fromEntries(
    Object.entries(doneTodayByKid).map(([kidId, entries]) => [
      kidId,
      sortByTimeOfDay(
        entries.map((entry) => ({
          ...entry,
          timeOfDay: entry.chore.timeOfDay,
          createdAt: entry.chore.createdAt,
        })),
      ).map(({ timeOfDay, createdAt, ...rest }) => rest),
    ]),
  )

  return {
    ctx,
    kids: state.kids,
    chores: state.chores,
    completions: state.completions,
    rewards: state.rewards,
    rewardRedemptions: state.rewardRedemptions,
    openChoresByKid: sortedOpen,
    completedTodayByKid: sortedDone,
  }
}

function coerceJsonArray<T>(value: unknown): T[] {
  if (!value) return []
  if (Array.isArray(value)) {
    if (value.length === 1 && Array.isArray(value[0])) {
      return (value[0] as T[]) ?? []
    }
    return value as T[]
  }
  return []
}

async function loadSearchData(): Promise<{
  chores: Chore[]
  rewards: Reward[]
  kids: Kid[]
}> {
  try {
    const [rawChores, rawRewards, rawKids] = await Promise.all([
      redis.json.get<Chore[] | Chore[][]>(CHORES_KEY, '$.chores'),
      redis.json.get<Reward[] | Reward[][]>(CHORES_KEY, '$.rewards'),
      redis.json.get<Kid[] | Kid[][]>(CHORES_KEY, '$.kids'),
    ])

    const chores = coerceJsonArray<Chore>(rawChores)
    const rewards = coerceJsonArray<Reward>(rawRewards)
    const kids = coerceJsonArray<Kid>(rawKids)

    if (kids.length) {
      const normalized = normalizeState({ chores, rewards, kids })
      return {
        chores: normalized.chores,
        rewards: normalized.rewards,
        kids: normalized.kids,
      }
    }
  } catch (error) {
    console.error('Chore search fallback to full state', error)
  }

  const state = await getChoreState()
  return { chores: state.chores, rewards: state.rewards, kids: state.kids }
}

function toStructuredContent(
  value: unknown,
): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object') return undefined
  if (Array.isArray(value)) return undefined
  return value as Record<string, unknown>
}

async function maybeLoadSnapshot(
  includeSnapshot?: boolean,
): Promise<Awaited<ReturnType<typeof loadChoreSnapshot>> | undefined> {
  if (!includeSnapshot) return undefined
  return loadChoreSnapshot()
}

function formatCompletionMessage(result: any): string {
  const choreTitle = result?.choreTitle ?? 'chore'
  const kidName = result?.kidName ? ` for ${result.kidName}` : ''
  const awarded =
    typeof result?.awarded === 'number' && result.awarded > 0
      ? ` (+${result.awarded} stars)`
      : ''

  switch (result?.status) {
    case 'completed':
      return `Marked "${choreTitle}"${kidName} complete${awarded}`
    case 'skipped':
      return `Skipped "${choreTitle}"${kidName} (already handled)`
    case 'unauthorized':
      return 'Not authorized to complete this chore'
    default:
      return 'Could not complete chore'
  }
}

function formatUndoMessage(result: any): string {
  const choreTitle = result?.choreTitle ?? 'chore'
  const kidName = result?.kidName ? ` for ${result.kidName}` : ''
  const stars =
    typeof result?.delta === 'number' && result.delta !== 0
      ? ` (${Math.abs(result.delta)} stars restored)`
      : ''

  if (
    result?.status === 'undone' ||
    (result?.status === undefined &&
      typeof result?.delta === 'number' &&
      result.delta !== 0)
  ) {
    return `Undid "${choreTitle}"${kidName}${stars}`
  }

  if (result?.status === 'not_found' || result?.delta === 0) {
    return 'No completion found to undo'
  }

  return 'Could not undo completion'
}

export function registerChoreTools(server: McpServer) {
  server.registerTool(
    'search_kids',
    {
      title: 'Search Kids',
      description:
        'Resolve canonical kid IDs for chores and rewards mutations without loading a full chores board snapshot. Use this when a user gives a kid name (for example "Darian"), when you need to disambiguate similar names, or when you only need kid IDs/colors. Empty query returns the full kid roster up to `limit`.',
      inputSchema: z.object({
        query: z
          .string()
          .default('')
          .describe(
            'Free-text search against kid ID and display name. Empty string returns all kids up to `limit`.',
          ),
        limit: limitSchema.describe(
          'Maximum number of matching kids to return. Keep this small unless you explicitly need a larger roster slice.',
        ),
      }),
      outputSchema: kidSearchResultSchema,
      annotations: { readOnlyHint: true },
    },
    async ({ query = '', limit = 25 }: { query?: string; limit?: number }) => {
      const { kids } = await loadSearchData()
      const normalizedQuery = query.trim()
      const normalizedLimit = Math.min(100, Math.max(1, limit ?? 25))
      const tokens = normalizedQuery
        .toLowerCase()
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean)

      const filtered = kids.filter((kid) => {
        if (!tokens.length) return true
        const haystack = `${kid.id} ${kid.name}`.toLowerCase()
        return tokens.every((token) => haystack.includes(token))
      })

      const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name))
      const results = sorted.slice(0, normalizedLimit).map((kid) => ({
        id: kid.id,
        name: kid.name,
        color: kid.color,
      }))

      return {
        content: [
          {
            type: 'text' as const,
            text: normalizedQuery
              ? `Found ${filtered.length} kid${filtered.length === 1 ? '' : 's'} matching "${normalizedQuery}"`
              : `Listed ${filtered.length} kid${filtered.length === 1 ? '' : 's'}`,
          },
        ],
        structuredContent: {
          query: normalizedQuery,
          count: filtered.length,
          results,
        },
      }
    },
  )

  server.registerTool(
    'search_chores',
    {
      title: 'Search Chores',
      description:
        'Primary lookup tool for chores. Use this before any chore mutation to resolve canonical chore IDs and kid IDs without loading the entire board snapshot. Pass an empty query to browse chores; pass text to filter by title/emoji.',
      inputSchema: z.object({
        query: z
          .string()
          .default('')
          .describe(
            'Free-text search for chore title/emoji. Empty string returns all chores up to `limit`.',
          ),
        kid_ids: kidIdsSchema.optional(),
        limit: limitSchema,
      }),
      outputSchema: choreSearchResultSchema,
      annotations: { readOnlyHint: true },
    },
    async ({
      query = '',
      kid_ids,
      limit = 25,
    }: {
      query?: string
      kid_ids?: string[]
      limit?: number
    }) => {
      const { chores, kids } = await loadSearchData()
      const normalizedQuery = query.trim()
      const normalizedLimit = Math.min(100, Math.max(1, limit ?? 25))
      const tokens = normalizedQuery
        .toLowerCase()
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean)

      const filtered = chores.filter((chore) => {
        if (kid_ids?.length) {
          const matchesKid = kid_ids.some((kidId) =>
            chore.kidIds.includes(kidId),
          )
          if (!matchesKid) return false
        }

        if (!tokens.length) return true
        const haystack = `${chore.title} ${chore.emoji ?? ''}`.toLowerCase()
        return tokens.every((token) => haystack.includes(token))
      })

      const sorted = filtered.sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      )
      const limitedResults = sorted.slice(0, normalizedLimit)

      const kidNameById = new Map(kids.map((kid) => [kid.id, kid.name]))
      const kidRows = kids.map((kid) => ({
        id: kid.id,
        name: kid.name,
        color: kid.color,
      }))
      const results = limitedResults.map((chore) => ({
        id: chore.id,
        title: chore.title,
        emoji: chore.emoji,
        stars: chore.stars,
        type: chore.type,
        schedule_label: scheduleLabel(chore),
        kid_ids: chore.kidIds,
        kid_names: chore.kidIds
          .map((kidId) => kidNameById.get(kidId))
          .filter(Boolean) as string[],
        requires_approval: chore.requiresApproval ?? false,
        scheduled_for: chore.scheduledFor ?? null,
        time_of_day: chore.timeOfDay,
        paused_until: chore.pausedUntil ?? null,
        snoozed_until: chore.snoozedUntil ?? null,
        created_at: chore.createdAt,
      }))

      return {
        content: [
          {
            type: 'text' as const,
            text: normalizedQuery
              ? `Found ${filtered.length} chore${filtered.length === 1 ? '' : 's'} matching "${normalizedQuery}"`
              : `Listed ${filtered.length} chore${filtered.length === 1 ? '' : 's'}`,
          },
        ],
        structuredContent: {
          query: normalizedQuery,
          count: filtered.length,
          kids: kidRows,
          results,
        },
      }
    },
  )

  server.registerTool(
    'search_rewards',
    {
      title: 'Search Rewards',
      description:
        'Primary lookup tool for rewards. Use this before reward mutations to resolve canonical reward IDs and kid IDs without loading the full board snapshot. Pass an empty query to browse rewards; pass text to filter by title/emoji.',
      inputSchema: z.object({
        query: z
          .string()
          .default('')
          .describe(
            'Free-text search for reward title/emoji. Empty string returns all rewards up to `limit`.',
          ),
        kid_ids: kidIdsSchema
          .optional()
          .describe(
            'Optional filter to rewards available to one or more kids.',
          ),
        limit: limitSchema,
      }),
      outputSchema: rewardSearchResultSchema,
      annotations: { readOnlyHint: true },
    },
    async ({
      query = '',
      kid_ids,
      limit = 25,
    }: {
      query?: string
      kid_ids?: string[]
      limit?: number
    }) => {
      const { rewards, kids } = await loadSearchData()
      const normalizedQuery = query.trim()
      const normalizedLimit = Math.min(100, Math.max(1, limit ?? 25))
      const tokens = normalizedQuery
        .toLowerCase()
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean)

      const filtered = rewards.filter((reward) => {
        if (kid_ids?.length) {
          const matchesKid = kid_ids.some((kidId) =>
            reward.kidIds.includes(kidId),
          )
          if (!matchesKid) return false
        }

        if (!tokens.length) return true
        const haystack = `${reward.title} ${reward.emoji ?? ''}`.toLowerCase()
        return tokens.every((token) => haystack.includes(token))
      })

      const sorted = filtered.sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      )
      const limitedResults = sorted.slice(0, normalizedLimit)

      const kidNameById = new Map(kids.map((kid) => [kid.id, kid.name]))
      const kidRows = kids.map((kid) => ({
        id: kid.id,
        name: kid.name,
        color: kid.color,
      }))
      const results = limitedResults.map((reward) => ({
        id: reward.id,
        title: reward.title,
        emoji: reward.emoji,
        cost: reward.cost,
        type: reward.type,
        kid_ids: reward.kidIds,
        kid_names: reward.kidIds
          .map((kidId) => kidNameById.get(kidId))
          .filter(Boolean) as string[],
        created_at: reward.createdAt,
        archived: reward.archived ?? false,
      }))

      return {
        content: [
          {
            type: 'text' as const,
            text: normalizedQuery
              ? `Found ${filtered.length} reward${filtered.length === 1 ? '' : 's'} matching "${normalizedQuery}"`
              : `Listed ${filtered.length} reward${filtered.length === 1 ? '' : 's'}`,
          },
        ],
        structuredContent: {
          query: normalizedQuery,
          count: filtered.length,
          kids: kidRows,
          results,
        },
      }
    },
  )

  server.registerTool(
    'create_chore',
    {
      title: 'Create Chore',
      description:
        'Create a chore and assign it to one or more kids. This writes directly to the chores board. Use `search_chores` first so you pass real kid IDs and avoid duplicate chores.',
      inputSchema: z.object({
        title: z.string().min(1, 'Title is required').describe('Chore title.'),
        emoji: z
          .string()
          .optional()
          .describe('Optional emoji. Defaults to ⭐️ when omitted.'),
        stars: z
          .number()
          .int()
          .min(0)
          .default(1)
          .describe('Stars awarded when this chore is completed.'),
        kid_ids: kidIdsSchema,
        type: choreTypeSchema.default('one-off'),
        cadence: cadenceSchema
          .optional()
          .describe('Only used when type is `repeated`.'),
        days_of_week: daysOfWeekSchema,
        time_of_day: timeOfDaySchema,
        requires_approval: z
          .boolean()
          .optional()
          .default(false)
          .describe(
            'Set true to require parent approval before completion is confirmed.',
          ),
        scheduled_for: isoDaySchema
          .optional()
          .describe('Only used when type is `one-off`.'),
        include_snapshot: includeSnapshotSchema,
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({
      title,
      emoji,
      stars,
      kid_ids,
      type,
      cadence,
      days_of_week,
      time_of_day,
      requires_approval,
      scheduled_for,
      include_snapshot,
    }: {
      title: string
      emoji?: string
      stars: number
      kid_ids: string[]
      type: 'one-off' | 'repeated' | 'perpetual'
      cadence?: 'daily' | 'weekly'
      days_of_week?: number[]
      time_of_day?: 'morning' | 'afternoon' | 'evening' | 'night'
      requires_approval?: boolean
      scheduled_for?: string
      include_snapshot?: boolean
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('title', title)
      if (emoji) formData.append('emoji', emoji)
      formData.append('stars', stars.toString())
      kid_ids.forEach((kidId) => formData.append('kidIds', kidId))
      formData.append('type', type)
      if (type === 'one-off' && scheduled_for) {
        formData.append('scheduledFor', scheduled_for)
      }
      if (type === 'repeated' && cadence) {
        formData.append('cadence', cadence)
        if (cadence === 'weekly') {
          ;(days_of_week ?? []).forEach((day) =>
            formData.append('daysOfWeek', day.toString()),
          )
        }
      }
      if (time_of_day) formData.append('timeOfDay', time_of_day)
      if (requires_approval) formData.append('requiresApproval', 'true')
      await addChore(formData)
      const snapshot = await maybeLoadSnapshot(include_snapshot)
      return {
        content: [
          {
            type: 'text' as const,
            text: `Chore "${title}" created`,
          },
        ],
        structuredContent: toStructuredContent({
          message: `Chore "${title}" created`,
          snapshot,
        }),
      }
    },
  )
  server.registerTool(
    'complete_chore',
    {
      title: 'Complete Chore',
      description:
        "Mark a chore complete for a specific kid on today's Pacific date and award stars. This can trigger bonus stars when all expected chores are done for the day.",
      inputSchema: z.object({
        chore_id: choreIdSchema,
        kid_id: kidIdSchema,
        include_snapshot: includeSnapshotSchema,
      }),
      outputSchema: completionResultSchema,
    },
    async ({
      chore_id,
      kid_id,
      include_snapshot,
    }: {
      chore_id: string
      kid_id: string
      include_snapshot?: boolean
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      formData.append('kidId', kid_id)
      const result = await completeChore(formData)
      const snapshot = await maybeLoadSnapshot(include_snapshot)
      const message = formatCompletionMessage(result)
      return {
        content: [
          {
            type: 'text' as const,
            text: message,
          },
        ],
        structuredContent: toStructuredContent({
          message,
          ...result,
          snapshot,
        }),
      }
    },
  )
  server.registerTool(
    'undo_chore_completion',
    {
      title: 'Undo Chore Completion',
      description:
        "Undo a chore completion for a specific kid on today's Pacific date. If `completion_id` is omitted, the server undoes the latest matching completion for that kid/chore/day.",
      inputSchema: z.object({
        chore_id: choreIdSchema,
        kid_id: kidIdSchema,
        completion_id: completionIdSchema.optional(),
        include_snapshot: includeSnapshotSchema,
      }),
      outputSchema: undoResultSchema,
    },
    async ({
      chore_id,
      kid_id,
      completion_id,
      include_snapshot,
    }: {
      chore_id: string
      kid_id: string
      completion_id?: string
      include_snapshot?: boolean
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      formData.append('kidId', kid_id)
      if (completion_id) formData.append('completionId', completion_id)
      const result = await undoChore(formData)
      const snapshot = await maybeLoadSnapshot(include_snapshot)
      const status =
        typeof result?.delta === 'number' && result.delta !== 0
          ? 'undone'
          : 'not_found'
      const message = formatUndoMessage({ ...result, status })
      return {
        content: [
          {
            type: 'text' as const,
            text: message,
          },
        ],
        structuredContent: toStructuredContent({
          message,
          ...result,
          status,
          snapshot,
        }),
      }
    },
  )
  server.registerTool(
    'set_chore_schedule',
    {
      title: 'Set Chore Schedule',
      description:
        'Update the recurrence schedule for a repeated chore. This only affects chores of type `repeated`; other types are left unchanged.',
      inputSchema: z.object({
        chore_id: choreIdSchema,
        cadence: cadenceSchema.default('daily'),
        days_of_week: daysOfWeekSchema,
        include_snapshot: includeSnapshotSchema,
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({
      chore_id,
      cadence,
      days_of_week,
      include_snapshot,
    }: {
      chore_id: string
      cadence: 'daily' | 'weekly'
      days_of_week?: number[]
      include_snapshot?: boolean
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      formData.append('cadence', cadence)
      ;(days_of_week ?? []).forEach((day) =>
        formData.append('daysOfWeek', day.toString()),
      )
      await setChoreSchedule(formData)
      const state = await getChoreState()
      const chore = state.chores.find((entry) => entry.id === chore_id)
      const snapshot = await maybeLoadSnapshot(include_snapshot)
      const message =
        chore?.type === 'repeated'
          ? `Schedule updated to ${cadence}${
              cadence === 'weekly'
                ? ` on days ${(days_of_week ?? []).join(', ') || 'unspecified'}`
                : ''
            }`
          : 'Chore schedule unchanged because it is not repeated'
      return {
        content: [
          {
            type: 'text' as const,
            text: message,
          },
        ],
        structuredContent: toStructuredContent({ message, snapshot }),
      }
    },
  )
  server.registerTool(
    'pause_chore',
    {
      title: 'Pause Chore',
      description:
        'Pause or resume a single chore. For repeated chores, a pause blocks openings through `paused_until` (inclusive). Send an empty string to resume.',
      inputSchema: z.object({
        chore_id: choreIdSchema,
        paused_until: z
          .union([isoDaySchema, z.literal('')])
          .describe(
            'Set a date to pause until (inclusive) or send an empty string to resume',
          ),
        include_snapshot: includeSnapshotSchema,
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({
      chore_id,
      paused_until,
      include_snapshot,
    }: {
      chore_id: string
      paused_until: string
      include_snapshot?: boolean
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      formData.append('pausedUntil', paused_until)
      await setPause(formData)
      const snapshot = await maybeLoadSnapshot(include_snapshot)
      const message = paused_until
        ? `Chore paused until ${paused_until}`
        : 'Chore resumed'
      return {
        content: [
          {
            type: 'text' as const,
            text: message,
          },
        ],
        structuredContent: toStructuredContent({ message, snapshot }),
      }
    },
  )
  server.registerTool(
    'pause_all_chores',
    {
      title: 'Pause All Chores',
      description:
        'Pause or resume every chore at once. This writes a global pause/snooze date onto all chores. Send an empty string to resume everything.',
      inputSchema: z.object({
        paused_until: z
          .union([isoDaySchema, z.literal('')])
          .describe(
            'Set a date to pause all chores or send an empty string to resume',
          ),
        include_snapshot: includeSnapshotSchema,
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({
      paused_until,
      include_snapshot,
    }: {
      paused_until: string
      include_snapshot?: boolean
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('pausedUntil', paused_until)
      await pauseAllChores(formData)
      const snapshot = await maybeLoadSnapshot(include_snapshot)
      const message = paused_until
        ? `All chores paused until ${paused_until}`
        : 'All chores resumed'
      return {
        content: [
          {
            type: 'text' as const,
            text: message,
          },
        ],
        structuredContent: toStructuredContent({ message, snapshot }),
      }
    },
  )
  server.registerTool(
    'set_chore_assignments',
    {
      title: 'Set Chore Assignments',
      description:
        'Update which kids a chore applies to, and optionally update approval/time-of-day settings. This overwrites kid assignments with the provided list.',
      inputSchema: z.object({
        chore_id: choreIdSchema,
        kid_ids: kidIdsSchema,
        time_of_day: timeOfDaySchema,
        clear_time_of_day: z
          .boolean()
          .optional()
          .describe(
            'Set true to clear time_of_day when no new time_of_day is provided.',
          ),
        requires_approval: z
          .boolean()
          .optional()
          .describe(
            'Optional approval flag. If omitted, existing approval setting is left as-is.',
          ),
        include_snapshot: includeSnapshotSchema,
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({
      chore_id,
      kid_ids,
      time_of_day,
      clear_time_of_day,
      requires_approval,
      include_snapshot,
    }: {
      chore_id: string
      kid_ids: string[]
      time_of_day?: 'morning' | 'afternoon' | 'evening' | 'night'
      clear_time_of_day?: boolean
      requires_approval?: boolean
      include_snapshot?: boolean
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      kid_ids.forEach((kidId) => formData.append('kidIds', kidId))
      if (time_of_day) {
        formData.append('timeOfDay', time_of_day)
      } else if (clear_time_of_day) {
        formData.append('timeOfDay', '')
      }
      if (requires_approval !== undefined) {
        formData.append(
          'requiresApproval',
          requires_approval ? 'true' : 'false',
        )
      }
      await setChoreKids(formData)
      const snapshot = await maybeLoadSnapshot(include_snapshot)
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Chore assignments saved',
          },
        ],
        structuredContent: toStructuredContent({
          message: 'Chore assignments saved',
          snapshot,
        }),
      }
    },
  )
  server.registerTool(
    'set_one_off_date',
    {
      title: 'Set One-Off Date',
      description:
        'Set the scheduled day for a one-off chore. Non-one-off chores are left unchanged.',
      inputSchema: z.object({
        chore_id: choreIdSchema,
        scheduled_for: isoDaySchema,
        include_snapshot: includeSnapshotSchema,
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({
      chore_id,
      scheduled_for,
      include_snapshot,
    }: {
      chore_id: string
      scheduled_for: string
      include_snapshot?: boolean
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      formData.append('scheduledFor', scheduled_for)
      await setOneOffDate(formData)
      const snapshot = await maybeLoadSnapshot(include_snapshot)
      const message = `One-off scheduled for ${scheduled_for}`
      return {
        content: [
          {
            type: 'text' as const,
            text: message,
          },
        ],
        structuredContent: toStructuredContent({ message, snapshot }),
      }
    },
  )
  server.registerTool(
    'archive_chore',
    {
      title: 'Archive Chore',
      description:
        'Archive (remove) a chore from the board. This is a delete operation for the selected chore ID.',
      inputSchema: z.object({
        chore_id: choreIdSchema,
        include_snapshot: includeSnapshotSchema,
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({
      chore_id,
      include_snapshot,
    }: {
      chore_id: string
      include_snapshot?: boolean
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      await archiveChore(formData)
      const snapshot = await maybeLoadSnapshot(include_snapshot)
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Chore archived',
          },
        ],
        structuredContent: toStructuredContent({
          message: 'Chore archived',
          snapshot,
        }),
      }
    },
  )
  server.registerTool(
    'rename_kid',
    {
      title: 'Rename Kid',
      description:
        'Rename a kid column and optionally update its accent color. This updates kid metadata used across chores and rewards.',
      inputSchema: z.object({
        kid_id: kidIdSchema,
        name: z
          .string()
          .min(1)
          .describe('New display name for the kid column.'),
        color: hexColorSchema.optional(),
        include_snapshot: includeSnapshotSchema,
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({
      kid_id,
      name,
      color,
      include_snapshot,
    }: {
      kid_id: string
      name: string
      color?: string
      include_snapshot?: boolean
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('kidId', kid_id)
      formData.append('name', name)
      if (color) formData.append('color', color)
      await renameKid(formData)
      const snapshot = await maybeLoadSnapshot(include_snapshot)
      const message = `Kid column saved as ${name}`
      return {
        content: [
          {
            type: 'text' as const,
            text: message,
          },
        ],
        structuredContent: toStructuredContent({ message, snapshot }),
      }
    },
  )
  server.registerTool(
    'adjust_kid_stars',
    {
      title: 'Adjust Kid Stars',
      description:
        'Manually add or remove stars from a kid balance by writing a ledger entry. Use positive `delta`; `mode` controls add/remove.',
      inputSchema: z.object({
        kid_id: kidIdSchema,
        delta: z
          .number()
          .int()
          .min(1)
          .describe('Number of stars to add/remove (absolute value).'),
        mode: z
          .enum(['add', 'remove'])
          .default('add')
          .describe('Choose whether to add or remove the provided delta.'),
        include_snapshot: includeSnapshotSchema,
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({
      kid_id,
      delta,
      mode,
      include_snapshot,
    }: {
      kid_id: string
      delta: number
      mode: 'add' | 'remove'
      include_snapshot?: boolean
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('kidId', kid_id)
      formData.append('delta', delta.toString())
      formData.append('mode', mode)
      await adjustKidStars(formData)
      const snapshot = await maybeLoadSnapshot(include_snapshot)
      const message = `Stars ${mode === 'remove' ? 'removed' : 'added'} (${delta})`
      return {
        content: [
          {
            type: 'text' as const,
            text: message,
          },
        ],
        structuredContent: toStructuredContent({ message, snapshot }),
      }
    },
  )
  server.registerTool(
    'add_reward',
    {
      title: 'Add Reward',
      description:
        'Create a reward that assigned kids can redeem with stars. Use `search_rewards` first to avoid accidental duplicates and to confirm kid IDs.',
      inputSchema: z.object({
        title: z.string().min(1).describe('Reward title.'),
        emoji: z
          .string()
          .optional()
          .describe('Optional emoji. Defaults to 🎁 when omitted.'),
        cost: z
          .number()
          .int()
          .min(0)
          .default(1)
          .describe('Stars required to redeem this reward.'),
        reward_type: rewardTypeSchema.default('perpetual'),
        kid_ids: kidIdsSchema,
        include_snapshot: includeSnapshotSchema,
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({
      title,
      emoji,
      cost,
      reward_type,
      kid_ids,
      include_snapshot,
    }: {
      title: string
      emoji?: string
      cost: number
      reward_type: 'one-off' | 'perpetual'
      kid_ids: string[]
      include_snapshot?: boolean
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('title', title)
      if (emoji) formData.append('emoji', emoji)
      formData.append('cost', cost.toString())
      formData.append('rewardType', reward_type)
      kid_ids.forEach((kidId) => formData.append('kidIds', kidId))
      await addReward(formData)
      const snapshot = await maybeLoadSnapshot(include_snapshot)
      const message = `Reward "${title}" created`
      return {
        content: [
          {
            type: 'text' as const,
            text: message,
          },
        ],
        structuredContent: toStructuredContent({ message, snapshot }),
      }
    },
  )
  server.registerTool(
    'set_reward_kids',
    {
      title: 'Set Reward Kids',
      description:
        'Overwrite which kids can see/redeem a reward. Use `search_rewards` to resolve the reward ID first.',
      inputSchema: z.object({
        reward_id: rewardIdSchema,
        kid_ids: kidIdsSchema,
        include_snapshot: includeSnapshotSchema,
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({
      reward_id,
      kid_ids,
      include_snapshot,
    }: {
      reward_id: string
      kid_ids: string[]
      include_snapshot?: boolean
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('rewardId', reward_id)
      kid_ids.forEach((kidId) => formData.append('kidIds', kidId))
      await setRewardKids(formData)
      const snapshot = await maybeLoadSnapshot(include_snapshot)
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Reward audience updated',
          },
        ],
        structuredContent: toStructuredContent({
          message: 'Reward audience updated',
          snapshot,
        }),
      }
    },
  )
  server.registerTool(
    'archive_reward',
    {
      title: 'Archive Reward',
      description:
        'Archive (remove) a reward from the board. This is a delete operation for the selected reward ID.',
      inputSchema: z.object({
        reward_id: rewardIdSchema,
        include_snapshot: includeSnapshotSchema,
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({
      reward_id,
      include_snapshot,
    }: {
      reward_id: string
      include_snapshot?: boolean
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('rewardId', reward_id)
      await archiveReward(formData)
      const snapshot = await maybeLoadSnapshot(include_snapshot)
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Reward archived',
          },
        ],
        structuredContent: toStructuredContent({
          message: 'Reward archived',
          snapshot,
        }),
      }
    },
  )
  server.registerTool(
    'redeem_reward',
    {
      title: 'Redeem Reward',
      description:
        'Redeem a reward for a kid if they have enough stars and are allowed to redeem it. This deducts stars and records a redemption entry.',
      inputSchema: z.object({
        reward_id: rewardIdSchema,
        kid_id: kidIdSchema,
        include_snapshot: includeSnapshotSchema,
      }),
      outputSchema: redeemResultSchema,
    },
    async ({
      reward_id,
      kid_id,
      include_snapshot,
    }: {
      reward_id: string
      kid_id: string
      include_snapshot?: boolean
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('rewardId', reward_id)
      formData.append('kidId', kid_id)
      const result = await redeemReward(formData)
      const snapshot = await maybeLoadSnapshot(include_snapshot)
      const message = result?.success
        ? 'Reward redeemed'
        : 'Could not redeem reward'
      return {
        content: [
          {
            type: 'text' as const,
            text: message,
          },
        ],
        structuredContent: toStructuredContent({
          message,
          ...result,
          snapshot,
        }),
      }
    },
  )
}
