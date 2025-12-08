import { tool } from 'ai'
import { Redis } from '@upstash/redis'
import z from 'zod/v3'
import { colors, toDayString } from 'app/(os)/cal/data'
import type { Event } from 'app/(os)/cal/data'
import { revalidatePath } from 'next/cache'

const redis = Redis.fromEnv()

// Shared schema describing a calendar event
const eventSchema = z
  .object({
    start: z.string(),
    end: z.string(),
    color: z.string(),
    label: z.string().optional().nullable(),
    border: z.string().optional().nullable(),
    background: z.string().optional().nullable(),
    labelSize: z.literal('small').optional(),
  })
  .superRefine((val, ctx) => {
    const hasLabel = val.label != null
    const hasBorder = val.border != null
    const hasBackground = val.background != null
    if (!hasLabel && !hasBorder && !hasBackground) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one (or more) of `label`, `border`, or `background` is required',
        path: [
          !hasLabel ? 'label' : !hasBorder ? 'border' : 'background',
        ],
      })
    }
  })

// Define the calendar tools
export const calendarTools = {
  // ---------------------------------------------------------------------
  // CREATE --------------------------------------------------------------
  // ---------------------------------------------------------------------
  create_event: tool({
    description: 'Create a new calendar event',
    inputSchema: eventSchema,
    execute: async ({ start, end, color, label, border, background }) => {
      // Normalise to YYYY-MM-DD format
      const startDay = toDayString(start)
      const endDay = toDayString(end)

      const existing: Array<Event> | null = await redis.json.get(
        `cal:${process.env.CAL_PASSWORD}`,
      )

      const newEvent: Event = {
        start: startDay,
        end: endDay,
        color,
        label: label ?? undefined,
        border: border ?? undefined,
        background: (background ?? undefined) as any,
        labelSize: startDay === endDay ? 'small' : undefined,
      } as Event

      await redis.json.set(`cal:${process.env.CAL_PASSWORD}`, '$', [
        newEvent,
        ...(existing || []),
      ])
      revalidatePath('/cal')

      return {
        message: `✅ Event "${label || 'untitled'}" created`,
        event: newEvent,
      }
    },
  }),

  // ---------------------------------------------------------------------
  // READ ----------------------------------------------------------------
  // ---------------------------------------------------------------------
  read_events: tool({
    description:
      'Return all calendar events, optionally filtered by date range',
    inputSchema: z.object({
      start_date: z.string().optional().default('2024-01-01'),
      end_date: z.string().optional().default('9999-12-31'),
    }),
    execute: async ({ start_date, end_date }) => {
      const events: Array<Event> | null = await redis.json.get(
        `cal:${process.env.CAL_PASSWORD}`,
      )

      if (!events) return { events: [] }

      // Filter events that start OR end within the date range
      const filteredEvents = events.filter((event) => {
        const eventStart = event.start
        const eventEnd = event.end
        return (
          (eventStart >= start_date && eventStart <= end_date) || // Event starts in range
          (eventEnd >= start_date && eventEnd <= end_date) || // Event ends in range
          (eventStart <= start_date && eventEnd >= end_date) // Event spans the entire range
        )
      })

      return { events: filteredEvents }
    },
  }),

  // ---------------------------------------------------------------------
  // UPDATE --------------------------------------------------------------
  // ---------------------------------------------------------------------
  update_event: tool({
    description:
      'Update an existing calendar event (provide oldEvent and newEvent)',
    inputSchema: z.object({
      oldEvent: eventSchema,
      newEvent: eventSchema,
    }),
    execute: async ({ oldEvent, newEvent }) => {
      const events: Array<Event> | null = await redis.json.get(
        `cal:${process.env.CAL_PASSWORD}`,
      )

      if (!events) throw new Error('No events found')

      const idx = events.findIndex(
        (evt) =>
          evt.start === oldEvent.start &&
          evt.end === oldEvent.end &&
          evt.label === oldEvent.label &&
          evt.color === oldEvent.color &&
          evt.border === oldEvent.border &&
          evt.background === oldEvent.background &&
          evt.labelSize === oldEvent.labelSize,
      )

      if (idx === -1) throw new Error('Event not found')

      // Normalise dates and rebuild event
      const startDay = toDayString(newEvent.start)
      const endDay = toDayString(newEvent.end)

      const updatedEvent: Event = {
        ...(newEvent as any),
        start: startDay,
        end: endDay,
        labelSize: startDay === endDay ? 'small' : undefined,
      } as Event

      events[idx] = updatedEvent

      await redis.json.set(`cal:${process.env.CAL_PASSWORD}`, '$', events)
      revalidatePath('/cal')

      return { message: '✏️ Event updated', event: updatedEvent }
    },
  }),

  // ---------------------------------------------------------------------
  // DELETE --------------------------------------------------------------
  // ---------------------------------------------------------------------
  delete_event: tool({
    description: 'Delete a calendar event',
    inputSchema: z.object({ event: eventSchema }),
    execute: async ({ event }) => {
      const events: Array<Event> | null = await redis.json.get(
        `cal:${process.env.CAL_PASSWORD}`,
      )

      if (!events) throw new Error('No events found')

      const idx = events.findIndex(
        (evt) =>
          evt.start === event.start &&
          evt.end === event.end &&
          evt.label === event.label &&
          evt.color === event.color &&
          evt.border === event.border &&
          evt.background === event.background &&
          evt.labelSize === event.labelSize,
      )

      if (idx === -1) throw new Error('Event not found')

      events.splice(idx, 1)

      await redis.json.set(`cal:${process.env.CAL_PASSWORD}`, '$', events)
      revalidatePath('/cal')

      return { message: '🗑️ Event deleted' }
    },
  }),
}
