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
import { getChoreState } from 'app/(os)/chores/data'
import {
  getToday,
  isOpenForKid,
  pacificDateFromTimestamp,
  sortByTimeOfDay,
  scheduleLabel,
} from 'app/(os)/chores/utils'
import { tool } from './tool'

const isoDaySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe('Pacific date in YYYY-MM-DD format')

const automationToken =
  process.env.CLIPPY_AUTOMATION_TOKEN ?? process.env.CAL_PASSWORD

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

function siteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
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

export const choreTools = {
  read_chore_board: tool({
    description:
      'Read the current chore board including kids, chores, completions, and rewards.',
    inputSchema: z.object({
      day: isoDaySchema
        .optional()
        .describe('Defaults to today in the Pacific timezone'),
    }),
    execute: async ({ day }: { day?: string }) => {
      const snapshot = await loadChoreSnapshot(day)
      return {
        content: [
          {
            type: 'text' as const,
            text: `Loaded chore board for ${snapshot?.ctx?.todayIso ?? 'today'}`,
          },
        ],
        structuredContent: toStructuredContent(snapshot),
        _meta: toChoresTodayMetadata(snapshot),
      }
    },
    _meta: {
      'openai/outputTemplate': outputTemplateUrl('/chores/today'),
      'openai/widgetAccessible': true,
    },
  }),

  create_chore: tool({
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
    execute: async ({
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
  }),

  complete_chore: tool({
    description: 'Mark a chore done for a kid and award their stars.',
    inputSchema: z.object({
      chore_id: z.string().min(1),
      kid_id: z.string().min(1),
    }),
    execute: async ({
      chore_id,
      kid_id,
    }: {
      chore_id: string
      kid_id: string
    }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      formData.append('kidId', kid_id)
      const result = await completeChore(formData)
      const snapshot = await loadChoreSnapshot()

      return {
        content: [
          {
            type: 'text' as const,
            text: formatCompletionMessage(result),
          },
        ],
        structuredContent: toStructuredContent({ ...result, snapshot }),
      }
    },
  }),

  undo_chore_completion: tool({
    description: 'Undo a chore completion for a kid.',
    inputSchema: z.object({
      chore_id: z.string().min(1),
      kid_id: z.string().min(1),
      completion_id: z.string().optional(),
    }),
    execute: async ({
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
      return {
        content: [
          {
            type: 'text' as const,
            text: formatUndoMessage(result),
          },
        ],
        structuredContent: toStructuredContent({ ...result, snapshot }),
      }
    },
  }),

  set_chore_schedule: tool({
    description: 'Update the cadence or days of week for a repeated chore.',
    inputSchema: z.object({
      chore_id: z.string().min(1),
      cadence: z.enum(['daily', 'weekly']).default('daily'),
      days_of_week: daysOfWeekSchema,
    }),
    execute: async ({
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
  }),

  pause_chore: tool({
    description: 'Pause or resume a single chore.',
    inputSchema: z.object({
      chore_id: z.string().min(1),
      paused_until: z
        .union([isoDaySchema, z.literal('')])
        .describe(
          'Set a date to pause until (inclusive) or send an empty string to resume',
        ),
    }),
    execute: async ({
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
  }),

  pause_all_chores: tool({
    description: 'Pause or resume every chore at once.',
    inputSchema: z.object({
      paused_until: z
        .union([isoDaySchema, z.literal('')])
        .describe(
          'Set a date to pause all chores or send an empty string to resume',
        ),
    }),
    execute: async ({ paused_until }: { paused_until: string }) => {
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
  }),

  set_chore_assignments: tool({
    description:
      'Update which kids a chore applies to, whether it needs approval, and its time of day.',
    inputSchema: z.object({
      chore_id: z.string().min(1),
      kid_ids: kidIdsSchema,
      time_of_day: timeOfDaySchema,
      clear_time_of_day: z.boolean().optional(),
      requires_approval: z.boolean().optional(),
    }),
    execute: async ({
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
  }),

  set_one_off_date: tool({
    description: 'Set the scheduled day for a one-off chore.',
    inputSchema: z.object({
      chore_id: z.string().min(1),
      scheduled_for: isoDaySchema,
    }),
    execute: async ({
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
  }),

  archive_chore: tool({
    description: 'Archive a chore so it disappears from the board.',
    inputSchema: z.object({
      chore_id: z.string().min(1),
    }),
    execute: async ({ chore_id }: { chore_id: string }) => {
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
  }),

  rename_kid: tool({
    description: 'Rename a kid column and optionally update its accent color.',
    inputSchema: z.object({
      kid_id: z.string().min(1),
      name: z.string().min(1),
      color: hexColorSchema.optional(),
    }),
    execute: async ({
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
  }),

  adjust_kid_stars: tool({
    description: 'Manually add or remove stars from a kid balance.',
    inputSchema: z.object({
      kid_id: z.string().min(1),
      delta: z.number().int().min(1),
      mode: z.enum(['add', 'remove']).default('add'),
    }),
    execute: async ({
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
  }),

  add_reward: tool({
    description: 'Create a reward that kids can redeem with their stars.',
    inputSchema: z.object({
      title: z.string().min(1),
      emoji: z.string().optional(),
      cost: z.number().int().min(0).default(1),
      reward_type: z.enum(['one-off', 'perpetual']).default('perpetual'),
      kid_ids: kidIdsSchema,
    }),
    execute: async ({
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
  }),

  set_reward_kids: tool({
    description: 'Assign which kids can see a reward.',
    inputSchema: z.object({
      reward_id: z.string().min(1),
      kid_ids: kidIdsSchema,
    }),
    execute: async ({
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
  }),

  archive_reward: tool({
    description: 'Archive or remove a reward.',
    inputSchema: z.object({
      reward_id: z.string().min(1),
    }),
    execute: async ({ reward_id }: { reward_id: string }) => {
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
  }),

  redeem_reward: tool({
    description: 'Redeem a reward for a kid if they have enough stars.',
    inputSchema: z.object({
      reward_id: z.string().min(1),
      kid_id: z.string().min(1),
    }),
    execute: async ({
      reward_id,
      kid_id,
    }: {
      reward_id: string
      kid_id: string
    }) => {
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
        structuredContent: toStructuredContent({ ...result, snapshot }),
      }
    },
  }),
}
