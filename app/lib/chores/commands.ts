import z from 'zod/v3'
import { validDay } from './time'

export const daySchema = z
  .string()
  .refine(validDay, 'Use a real Pacific date (YYYY-MM-DD).')
const id = z.string().min(1).max(200)
const occurrence = z
  .string()
  .min(12)
  .max(400)
  .refine(
    (value) => validDay(value.slice(0, 10)),
    'Use an occurrence/submission ID returned by this board.',
  )
const kids = z.array(id).min(1).max(20)
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/)
const schedule = z
  .object({
    cadence: z.enum(['daily', 'weekly']),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.cadence === 'weekly' && !value.daysOfWeek?.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['daysOfWeek'],
        message: 'Weekly cadence requires at least one weekday.',
      })
  })
const choreFields = {
  title: z.string().trim().min(1).max(200),
  emoji: z.string().trim().min(1).max(24),
  stars: z.number().int().min(0).max(10000),
  kidIds: kids,
  type: z.enum(['one-off', 'repeated', 'perpetual']),
  timeOfDay: z
    .enum(['morning', 'afternoon', 'evening', 'night'])
    .nullable()
    .optional(),
  requiresApproval: z.boolean().optional(),
  scheduledFor: daySchema.optional(),
  archivedFrom: daySchema.nullable().optional(),
  schedule: schedule.optional(),
  pausedUntil: daySchema.nullable().optional(),
  snoozedUntil: daySchema.nullable().optional(),
  snoozedForKids: z.record(daySchema.nullable()).optional(),
}
const rewardFields = {
  title: z.string().trim().min(1).max(200),
  emoji: z.string().trim().min(1).max(24),
  cost: z.number().int().min(0).max(100000),
  kidIds: kids,
  type: z.enum(['one-off', 'perpetual']),
  archived: z.boolean().optional(),
}
export const commandSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('submit'), occurrenceId: occurrence }).strict(),
  z
    .object({
      action: z.literal('review'),
      submissionId: occurrence,
      decision: z.enum(['approve', 'reject']),
    })
    .strict(),
  z.object({ action: z.literal('undo'), submissionId: occurrence }).strict(),
  z
    .object({
      action: z.literal('redeem'),
      kidId: id,
      rewardId: id,
      expectedCost: z.number().int().min(0).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal('adjust_stars'),
      kidId: id,
      delta: z
        .number()
        .int()
        .min(-100000)
        .max(100000)
        .refine((n) => n !== 0),
      note: z.string().trim().min(1).max(500),
    })
    .strict(),
  z
    .object({
      action: z.literal('create_chore'),
      chore: z.object(choreFields).strict(),
    })
    .strict(),
  z
    .object({
      action: z.literal('update_chore'),
      choreId: id,
      patch: z.object(choreFields).partial().strict(),
    })
    .strict(),
  z
    .object({
      action: z.literal('archive_chore'),
      choreId: id,
      from: daySchema.optional(),
    })
    .strict(),
  z
    .object({ action: z.literal('pause_all'), until: daySchema.nullable() })
    .strict(),
  z
    .object({
      action: z.literal('create_reward'),
      reward: z.object(rewardFields).strict(),
    })
    .strict(),
  z
    .object({
      action: z.literal('update_reward'),
      rewardId: id,
      patch: z.object(rewardFields).partial().strict(),
    })
    .strict(),
  z.object({ action: z.literal('archive_reward'), rewardId: id }).strict(),
  z
    .object({
      action: z.literal('update_kid'),
      kidId: id,
      name: z.string().trim().min(1).max(40).optional(),
      color: color.optional(),
    })
    .strict(),
  z.object({ action: z.literal('set_color'), kidId: id, color }).strict(),
  z
    .object({
      action: z.literal('set_order'),
      kidId: id,
      group: z.enum(['morning', 'afternoon', 'evening', 'night', 'bonus']),
      choreIds: z.array(id).max(200),
    })
    .strict(),
  z
    .object({
      action: z.literal('packing'),
      kidId: id.optional(),
      itemId: id.optional(),
      checked: z.boolean(),
    })
    .strict(),
  z
    .object({
      action: z.literal('import_packing'),
      packed: z.record(z.record(z.boolean())),
    })
    .strict(),
])
export type Command = z.infer<typeof commandSchema>
export const requestSchema = z
  .object({ requestId: z.string().min(8).max(100), command: commandSchema })
  .strict()
