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
import { siteUrl } from './site-url'

const isoDaySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe('Pacific date in YYYY-MM-DD format')

const automationToken =
  process.env.CLIPPY_AUTOMATION_TOKEN ?? process.env.CAL_PASSWORD

const redis = Redis.fromEnv()

function appendAutomationToken(formData: FormData) {
  if (!automationToken) return
  formData.append('automationToken', automationToken)
}

const kidIdsSchema = z.array(z.string().min(1)).min(1)
const daysOfWeekSchema = z.array(z.number().int().min(0).max(6)).optional()
const timeOfDaySchema = z.enum(['morning', 'afternoon', 'evening']).optional()
const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  .describe('Hex color such as #0ea5e9 or #0af')

const kidSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: hexColorSchema,
})

const choreScheduleSchema = z.object({
  cadence: z.enum(['daily', 'weekly']),
  daysOfWeek: z.array(z.number().int()).optional(),
})

const choreSchema = z.object({
  id: z.string(),
  kidIds: z.array(z.string()),
  title: z.string(),
  emoji: z.string(),
  stars: z.number(),
  type: z.enum(['one-off', 'repeated', 'perpetual']),
  requiresApproval: z.boolean().optional(),
  scheduledFor: z.string().nullable().optional(),
  schedule: choreScheduleSchema.optional(),
  pausedUntil: z.string().nullable().optional(),
  snoozedUntil: z.string().nullable().optional(),
  snoozedForKids: z.record(z.string(), z.string().nullable()).optional(),
  createdAt: z.string(),
  completedAt: z.string().nullable().optional(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening']).optional(),
})

const completionSchema = z.object({
  id: z.string(),
  choreId: z.string(),
  kidId: z.string(),
  timestamp: z.string(),
  starsAwarded: z.number(),
})

const rewardSchema = z.object({
  id: z.string(),
  kidIds: z.array(z.string()),
  title: z.string(),
  emoji: z.string(),
  cost: z.number(),
  type: z.enum(['one-off', 'perpetual']),
  createdAt: z.string(),
  archived: z.boolean().optional(),
})

const rewardRedemptionSchema = z.object({
  id: z.string(),
  rewardId: z.string(),
  kidId: z.string(),
  timestamp: z.string(),
  cost: z.number(),
})

const todayContextSchema = z.object({
  todayIso: z.string(),
  weekday: z.number(),
  nowMs: z.number(),
})

const completedEntrySchema = z.object({
  chore: choreSchema,
  completionId: z.string(),
  timestamp: z.string(),
})

const choreSnapshotSchema = z.object({
  ctx: todayContextSchema,
  kids: z.array(kidSchema),
  chores: z.array(choreSchema),
  completions: z.array(completionSchema),
  rewards: z.array(rewardSchema),
  rewardRedemptions: z.array(rewardRedemptionSchema),
  openChoresByKid: z.record(z.array(choreSchema)),
  completedTodayByKid: z.record(z.array(completedEntrySchema)),
})

const messageWithSnapshotSchema = z.object({
  message: z.string(),
  snapshot: choreSnapshotSchema.optional(),
})

const readBoardSchema = choreSnapshotSchema.extend({
  message: z.string(),
})

const completionResultSchema = z.object({
  message: z.string(),
  awarded: z.number().optional(),
  completionId: z.string().optional(),
  choreTitle: z.string().optional(),
  kidName: z.string().optional(),
  telegramMessage: z.string().nullable().optional(),
  undoLink: z.string().nullable().optional(),
  status: z
    .enum(['completed', 'skipped', 'invalid', 'unauthorized'])
    .optional(),
  snapshot: choreSnapshotSchema.optional(),
})

const undoResultSchema = z.object({
  message: z.string(),
  delta: z.number().optional(),
  status: z.enum(['undone', 'not_found', 'invalid']).optional(),
  choreTitle: z.string().optional(),
  kidName: z.string().optional(),
  snapshot: choreSnapshotSchema.optional(),
})

const redeemResultSchema = z.object({
  message: z.string(),
  success: z.boolean().optional(),
  snapshot: choreSnapshotSchema.optional(),
})

const choreSearchResultSchema = z.object({
  query: z.string(),
  count: z.number(),
  results: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      emoji: z.string().optional(),
      stars: z.number(),
      type: z.enum(['one-off', 'repeated', 'perpetual']),
      kid_ids: z.array(z.string()),
      kid_names: z.array(z.string()),
      requires_approval: z.boolean().optional(),
      scheduled_for: z.string().nullable().optional(),
      time_of_day: z.enum(['morning', 'afternoon', 'evening']).optional(),
      paused_until: z.string().nullable().optional(),
      snoozed_until: z.string().nullable().optional(),
      created_at: z.string().optional(),
    }),
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

async function loadChoresForSearch(): Promise<{
  chores: Chore[]
  kids: Kid[]
}> {
  try {
    const [rawChores, rawKids] = await Promise.all([
      redis.json.get<Chore[] | Chore[][]>(CHORES_KEY, '$.chores'),
      redis.json.get<Kid[] | Kid[][]>(CHORES_KEY, '$.kids'),
    ])

    const chores = coerceJsonArray<Chore>(rawChores)
    const kids = coerceJsonArray<Kid>(rawKids)

    if (chores.length && kids.length) {
      const normalized = normalizeState({ chores, kids })
      return { chores: normalized.chores, kids: normalized.kids }
    }
  } catch (error) {
    console.error('Chore search fallback to full state', error)
  }

  const state = await getChoreState()
  return { chores: state.chores, kids: state.kids }
}

const timeOfDayLabels = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
} as const

export function toChoresTodayMetadata(
  snapshot: Awaited<ReturnType<typeof loadChoreSnapshot>>,
) {
  if (!snapshot || typeof snapshot !== 'object') return undefined
  if (!Array.isArray(snapshot.kids) || !Array.isArray(snapshot.chores))
    return undefined

  const openByKid = snapshot.openChoresByKid ?? {}
  const doneByKid = snapshot.completedTodayByKid ?? {}

  const kidById = new Map(snapshot.kids.map((kid) => [kid.id, kid]))

  const openChoreIds = new Set<string>()
  for (const chores of Object.values(openByKid)) {
    for (const chore of chores) {
      if (chore?.id) openChoreIds.add(chore.id)
    }
  }

  const doneChoreIds = new Set<string>()
  for (const entries of Object.values(doneByKid)) {
    for (const entry of entries) {
      if (entry?.chore?.id) doneChoreIds.add(entry.chore.id)
    }
  }

  const relevant = snapshot.chores.filter(
    (chore) =>
      chore?.id && (openChoreIds.has(chore.id) || doneChoreIds.has(chore.id)),
  )

  const choresToday = relevant.map((chore) => {
    const kids = (Array.isArray(chore.kidIds) ? chore.kidIds : [])
      .map((kidId) => {
        const kid = kidById.get(kidId)
        if (!kid) return null

        const isOpen = (openByKid[kidId] ?? []).some(
          (entry) => entry.id === chore.id,
        )
        const isDone = (doneByKid[kidId] ?? []).some(
          (entry) => entry.chore.id === chore.id,
        )
        const status = isDone ? 'done' : isOpen ? 'due' : 'closed'
        return { kid, status }
      })
      .filter(Boolean)

    const timeOfDay =
      chore?.timeOfDay && chore.timeOfDay in timeOfDayLabels
        ? timeOfDayLabels[chore.timeOfDay as keyof typeof timeOfDayLabels]
        : 'Any time'

    return {
      id: chore.id,
      title: chore.title,
      emoji: chore.emoji,
      stars: chore.stars,
      schedule: scheduleLabel(chore),
      timeOfDay,
      requiresApproval: !!chore.requiresApproval,
      kids,
    }
  })

  return {
    todayIso: snapshot?.ctx?.todayIso,
    choresToday,
  }
}

function outputTemplateUrl(pathname: string) {
  return new URL(pathname, siteUrl()).toString()
}

function toStructuredContent(
  value: unknown,
): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object') return undefined
  if (Array.isArray(value)) return undefined
  return value as Record<string, unknown>
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

  switch (result?.status) {
    case 'undone':
      return `Undid "${choreTitle}"${kidName}${stars}`
    case 'not_found':
      return 'No completion found to undo'
    default:
      return 'Could not undo completion'
  }
}

export function registerChoreTools(server: McpServer) {
  server.registerTool(
    'read_chore_board',
    {
      title: 'Read Chore Board',
      description:
        'Read the current chore board including kids, chores, completions, and rewards.',
      inputSchema: z.object({
        day: isoDaySchema
          .optional()
          .describe('Defaults to today in the Pacific timezone'),
      }),
      outputSchema: readBoardSchema,
      annotations: { readOnlyHint: true },
    },
    async ({ day }: { day?: string }) => {
      const snapshot = await loadChoreSnapshot(day)
      const message = `Loaded chore board for ${
        snapshot?.ctx?.todayIso ?? 'today'
      } with ${(snapshot?.kids ?? []).length} kids, ${(snapshot?.chores ?? []).length} chores, and ${(snapshot?.rewards ?? []).length} rewards`
      return {
        content: [
          {
            type: 'text' as const,
            text: message,
          },
        ],
        structuredContent: snapshot
          ? toStructuredContent({ message, ...snapshot })
          : undefined,
        // _meta: toChoresTodayMetadata(snapshot),
      }
    },
  )
  server.registerTool(
    'search_chores',
    {
      title: 'Search Chores',
      description:
        'Search chores by title or emoji without loading the entire chore board.',
      inputSchema: z.object({
        query: z.string().min(1, 'Query is required'),
        kid_ids: kidIdsSchema.optional(),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .default(10)
          .describe('Number of matches to return (max 50)'),
      }),
      outputSchema: choreSearchResultSchema,
      annotations: { readOnlyHint: true },
    },
    async ({ query, kid_ids, limit = 10 }) => {
      const { chores, kids } = await loadChoresForSearch()
      const normalizedLimit = Math.min(50, Math.max(1, limit ?? 10))
      const tokens = query
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
      const results = limitedResults.map((chore) => ({
        id: chore.id,
        title: chore.title,
        emoji: chore.emoji,
        stars: chore.stars,
        type: chore.type,
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
            text: `Found ${filtered.length} chore${filtered.length === 1 ? '' : 's'} matching "${query}"`,
          },
        ],
        structuredContent: {
          query,
          count: filtered.length,
          results,
        },
      }
    },
  )
  server.registerTool(
    'create_chore',
    {
      title: 'Create Chore',
      description: 'Create a new chore for one or more kids.',
      inputSchema: z.object({
        title: z.string().min(1, 'Title is required'),
        emoji: z.string().optional(),
        stars: z.number().int().min(0).default(1),
        kid_ids: kidIdsSchema,
        type: z.enum(['one-off', 'repeated', 'perpetual']).default('one-off'),
        cadence: z.enum(['daily', 'weekly']).optional(),
        days_of_week: daysOfWeekSchema,
        time_of_day: timeOfDaySchema,
        requires_approval: z.boolean().optional().default(false),
        scheduled_for: isoDaySchema.optional(),
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
    }: {
      title: string
      emoji?: string
      stars: number
      kid_ids: string[]
      type: 'one-off' | 'repeated' | 'perpetual'
      cadence?: 'daily' | 'weekly'
      days_of_week?: number[]
      time_of_day?: 'morning' | 'afternoon' | 'evening'
      requires_approval?: boolean
      scheduled_for?: string
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
      const snapshot = await loadChoreSnapshot()
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
      description: 'Mark a chore done for a kid and award their stars.',
      inputSchema: z.object({
        chore_id: z.string().min(1),
        kid_id: z.string().min(1),
      }),
      outputSchema: completionResultSchema,
    },
    async ({ chore_id, kid_id }: { chore_id: string; kid_id: string }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      formData.append('kidId', kid_id)
      const result = await completeChore(formData)
      const snapshot = await loadChoreSnapshot()
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
      description: 'Undo a chore completion for a kid.',
      inputSchema: z.object({
        chore_id: z.string().min(1),
        kid_id: z.string().min(1),
        completion_id: z.string().optional(),
      }),
      outputSchema: undoResultSchema,
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
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      formData.append('kidId', kid_id)
      if (completion_id) formData.append('completionId', completion_id)
      const result = await undoChore(formData)
      const snapshot = await loadChoreSnapshot()
      const message = formatUndoMessage(result)
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
    'set_chore_schedule',
    {
      title: 'Set Chore Schedule',
      description: 'Update the cadence or days of week for a repeated chore.',
      inputSchema: z.object({
        chore_id: z.string().min(1),
        cadence: z.enum(['daily', 'weekly']).default('daily'),
        days_of_week: daysOfWeekSchema,
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({
      chore_id,
      cadence,
      days_of_week,
    }: {
      chore_id: string
      cadence: 'daily' | 'weekly'
      days_of_week?: number[]
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      formData.append('cadence', cadence)
      ;(days_of_week ?? []).forEach((day) =>
        formData.append('daysOfWeek', day.toString()),
      )
      await setChoreSchedule(formData)
      const snapshot = await loadChoreSnapshot()
      const chore = snapshot.chores.find((entry) => entry.id === chore_id)
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
      description: 'Pause or resume a single chore.',
      inputSchema: z.object({
        chore_id: z.string().min(1),
        paused_until: z
          .union([isoDaySchema, z.literal('')])
          .describe(
            'Set a date to pause until (inclusive) or send an empty string to resume',
          ),
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({
      chore_id,
      paused_until,
    }: {
      chore_id: string
      paused_until: string
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      formData.append('pausedUntil', paused_until)
      await setPause(formData)
      const snapshot = await loadChoreSnapshot()
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
      description: 'Pause or resume every chore at once.',
      inputSchema: z.object({
        paused_until: z
          .union([isoDaySchema, z.literal('')])
          .describe(
            'Set a date to pause all chores or send an empty string to resume',
          ),
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({ paused_until }: { paused_until: string }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('pausedUntil', paused_until)
      await pauseAllChores(formData)
      const snapshot = await loadChoreSnapshot()
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
        'Update which kids a chore applies to, whether it needs approval, and its time of day.',
      inputSchema: z.object({
        chore_id: z.string().min(1),
        kid_ids: kidIdsSchema,
        time_of_day: timeOfDaySchema,
        clear_time_of_day: z.boolean().optional(),
        requires_approval: z.boolean().optional(),
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({
      chore_id,
      kid_ids,
      time_of_day,
      clear_time_of_day,
      requires_approval,
    }: {
      chore_id: string
      kid_ids: string[]
      time_of_day?: 'morning' | 'afternoon' | 'evening'
      clear_time_of_day?: boolean
      requires_approval?: boolean
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
      const snapshot = await loadChoreSnapshot()
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
      description: 'Set the scheduled day for a one-off chore.',
      inputSchema: z.object({
        chore_id: z.string().min(1),
        scheduled_for: isoDaySchema,
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({
      chore_id,
      scheduled_for,
    }: {
      chore_id: string
      scheduled_for: string
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      formData.append('scheduledFor', scheduled_for)
      await setOneOffDate(formData)
      const snapshot = await loadChoreSnapshot()
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
      description: 'Archive a chore so it disappears from the board.',
      inputSchema: z.object({
        chore_id: z.string().min(1),
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({ chore_id }: { chore_id: string }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      await archiveChore(formData)
      const snapshot = await loadChoreSnapshot()
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
        'Rename a kid column and optionally update its accent color.',
      inputSchema: z.object({
        kid_id: z.string().min(1),
        name: z.string().min(1),
        color: hexColorSchema.optional(),
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({
      kid_id,
      name,
      color,
    }: {
      kid_id: string
      name: string
      color?: string
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('kidId', kid_id)
      formData.append('name', name)
      if (color) formData.append('color', color)
      await renameKid(formData)
      const snapshot = await loadChoreSnapshot()
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
      description: 'Manually add or remove stars from a kid balance.',
      inputSchema: z.object({
        kid_id: z.string().min(1),
        delta: z.number().int().min(1),
        mode: z.enum(['add', 'remove']).default('add'),
      }),
      outputSchema: messageWithSnapshotSchema,
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
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('kidId', kid_id)
      formData.append('delta', delta.toString())
      formData.append('mode', mode)
      await adjustKidStars(formData)
      const snapshot = await loadChoreSnapshot()
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
      description: 'Create a reward that kids can redeem with their stars.',
      inputSchema: z.object({
        title: z.string().min(1),
        emoji: z.string().optional(),
        cost: z.number().int().min(0).default(1),
        reward_type: z.enum(['one-off', 'perpetual']).default('perpetual'),
        kid_ids: kidIdsSchema,
      }),
      outputSchema: messageWithSnapshotSchema,
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
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('title', title)
      if (emoji) formData.append('emoji', emoji)
      formData.append('cost', cost.toString())
      formData.append('rewardType', reward_type)
      kid_ids.forEach((kidId) => formData.append('kidIds', kidId))
      await addReward(formData)
      const snapshot = await loadChoreSnapshot()
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
      description: 'Assign which kids can see a reward.',
      inputSchema: z.object({
        reward_id: z.string().min(1),
        kid_ids: kidIdsSchema,
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({
      reward_id,
      kid_ids,
    }: {
      reward_id: string
      kid_ids: string[]
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('rewardId', reward_id)
      kid_ids.forEach((kidId) => formData.append('kidIds', kidId))
      await setRewardKids(formData)
      const snapshot = await loadChoreSnapshot()
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
      description: 'Archive or remove a reward.',
      inputSchema: z.object({
        reward_id: z.string().min(1),
      }),
      outputSchema: messageWithSnapshotSchema,
    },
    async ({ reward_id }: { reward_id: string }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('rewardId', reward_id)
      await archiveReward(formData)
      const snapshot = await loadChoreSnapshot()
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
      description: 'Redeem a reward for a kid if they have enough stars.',
      inputSchema: z.object({
        reward_id: z.string().min(1),
        kid_id: z.string().min(1),
      }),
      outputSchema: redeemResultSchema,
    },
    async ({ reward_id, kid_id }: { reward_id: string; kid_id: string }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('rewardId', reward_id)
      formData.append('kidId', kid_id)
      const result = await redeemReward(formData)
      const snapshot = await loadChoreSnapshot()
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
