import { tool } from 'ai'
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
} from 'app/(os)/chores/utils'

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
    { chore: (typeof state.chores)[number]; completionId: string; timestamp: string }[]
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
    if (pacificDateFromTimestamp(completion.timestamp) !== ctx.todayIso) continue
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
    Object.entries(openChoresByKid).map(([kidId, chores]) => [kidId, sortByTimeOfDay(chores)]),
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

export const choreTools = {
  read_chore_board: tool({
    description: 'Read the current chore board including kids, chores, completions, and rewards.',
    inputSchema: z.object({
      day: isoDaySchema.optional().describe('Defaults to today in the Pacific timezone'),
    }),
    execute: async ({ day }) => {
      return loadChoreSnapshot(day)
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
          ;(days_of_week ?? []).forEach((day) => formData.append('daysOfWeek', day.toString()))
        }
      }
      if (time_of_day) formData.append('timeOfDay', time_of_day)
      if (requires_approval) formData.append('requiresApproval', 'true')

      await addChore(formData)
      return {
        message: `Chore "${title}" created`,
        snapshot: await loadChoreSnapshot(),
      }
    },
  }),

  complete_chore: tool({
    description: 'Mark a chore done for a kid and award their stars.',
    inputSchema: z.object({
      chore_id: z.string().min(1),
      kid_id: z.string().min(1),
    }),
    execute: async ({ chore_id, kid_id }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      formData.append('kidId', kid_id)
      const result = await completeChore(formData)

      return {
        ...result,
        snapshot: await loadChoreSnapshot(),
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
    execute: async ({ chore_id, kid_id, completion_id }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      formData.append('kidId', kid_id)
      if (completion_id) formData.append('completionId', completion_id)

      const result = await undoChore(formData)
      return {
        ...result,
        snapshot: await loadChoreSnapshot(),
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
    execute: async ({ chore_id, cadence, days_of_week }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      formData.append('cadence', cadence)
      ;(days_of_week ?? []).forEach((day) => formData.append('daysOfWeek', day.toString()))

      await setChoreSchedule(formData)
      const snapshot = await loadChoreSnapshot()
      const chore = snapshot.chores.find((entry) => entry.id === chore_id)

      return {
        message:
          chore?.type === 'repeated'
            ? `Schedule updated to ${cadence}${cadence === 'weekly' ? ` on days ${(
                days_of_week ?? []
              ).join(', ') || 'unspecified'}` : ''}`
            : 'Chore schedule unchanged because it is not repeated',
        snapshot,
      }
    },
  }),

  pause_chore: tool({
    description: 'Pause or resume a single chore.',
    inputSchema: z.object({
      chore_id: z.string().min(1),
      paused_until: z.union([isoDaySchema, z.literal('')]).describe(
        'Set a date to pause until (inclusive) or send an empty string to resume',
      ),
    }),
    execute: async ({ chore_id, paused_until }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      formData.append('pausedUntil', paused_until)
      await setPause(formData)

      return {
        message: paused_until ? `Chore paused until ${paused_until}` : 'Chore resumed',
        snapshot: await loadChoreSnapshot(),
      }
    },
  }),

  pause_all_chores: tool({
    description: 'Pause or resume every chore at once.',
    inputSchema: z.object({
      paused_until: z.union([isoDaySchema, z.literal('')]).describe(
        'Set a date to pause all chores or send an empty string to resume',
      ),
    }),
    execute: async ({ paused_until }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('pausedUntil', paused_until)
      await pauseAllChores(formData)

      return {
        message: paused_until ? `All chores paused until ${paused_until}` : 'All chores resumed',
        snapshot: await loadChoreSnapshot(),
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
        formData.append('requiresApproval', requires_approval ? 'true' : 'false')
      }

      await setChoreKids(formData)
      return {
        message: 'Chore assignments saved',
        snapshot: await loadChoreSnapshot(),
      }
    },
  }),

  set_one_off_date: tool({
    description: 'Set the scheduled day for a one-off chore.',
    inputSchema: z.object({
      chore_id: z.string().min(1),
      scheduled_for: isoDaySchema,
    }),
    execute: async ({ chore_id, scheduled_for }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      formData.append('scheduledFor', scheduled_for)

      await setOneOffDate(formData)
      return {
        message: `One-off scheduled for ${scheduled_for}`,
        snapshot: await loadChoreSnapshot(),
      }
    },
  }),

  archive_chore: tool({
    description: 'Archive a chore so it disappears from the board.',
    inputSchema: z.object({
      chore_id: z.string().min(1),
    }),
    execute: async ({ chore_id }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('choreId', chore_id)
      await archiveChore(formData)

      return {
        message: 'Chore archived',
        snapshot: await loadChoreSnapshot(),
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
    execute: async ({ kid_id, name, color }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('kidId', kid_id)
      formData.append('name', name)
      if (color) formData.append('color', color)

      await renameKid(formData)
      return {
        message: `Kid column saved as ${name}`,
        snapshot: await loadChoreSnapshot(),
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
    execute: async ({ kid_id, delta, mode }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('kidId', kid_id)
      formData.append('delta', delta.toString())
      formData.append('mode', mode)

      await adjustKidStars(formData)
      return {
        message: `Stars ${mode === 'remove' ? 'removed' : 'added'} (${delta})`,
        snapshot: await loadChoreSnapshot(),
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
    execute: async ({ title, emoji, cost, reward_type, kid_ids }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('title', title)
      if (emoji) formData.append('emoji', emoji)
      formData.append('cost', cost.toString())
      formData.append('rewardType', reward_type)
      kid_ids.forEach((kidId) => formData.append('kidIds', kidId))

      await addReward(formData)
      return {
        message: `Reward "${title}" created`,
        snapshot: await loadChoreSnapshot(),
      }
    },
  }),

  set_reward_kids: tool({
    description: 'Assign which kids can see a reward.',
    inputSchema: z.object({
      reward_id: z.string().min(1),
      kid_ids: kidIdsSchema,
    }),
    execute: async ({ reward_id, kid_ids }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('rewardId', reward_id)
      kid_ids.forEach((kidId) => formData.append('kidIds', kidId))

      await setRewardKids(formData)
      return {
        message: 'Reward audience updated',
        snapshot: await loadChoreSnapshot(),
      }
    },
  }),

  archive_reward: tool({
    description: 'Archive or remove a reward.',
    inputSchema: z.object({
      reward_id: z.string().min(1),
    }),
    execute: async ({ reward_id }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('rewardId', reward_id)
      await archiveReward(formData)

      return {
        message: 'Reward archived',
        snapshot: await loadChoreSnapshot(),
      }
    },
  }),

  redeem_reward: tool({
    description: 'Redeem a reward for a kid if they have enough stars.',
    inputSchema: z.object({
      reward_id: z.string().min(1),
      kid_id: z.string().min(1),
    }),
    execute: async ({ reward_id, kid_id }) => {
      const formData = new FormData()
      appendAutomationToken(formData)
      formData.append('rewardId', reward_id)
      formData.append('kidId', kid_id)

      const result = await redeemReward(formData)
      return {
        ...result,
        snapshot: await loadChoreSnapshot(),
      }
    },
  }),
}
