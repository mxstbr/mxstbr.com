import z from 'zod/v3'
import {
  addChoreDetailed,
  addRewardDetailed,
  adjustKidStarsDetailed,
  archiveChoreDetailed,
  archiveRewardDetailed,
  completeChore,
  pauseAllChoresDetailed,
  redeemReward,
  renameKidDetailed,
  undoChoreDetailed,
  updateChore,
  updateReward,
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
  getDailyChoreProgress,
  getToday,
  isOpenForKid,
  pacificDateFromTimestamp,
  scheduleLabel,
  sortByTimeOfDay,
  starsForKid,
} from 'app/(os)/chores/utils'
import { Redis } from '@upstash/redis'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

const isoDaySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe('Pacific date in YYYY-MM-DD format.')

const choreIdSchema = z
  .string()
  .min(1)
  .describe('Chore ID returned by get_chore_board or search_chores.')

const rewardIdSchema = z
  .string()
  .min(1)
  .describe('Reward ID returned by search_rewards.')

const kidIdSchema = z
  .string()
  .min(1)
  .describe('Kid ID returned by list_kids, get_chore_board, or a search tool.')

const completionIdSchema = z
  .string()
  .min(1)
  .describe('Completion ledger entry ID.')

const kidIdsSchema = z
  .array(kidIdSchema)
  .min(1, 'At least one kid ID is required.')
  .describe('Canonical IDs of the kids assigned to the item.')

const dayOfWeekSchema = z
  .number()
  .int()
  .min(0)
  .max(6)
  .describe('Weekday index where 0=Sunday and 6=Saturday.')

const daysOfWeekSchema = z
  .array(dayOfWeekSchema)
  .optional()
  .describe('Weekdays used by a weekly repeated chore.')

const timeOfDayValueSchema = z
  .enum(['morning', 'afternoon', 'evening', 'night'])
  .describe('Display and ordering time bucket.')

const timeOfDaySchema = timeOfDayValueSchema.optional()

const limitSchema = z
  .number()
  .int()
  .min(1)
  .max(100)
  .default(25)
  .describe('Maximum rows to return, from 1 through 100.')

const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  .describe('Three- or six-digit hex color.')

const cadenceSchema = z
  .enum(['daily', 'weekly'])
  .describe('Recurrence cadence for a repeated chore.')
const choreTypeSchema = z
  .enum(['one-off', 'repeated', 'perpetual'])
  .describe('Lifecycle type for a chore.')
const rewardTypeSchema = z
  .enum(['one-off', 'perpetual'])
  .describe('Whether a reward can be redeemed once or repeatedly.')

const kidSchema = z.object({
  id: kidIdSchema,
  name: z.string(),
  color: hexColorSchema,
})

const choreScheduleSchema = z.object({
  cadence: cadenceSchema,
  daysOfWeek: z.array(dayOfWeekSchema).optional(),
})

const choreSchema = z.object({
  id: choreIdSchema,
  kidIds: z.array(kidIdSchema),
  title: z.string(),
  emoji: z.string(),
  stars: z.number(),
  type: choreTypeSchema,
  requiresApproval: z.boolean().optional(),
  scheduledFor: isoDaySchema.nullable().optional(),
  schedule: choreScheduleSchema.optional(),
  pausedUntil: isoDaySchema.nullable().optional(),
  snoozedUntil: isoDaySchema.nullable().optional(),
  snoozedForKids: z.record(kidIdSchema, isoDaySchema.nullable()).optional(),
  createdAt: z.string(),
  completedAt: z.string().nullable().optional(),
  timeOfDay: timeOfDaySchema,
})

const completionSchema = z.object({
  id: completionIdSchema,
  choreId: choreIdSchema,
  kidId: kidIdSchema,
  timestamp: z.string(),
  starsAwarded: z.number(),
})

const rewardSchema = z.object({
  id: rewardIdSchema,
  kidIds: z.array(kidIdSchema),
  title: z.string(),
  emoji: z.string(),
  cost: z.number(),
  type: rewardTypeSchema,
  createdAt: z.string(),
  archived: z.boolean().optional(),
})

const rewardRedemptionSchema = z.object({
  id: z.string(),
  rewardId: rewardIdSchema,
  kidId: kidIdSchema,
  timestamp: z.string(),
  cost: z.number(),
})

const businessErrorCodeSchema = z.enum([
  'chore_not_found',
  'chore_not_one_off',
  'chore_not_repeated',
  'completion_not_found',
  'insufficient_stars',
  'kid_not_assigned',
  'kid_not_found',
  'mutation_failed',
  'reward_already_redeemed',
  'reward_not_available',
  'reward_not_found',
])

const businessErrorSchema = z.object({
  status: z.literal('error'),
  code: businessErrorCodeSchema,
  message: z.string(),
})

const changedFieldsSchema = z.array(z.string())

const createChoreResultSchema = z.object({
  result: z.union([
    z.object({ status: z.literal('created'), chore: choreSchema }),
    businessErrorSchema,
  ]),
})

const updateChoreResultSchema = z.object({
  result: z.union([
    z.object({
      status: z.enum(['updated', 'unchanged']),
      chore: choreSchema,
      changed_fields: changedFieldsSchema,
    }),
    businessErrorSchema,
  ]),
})

const completeChoreResultSchema = z.object({
  result: z.union([
    z.object({
      status: z.enum(['completed', 'skipped']),
      chore: choreSchema,
      kid: kidSchema,
      completion: completionSchema.nullable(),
      stars_awarded: z.number(),
      bonus_stars_awarded: z.number(),
      bonus_message: z.string().nullable(),
      telegram_message: z.string().nullable(),
      undo_link: z.string().nullable(),
    }),
    businessErrorSchema,
  ]),
})

const undoChoreResultSchema = z.object({
  result: z.union([
    z.object({
      status: z.literal('undone'),
      chore: choreSchema,
      kid: kidSchema,
      completion_id: completionIdSchema,
      stars_delta: z.number(),
      telegram_message: z.string().nullable(),
    }),
    businessErrorSchema,
  ]),
})

const archiveChoreResultSchema = z.object({
  result: z.union([
    z.object({
      status: z.literal('archived'),
      chore_id: choreIdSchema,
      chore: choreSchema,
    }),
    businessErrorSchema,
  ]),
})

const pauseAllResultSchema = z.object({
  result: z.union([
    z.object({
      status: z.enum(['paused', 'resumed', 'unchanged']),
      paused_until: isoDaySchema.nullable(),
      affected_chore_ids: z.array(choreIdSchema),
    }),
    businessErrorSchema,
  ]),
})

const updateKidResultSchema = z.object({
  result: z.union([
    z.object({
      status: z.enum(['updated', 'unchanged']),
      kid: kidSchema,
      changed_fields: changedFieldsSchema,
    }),
    businessErrorSchema,
  ]),
})

const adjustStarsResultSchema = z.object({
  result: z.union([
    z.object({
      status: z.literal('adjusted'),
      kid: kidSchema,
      ledger_entry_id: z.string(),
      stars_delta: z.number(),
      star_balance: z.number(),
    }),
    businessErrorSchema,
  ]),
})

const createRewardResultSchema = z.object({
  result: z.union([
    z.object({ status: z.literal('created'), reward: rewardSchema }),
    businessErrorSchema,
  ]),
})

const updateRewardResultSchema = z.object({
  result: z.union([
    z.object({
      status: z.enum(['updated', 'unchanged']),
      reward: rewardSchema,
      changed_fields: changedFieldsSchema,
    }),
    businessErrorSchema,
  ]),
})

const archiveRewardResultSchema = z.object({
  result: z.union([
    z.object({
      status: z.literal('archived'),
      reward_id: rewardIdSchema,
      reward: rewardSchema,
    }),
    businessErrorSchema,
  ]),
})

const redeemRewardResultSchema = z.object({
  result: z.union([
    z.object({
      status: z.literal('redeemed'),
      reward: rewardSchema,
      kid: kidSchema,
      redemption: rewardRedemptionSchema,
      star_balance: z.number(),
    }),
    businessErrorSchema,
  ]),
})

const searchKidSchema = z.object({
  id: kidIdSchema,
  name: z.string(),
  color: hexColorSchema,
})

const choreSearchRowSchema = z.object({
  id: choreIdSchema,
  title: z.string(),
  emoji: z.string().optional(),
  stars: z.number(),
  type: choreTypeSchema,
  schedule_label: z.string(),
  kid_ids: z.array(kidIdSchema),
  kid_names: z.array(z.string()),
  requires_approval: z.boolean().optional(),
  scheduled_for: isoDaySchema.nullable().optional(),
  time_of_day: timeOfDaySchema,
  paused_until: isoDaySchema.nullable().optional(),
  snoozed_until: isoDaySchema.nullable().optional(),
  created_at: z.string().optional(),
})

const rewardSearchRowSchema = z.object({
  id: rewardIdSchema,
  title: z.string(),
  emoji: z.string().optional(),
  cost: z.number(),
  type: rewardTypeSchema,
  kid_ids: z.array(kidIdSchema),
  kid_names: z.array(z.string()),
  created_at: z.string(),
  archived: z.boolean().optional(),
})

const choreSearchResultSchema = z.object({
  query: z.string(),
  count: z.number(),
  kids: z.array(searchKidSchema),
  results: z.array(choreSearchRowSchema),
})

const rewardSearchResultSchema = z.object({
  query: z.string(),
  count: z.number(),
  kids: z.array(searchKidSchema),
  results: z.array(rewardSearchRowSchema),
})

const listKidsResultSchema = z.object({
  kids: z.array(searchKidSchema),
})

const progressSchema = z.object({
  total: z.number(),
  completed: z.number(),
  skipped: z.number(),
  remaining: z.number(),
})

const completedBoardChoreSchema = z.object({
  chore: choreSchema,
  completion_id: completionIdSchema,
  timestamp: z.string(),
})

const choreBoardResultSchema = z.object({
  day: isoDaySchema,
  columns: z.array(
    z.object({
      kid: kidSchema,
      star_balance: z.number(),
      open_chores: z.array(choreSchema),
      completed_chores: z.array(completedBoardChoreSchema),
      progress: progressSchema,
    }),
  ),
})

const updateChoreInputSchema = z
  .object({
    chore_id: choreIdSchema,
    title: z.string().min(1).optional(),
    emoji: z.string().min(1).optional(),
    stars: z.number().int().min(0).optional(),
    type: choreTypeSchema.optional(),
    kid_ids: kidIdsSchema.optional(),
    cadence: cadenceSchema.optional(),
    days_of_week: daysOfWeekSchema,
    time_of_day: timeOfDayValueSchema.optional(),
    clear_time_of_day: z.boolean().optional(),
    requires_approval: z.boolean().optional(),
    scheduled_for: isoDaySchema.optional(),
    paused_until: z.union([isoDaySchema, z.literal('')]).optional(),
  })
  .refine(
    ({ chore_id: _choreId, ...updates }) =>
      Object.values(updates).some((value) => value !== undefined),
    { message: 'At least one field to update is required.' },
  )

const updateKidInputSchema = z
  .object({
    kid_id: kidIdSchema,
    name: z.string().min(1).optional(),
    color: hexColorSchema.optional(),
  })
  .refine(({ name, color }) => name !== undefined || color !== undefined, {
    message: 'Provide name, color, or both.',
  })

const updateRewardInputSchema = z
  .object({
    reward_id: rewardIdSchema,
    title: z.string().min(1).optional(),
    emoji: z.string().min(1).optional(),
    cost: z.number().int().min(0).optional(),
    reward_type: rewardTypeSchema.optional(),
    kid_ids: kidIdsSchema.optional(),
  })
  .refine(
    ({ reward_id: _rewardId, ...updates }) =>
      Object.values(updates).some((value) => value !== undefined),
    { message: 'At least one field to update is required.' },
  )

const automationToken =
  process.env.CLIPPY_AUTOMATION_TOKEN ?? process.env.CAL_PASSWORD

const redis = Redis.fromEnv()

function appendAutomationToken(formData: FormData) {
  if (automationToken) formData.append('automationToken', automationToken)
}

function businessError(
  code: z.infer<typeof businessErrorCodeSchema>,
  message: string,
) {
  return {
    content: [{ type: 'text' as const, text: message }],
    structuredContent: {
      result: { status: 'error' as const, code, message },
    },
    isError: true,
  }
}

function success(content: string, structuredContent: Record<string, unknown>) {
  return {
    content: [{ type: 'text' as const, text: content }],
    structuredContent,
  }
}

function mutationSuccess(content: string, result: Record<string, unknown>) {
  return success(content, { result })
}

function missingKidIds(kids: Kid[], kidIds: string[]): string[] {
  const knownIds = new Set(kids.map((kid) => kid.id))
  return kidIds.filter((kidId) => !knownIds.has(kidId))
}

function changedFields<T extends object>(
  before: T,
  after: T,
  fields: (keyof T)[],
): string[] {
  return fields
    .filter(
      (field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]),
    )
    .map(String)
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

function formatCompletionMessage(result: {
  awarded: number
  choreTitle?: string
  kidName?: string
  status: string
}): string {
  const choreTitle = result.choreTitle ?? 'chore'
  const kidName = result.kidName ? ` for ${result.kidName}` : ''
  const awarded = result.awarded > 0 ? ` (+${result.awarded} stars)` : ''

  if (result.status === 'completed') {
    return `Marked "${choreTitle}"${kidName} complete${awarded}`
  }
  if (result.status === 'skipped') {
    return `Skipped "${choreTitle}"${kidName} (already handled)`
  }
  return 'Could not complete chore'
}

export function registerChoreTools(server: McpServer) {
  server.registerTool(
    'list_kids',
    {
      title: 'List Kids',
      description: 'List the kids and their canonical IDs.',
      inputSchema: z.object({}),
      outputSchema: listKidsResultSchema,
      annotations: { readOnlyHint: true },
    },
    async () => {
      const { kids } = await loadSearchData()
      const sortedKids = kids
        .map(({ id, name, color }) => ({ id, name, color }))
        .sort((a, b) => a.name.localeCompare(b.name))
      return success(
        `Listed ${sortedKids.length} kid${sortedKids.length === 1 ? '' : 's'}`,
        { kids: sortedKids },
      )
    },
  )

  server.registerTool(
    'get_chore_board',
    {
      title: 'Get Chore Board',
      description: 'Get the UI-shaped chore board for a Pacific day.',
      inputSchema: z.object({ day: isoDaySchema.optional() }),
      outputSchema: choreBoardResultSchema,
      annotations: { readOnlyHint: true },
    },
    async ({ day }: { day?: string }) => {
      const state = await getChoreState()
      const ctx = getToday(day)

      const columns = state.kids.map((kid) => {
        const openChores = sortByTimeOfDay(
          state.chores.filter((chore) =>
            isOpenForKid(chore, kid.id, state.completions, ctx),
          ),
        )
        const completedChores = sortByTimeOfDay(
          state.completions
            .filter(
              (completion) =>
                completion.kidId === kid.id &&
                pacificDateFromTimestamp(completion.timestamp) === ctx.todayIso,
            )
            .map((completion) => {
              const chore = state.chores.find(
                (entry) => entry.id === completion.choreId,
              )
              return chore && chore.kidIds.includes(kid.id)
                ? {
                    chore,
                    completion_id: completion.id,
                    timestamp: completion.timestamp,
                    timeOfDay: chore.timeOfDay,
                    createdAt: completion.timestamp,
                  }
                : null
            })
            .filter((entry): entry is NonNullable<typeof entry> => !!entry),
        ).map(({ timeOfDay, createdAt, ...entry }) => entry)

        return {
          kid,
          star_balance: starsForKid(state.completions, kid.id),
          open_chores: openChores,
          completed_chores: completedChores,
          progress: getDailyChoreProgress(
            state.chores,
            state.completions,
            kid.id,
            ctx,
          ),
        }
      })

      return success(`Loaded chore board for ${ctx.todayIso}`, {
        day: ctx.todayIso,
        columns,
      })
    },
  )

  server.registerTool(
    'search_chores',
    {
      title: 'Search Chores',
      description: 'Search the durable chore catalog.',
      inputSchema: z.object({
        query: z.string().default(''),
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
        if (
          kid_ids?.length &&
          !kid_ids.some((kidId) => chore.kidIds.includes(kidId))
        ) {
          return false
        }
        if (!tokens.length) return true
        const haystack = `${chore.title} ${chore.emoji ?? ''}`.toLowerCase()
        return tokens.every((token) => haystack.includes(token))
      })

      const kidNameById = new Map(kids.map((kid) => [kid.id, kid.name]))
      const results = filtered
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, normalizedLimit)
        .map((chore) => ({
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

      return success(
        normalizedQuery
          ? `Found ${filtered.length} chore${filtered.length === 1 ? '' : 's'} matching "${normalizedQuery}"`
          : `Listed ${filtered.length} chore${filtered.length === 1 ? '' : 's'}`,
        {
          query: normalizedQuery,
          count: filtered.length,
          kids: kids.map(({ id, name, color }) => ({ id, name, color })),
          results,
        },
      )
    },
  )

  server.registerTool(
    'search_rewards',
    {
      title: 'Search Rewards',
      description: 'Search the durable reward catalog.',
      inputSchema: z.object({
        query: z.string().default(''),
        kid_ids: kidIdsSchema.optional(),
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
        if (
          kid_ids?.length &&
          !kid_ids.some((kidId) => reward.kidIds.includes(kidId))
        ) {
          return false
        }
        if (!tokens.length) return true
        const haystack = `${reward.title} ${reward.emoji ?? ''}`.toLowerCase()
        return tokens.every((token) => haystack.includes(token))
      })

      const kidNameById = new Map(kids.map((kid) => [kid.id, kid.name]))
      const results = filtered
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, normalizedLimit)
        .map((reward) => ({
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

      return success(
        normalizedQuery
          ? `Found ${filtered.length} reward${filtered.length === 1 ? '' : 's'} matching "${normalizedQuery}"`
          : `Listed ${filtered.length} reward${filtered.length === 1 ? '' : 's'}`,
        {
          query: normalizedQuery,
          count: filtered.length,
          kids: kids.map(({ id, name, color }) => ({ id, name, color })),
          results,
        },
      )
    },
  )

  server.registerTool(
    'create_chore',
    {
      title: 'Create Chore',
      description: 'Create and assign a chore.',
      inputSchema: z.object({
        title: z.string().min(1),
        emoji: z.string().min(1).optional(),
        stars: z.number().int().min(0).default(1),
        kid_ids: kidIdsSchema,
        type: choreTypeSchema.default('one-off'),
        cadence: cadenceSchema.optional(),
        days_of_week: daysOfWeekSchema,
        time_of_day: timeOfDayValueSchema.optional(),
        requires_approval: z.boolean().default(false),
        scheduled_for: isoDaySchema.optional(),
      }),
      outputSchema: createChoreResultSchema,
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
    }: {
      title: string
      emoji?: string
      stars: number
      kid_ids: string[]
      type: 'one-off' | 'repeated' | 'perpetual'
      cadence?: 'daily' | 'weekly'
      days_of_week?: number[]
      time_of_day?: 'morning' | 'afternoon' | 'evening' | 'night'
      requires_approval: boolean
      scheduled_for?: string
    }) => {
      const state = await getChoreState()
      const missingIds = missingKidIds(state.kids, kid_ids)
      if (missingIds.length) {
        return businessError(
          'kid_not_found',
          `Unknown kid ID${missingIds.length === 1 ? '' : 's'}: ${missingIds.join(', ')}`,
        )
      }

      const requestedId = crypto.randomUUID()
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('requestedId', requestedId)
      formData.append('title', title)
      if (emoji) formData.append('emoji', emoji)
      formData.append('stars', stars.toString())
      kid_ids.forEach((kidId) => formData.append('kidIds', kidId))
      formData.append('type', type)
      if (type === 'one-off' && scheduled_for) {
        formData.append('scheduledFor', scheduled_for)
      }
      if (type === 'repeated') {
        if (cadence) formData.append('cadence', cadence)
        ;(days_of_week ?? []).forEach((day) =>
          formData.append('daysOfWeek', day.toString()),
        )
      }
      if (time_of_day) formData.append('timeOfDay', time_of_day)
      if (requires_approval) formData.append('requiresApproval', 'true')

      const chore = await addChoreDetailed(formData)
      if (!chore) {
        return businessError('mutation_failed', 'Could not create chore')
      }

      return mutationSuccess(`Chore "${title}" created`, {
        status: 'created',
        chore,
      })
    },
  )

  server.registerTool(
    'update_chore',
    {
      title: 'Update Chore',
      description:
        'Update a chore definition, assignments, schedule, or pause.',
      inputSchema: updateChoreInputSchema,
      outputSchema: updateChoreResultSchema,
    },
    async ({
      chore_id,
      title,
      emoji,
      stars,
      type,
      kid_ids,
      cadence,
      days_of_week,
      time_of_day,
      clear_time_of_day,
      requires_approval,
      scheduled_for,
      paused_until,
    }: {
      chore_id: string
      title?: string
      emoji?: string
      stars?: number
      type?: 'one-off' | 'repeated' | 'perpetual'
      kid_ids?: string[]
      cadence?: 'daily' | 'weekly'
      days_of_week?: number[]
      time_of_day?: 'morning' | 'afternoon' | 'evening' | 'night'
      clear_time_of_day?: boolean
      requires_approval?: boolean
      scheduled_for?: string
      paused_until?: string
    }) => {
      const state = await getChoreState()
      const before = state.chores.find((chore) => chore.id === chore_id)
      if (!before) {
        return businessError('chore_not_found', 'Chore not found')
      }

      if (kid_ids) {
        const missingIds = missingKidIds(state.kids, kid_ids)
        if (missingIds.length) {
          return businessError(
            'kid_not_found',
            `Unknown kid ID${missingIds.length === 1 ? '' : 's'}: ${missingIds.join(', ')}`,
          )
        }
      }

      const effectiveType = type ?? before.type
      if (
        effectiveType !== 'repeated' &&
        (cadence !== undefined ||
          days_of_week !== undefined ||
          paused_until !== undefined)
      ) {
        return businessError(
          'chore_not_repeated',
          'Schedules and pauses only apply to repeated chores',
        )
      }
      if (effectiveType !== 'one-off' && scheduled_for !== undefined) {
        return businessError(
          'chore_not_one_off',
          'scheduled_for only applies to one-off chores',
        )
      }

      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      if (title !== undefined) formData.append('title', title)
      if (emoji !== undefined) formData.append('emoji', emoji)
      if (stars !== undefined) formData.append('stars', stars.toString())
      if (type !== undefined) formData.append('type', type)
      kid_ids?.forEach((kidId) => formData.append('kidIds', kidId))
      if (cadence !== undefined) formData.append('cadence', cadence)
      days_of_week?.forEach((day) =>
        formData.append('daysOfWeek', day.toString()),
      )
      if (time_of_day !== undefined) {
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
      if (scheduled_for !== undefined) {
        formData.append('scheduledFor', scheduled_for)
      }
      if (paused_until !== undefined) {
        formData.append('pausedUntil', paused_until)
      }

      const chore = await updateChore(formData)
      if (!chore) {
        return businessError('mutation_failed', 'Could not update chore')
      }

      const fields = changedFields(before, chore, [
        'title',
        'emoji',
        'stars',
        'type',
        'kidIds',
        'schedule',
        'timeOfDay',
        'requiresApproval',
        'scheduledFor',
        'pausedUntil',
      ])
      const status = fields.length ? 'updated' : 'unchanged'
      return mutationSuccess(
        fields.length ? 'Chore updated' : 'Chore unchanged',
        {
          status,
          chore,
          changed_fields: fields,
        },
      )
    },
  )

  server.registerTool(
    'complete_chore',
    {
      title: 'Complete Chore',
      description: 'Complete a chore for one kid today.',
      inputSchema: z.object({
        chore_id: choreIdSchema,
        kid_id: kidIdSchema,
      }),
      outputSchema: completeChoreResultSchema,
    },
    async ({ chore_id, kid_id }: { chore_id: string; kid_id: string }) => {
      const state = await getChoreState()
      const chore = state.chores.find((entry) => entry.id === chore_id)
      if (!chore) {
        return businessError('chore_not_found', 'Chore not found')
      }
      const kid = state.kids.find((entry) => entry.id === kid_id)
      if (!kid) return businessError('kid_not_found', 'Kid not found')
      if (!chore.kidIds.includes(kid_id)) {
        return businessError(
          'kid_not_assigned',
          'This chore is not assigned to that kid',
        )
      }

      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      formData.append('kidId', kid_id)
      const result = await completeChore(formData)
      if (result.status === 'invalid' || result.status === 'unauthorized') {
        return businessError('mutation_failed', 'Could not complete chore')
      }

      const message = formatCompletionMessage(result)

      return mutationSuccess(message, {
        status: result.status,
        chore: result.chore ?? chore,
        kid: result.kid ?? kid,
        completion: result.completion ?? null,
        stars_awarded: result.awarded,
        bonus_stars_awarded: result.bonusStars ?? 0,
        bonus_message: result.bonusMessage ?? null,
        telegram_message: result.telegramMessage ?? null,
        undo_link: result.undoLink ?? null,
      })
    },
  )

  server.registerTool(
    'undo_chore_completion',
    {
      title: 'Undo Chore Completion',
      description: 'Undo a completion for one kid today.',
      inputSchema: z.object({
        chore_id: choreIdSchema,
        kid_id: kidIdSchema,
        completion_id: completionIdSchema.optional(),
      }),
      outputSchema: undoChoreResultSchema,
    },
    async ({
      chore_id,
      kid_id,
      completion_id,
    }: {
      chore_id: string
      kid_id: string
      completion_id?: string
    }) => {
      const state = await getChoreState()
      const chore = state.chores.find((entry) => entry.id === chore_id)
      if (!chore) {
        return businessError('chore_not_found', 'Chore not found')
      }
      const kid = state.kids.find((entry) => entry.id === kid_id)
      if (!kid) return businessError('kid_not_found', 'Kid not found')

      const today = getToday().todayIso
      const matchesCompletion = (entry: (typeof state.completions)[number]) =>
        entry.choreId === chore_id &&
        entry.kidId === kid_id &&
        pacificDateFromTimestamp(entry.timestamp) === today
      const targetCompletion =
        (completion_id
          ? state.completions.find(
              (entry) => entry.id === completion_id && matchesCompletion(entry),
            )
          : undefined) ?? state.completions.find(matchesCompletion)

      if (!targetCompletion) {
        return businessError(
          'completion_not_found',
          'No completion found to undo',
        )
      }

      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      formData.append('kidId', kid_id)
      if (completion_id) formData.append('completionId', completion_id)
      const result = await undoChoreDetailed(formData)
      if (result.status !== 'undone') {
        return businessError(
          'completion_not_found',
          'No completion found to undo',
        )
      }

      return mutationSuccess(
        `Undid "${result.choreTitle ?? chore.title}" for ${result.kidName ?? kid.name}`,
        {
          status: 'undone',
          chore,
          kid,
          completion_id: targetCompletion.id,
          stars_delta: result.delta,
          telegram_message: result.telegramMessage ?? null,
        },
      )
    },
  )

  server.registerTool(
    'archive_chore',
    {
      title: 'Archive Chore',
      description: 'Remove a chore from the catalog.',
      inputSchema: z.object({ chore_id: choreIdSchema }),
      outputSchema: archiveChoreResultSchema,
    },
    async ({ chore_id }: { chore_id: string }) => {
      const state = await getChoreState()
      const chore = state.chores.find((entry) => entry.id === chore_id)
      if (!chore) {
        return businessError('chore_not_found', 'Chore not found')
      }

      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      const archivedChore = await archiveChoreDetailed(formData)
      if (!archivedChore) {
        return businessError('mutation_failed', 'Could not archive chore')
      }

      return mutationSuccess('Chore archived', {
        status: 'archived',
        chore_id,
        chore: archivedChore,
      })
    },
  )

  server.registerTool(
    'pause_all_chores',
    {
      title: 'Pause All Chores',
      description: 'Pause every chore through a date, or resume all chores.',
      inputSchema: z.object({
        paused_until: z.union([isoDaySchema, z.literal('')]),
      }),
      outputSchema: pauseAllResultSchema,
    },
    async ({ paused_until }: { paused_until: string }) => {
      const targetPause = paused_until || null

      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('pausedUntil', paused_until)
      const affectedChoreIds = await pauseAllChoresDetailed(formData)

      const status = affectedChoreIds.length
        ? paused_until
          ? 'paused'
          : 'resumed'
        : 'unchanged'
      const message = paused_until
        ? `All chores paused until ${paused_until}`
        : 'All chores resumed'
      return mutationSuccess(message, {
        status,
        paused_until: targetPause,
        affected_chore_ids: affectedChoreIds,
      })
    },
  )

  server.registerTool(
    'update_kid',
    {
      title: 'Update Kid',
      description: 'Update a kid name or color.',
      inputSchema: updateKidInputSchema,
      outputSchema: updateKidResultSchema,
    },
    async ({
      kid_id,
      name,
      color,
    }: {
      kid_id: string
      name?: string
      color?: string
    }) => {
      const state = await getChoreState()
      const before = state.kids.find((kid) => kid.id === kid_id)
      if (!before) return businessError('kid_not_found', 'Kid not found')

      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('kidId', kid_id)
      formData.append('name', name ?? before.name)
      if (color !== undefined) formData.append('color', color)
      const kid = await renameKidDetailed(formData)
      if (!kid) {
        return businessError('mutation_failed', 'Could not update kid')
      }
      const fields = changedFields(before, kid, ['name', 'color'])
      const status = fields.length ? 'updated' : 'unchanged'
      return mutationSuccess(fields.length ? 'Kid updated' : 'Kid unchanged', {
        status,
        kid,
        changed_fields: fields,
      })
    },
  )

  server.registerTool(
    'adjust_kid_stars',
    {
      title: 'Adjust Kid Stars',
      description: 'Add or remove stars with a ledger entry.',
      inputSchema: z.object({
        kid_id: kidIdSchema,
        delta: z.number().int().min(1),
        mode: z.enum(['add', 'remove']).default('add'),
      }),
      outputSchema: adjustStarsResultSchema,
    },
    async ({
      kid_id,
      delta,
      mode,
    }: {
      kid_id: string
      delta: number
      mode: 'add' | 'remove'
    }) => {
      const state = await getChoreState()
      const kid = state.kids.find((entry) => entry.id === kid_id)
      if (!kid) return businessError('kid_not_found', 'Kid not found')

      const ledgerEntryId = crypto.randomUUID()
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('requestedId', ledgerEntryId)
      formData.append('kidId', kid_id)
      formData.append('delta', delta.toString())
      formData.append('mode', mode)
      const adjustment = await adjustKidStarsDetailed(formData)
      if (!adjustment) {
        return businessError('mutation_failed', 'Could not adjust stars')
      }

      return mutationSuccess(
        `Stars ${mode === 'remove' ? 'removed' : 'added'} (${delta})`,
        {
          status: 'adjusted',
          kid: adjustment.kid,
          ledger_entry_id: adjustment.completion.id,
          stars_delta: adjustment.completion.starsAwarded,
          star_balance: adjustment.starBalance,
        },
      )
    },
  )

  server.registerTool(
    'create_reward',
    {
      title: 'Create Reward',
      description: 'Create a reward for one or more kids.',
      inputSchema: z.object({
        title: z.string().min(1),
        emoji: z.string().min(1).optional(),
        cost: z.number().int().min(0).default(1),
        reward_type: rewardTypeSchema.default('perpetual'),
        kid_ids: kidIdsSchema,
      }),
      outputSchema: createRewardResultSchema,
    },
    async ({
      title,
      emoji,
      cost,
      reward_type,
      kid_ids,
    }: {
      title: string
      emoji?: string
      cost: number
      reward_type: 'one-off' | 'perpetual'
      kid_ids: string[]
    }) => {
      const state = await getChoreState()
      const missingIds = missingKidIds(state.kids, kid_ids)
      if (missingIds.length) {
        return businessError(
          'kid_not_found',
          `Unknown kid ID${missingIds.length === 1 ? '' : 's'}: ${missingIds.join(', ')}`,
        )
      }

      const requestedId = crypto.randomUUID()
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('requestedId', requestedId)
      formData.append('title', title)
      if (emoji) formData.append('emoji', emoji)
      formData.append('cost', cost.toString())
      formData.append('rewardType', reward_type)
      kid_ids.forEach((kidId) => formData.append('kidIds', kidId))
      const reward = await addRewardDetailed(formData)
      if (!reward) {
        return businessError('mutation_failed', 'Could not create reward')
      }

      return mutationSuccess(`Reward "${title}" created`, {
        status: 'created',
        reward,
      })
    },
  )

  server.registerTool(
    'update_reward',
    {
      title: 'Update Reward',
      description: 'Update a reward definition or audience.',
      inputSchema: updateRewardInputSchema,
      outputSchema: updateRewardResultSchema,
    },
    async ({
      reward_id,
      title,
      emoji,
      cost,
      reward_type,
      kid_ids,
    }: {
      reward_id: string
      title?: string
      emoji?: string
      cost?: number
      reward_type?: 'one-off' | 'perpetual'
      kid_ids?: string[]
    }) => {
      const state = await getChoreState()
      const before = state.rewards.find((reward) => reward.id === reward_id)
      if (!before) {
        return businessError('reward_not_found', 'Reward not found')
      }
      if (kid_ids) {
        const missingIds = missingKidIds(state.kids, kid_ids)
        if (missingIds.length) {
          return businessError(
            'kid_not_found',
            `Unknown kid ID${missingIds.length === 1 ? '' : 's'}: ${missingIds.join(', ')}`,
          )
        }
      }

      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('rewardId', reward_id)
      if (title !== undefined) formData.append('title', title)
      if (emoji !== undefined) formData.append('emoji', emoji)
      if (cost !== undefined) formData.append('cost', cost.toString())
      if (reward_type !== undefined) {
        formData.append('rewardType', reward_type)
      }
      kid_ids?.forEach((kidId) => formData.append('kidIds', kidId))
      const reward = await updateReward(formData)
      if (!reward) {
        return businessError('mutation_failed', 'Could not update reward')
      }
      const fields = changedFields(before, reward, [
        'title',
        'emoji',
        'cost',
        'type',
        'kidIds',
      ])
      const status = fields.length ? 'updated' : 'unchanged'
      return mutationSuccess(
        fields.length ? 'Reward updated' : 'Reward unchanged',
        {
          status,
          reward,
          changed_fields: fields,
        },
      )
    },
  )

  server.registerTool(
    'redeem_reward',
    {
      title: 'Redeem Reward',
      description: 'Redeem a reward for one kid.',
      inputSchema: z.object({
        reward_id: rewardIdSchema,
        kid_id: kidIdSchema,
      }),
      outputSchema: redeemRewardResultSchema,
    },
    async ({ reward_id, kid_id }: { reward_id: string; kid_id: string }) => {
      const state = await getChoreState()
      const reward = state.rewards.find((entry) => entry.id === reward_id)
      if (!reward) {
        return businessError('reward_not_found', 'Reward not found')
      }
      const kid = state.kids.find((entry) => entry.id === kid_id)
      if (!kid) return businessError('kid_not_found', 'Kid not found')
      if (reward.archived || !reward.kidIds.includes(kid_id)) {
        return businessError(
          'reward_not_available',
          'This reward is not available to that kid',
        )
      }
      if (
        reward.type === 'one-off' &&
        state.rewardRedemptions.some(
          (entry) => entry.rewardId === reward_id && entry.kidId === kid_id,
        )
      ) {
        return businessError(
          'reward_already_redeemed',
          'This one-off reward was already redeemed',
        )
      }
      if (starsForKid(state.completions, kid_id) < reward.cost) {
        return businessError(
          'insufficient_stars',
          'Kid does not have enough stars for this reward',
        )
      }

      const completionId = crypto.randomUUID()
      const redemptionId = crypto.randomUUID()
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('requestedCompletionId', completionId)
      formData.append('requestedRedemptionId', redemptionId)
      formData.append('rewardId', reward_id)
      formData.append('kidId', kid_id)
      const result = await redeemReward(formData)
      if (!result.success) {
        return businessError('mutation_failed', 'Could not redeem reward')
      }

      return mutationSuccess('Reward redeemed', {
        status: 'redeemed',
        reward: result.reward,
        kid: result.kid,
        redemption: result.redemption,
        star_balance: result.starBalance,
      })
    },
  )

  server.registerTool(
    'archive_reward',
    {
      title: 'Archive Reward',
      description: 'Remove a reward from the catalog.',
      inputSchema: z.object({ reward_id: rewardIdSchema }),
      outputSchema: archiveRewardResultSchema,
    },
    async ({ reward_id }: { reward_id: string }) => {
      const state = await getChoreState()
      const reward = state.rewards.find((entry) => entry.id === reward_id)
      if (!reward) {
        return businessError('reward_not_found', 'Reward not found')
      }

      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('rewardId', reward_id)
      const archivedReward = await archiveRewardDetailed(formData)
      if (!archivedReward) {
        return businessError('mutation_failed', 'Could not archive reward')
      }

      return mutationSuccess('Reward archived', {
        status: 'archived',
        reward_id,
        reward: archivedReward,
      })
    },
  )
}
