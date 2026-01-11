import { Redis } from '@upstash/redis'
import z from 'zod/v3'
import { colors, toDayString } from 'app/(os)/cal/data'
import type { Event } from 'app/(os)/cal/data'
import { revalidatePath } from 'next/cache'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { withToolErrorHandling } from 'app/lib/mcp/tool-errors'

const redis = Redis.fromEnv()

// Shared schema describing a calendar event
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .describe('Date formatted as YYYY-MM-DD')

const eventSchema = z
  .object({
    start: z.string().min(1, 'Start date is required'),
    end: z.string().min(1, 'End date is required'),
    color: z.string().min(1, 'Color is required'),
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

const eventResponseSchema = z.object({
  message: z.string(),
  event: eventSchema,
})

const eventsListSchema = z.object({
  events: z.array(eventSchema),
})

const deleteResponseSchema = z.object({
  message: z.literal('🗑️ Event deleted'),
})

const readEventsSchema = z
  .object({
    start_date: isoDateSchema
      .default('2024-01-01')
      .describe('Inclusive start date in YYYY-MM-DD format'),
    end_date: isoDateSchema
      .default('9999-12-31')
      .describe('Inclusive end date in YYYY-MM-DD format'),
  })
  .superRefine(({ start_date, end_date }, ctx) => {
    if (start_date > end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '`start_date` must be on or before `end_date`',
        path: ['start_date'],
      })
    }
  })

export function registerCalendarTools(server: McpServer) {
  server.registerTool(
    'create_event',
    {
      title: 'Create Event',
      description: 'Create a new calendar event',
      inputSchema: eventSchema,
      outputSchema: eventResponseSchema,
    },
    withToolErrorHandling(
      'create_event',
      async ({ start, end, color, label, border, background }) => {
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
        content: [],
        structuredContent: {
          message: `✅ Event "${label || 'untitled'}" created`,
          event: newEvent,
        },
      }
      },
    ),
  )

  server.registerTool(
    'read_events',
    {
      title: 'Read Events',
      description: 'Return all calendar events, optionally filtered by date range',
      inputSchema: readEventsSchema,
      outputSchema: eventsListSchema,
      annotations: { readOnlyHint: true },
    },
    withToolErrorHandling('read_events', async ({ start_date, end_date }) => {
      const events: Array<Event> | null = await redis.json.get(
        `cal:${process.env.CAL_PASSWORD}`,
      )

      if (!events) {
        return { content: [], structuredContent: { events: [] } }
      }

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

      return { content: [], structuredContent: { events: filteredEvents } }
    }),
  )

  server.registerTool(
    'update_event',
    {
      title: 'Update Event',
      description: 'Update an existing calendar event (provide oldEvent and newEvent)',
      inputSchema: z.object({
        oldEvent: eventSchema,
        newEvent: eventSchema,
      }),
      outputSchema: eventResponseSchema,
    },
    withToolErrorHandling('update_event', async ({ oldEvent, newEvent }) => {
      const events: Array<Event> | null = await redis.json.get(
        `cal:${process.env.CAL_PASSWORD}`,
      )

      if (!events) {
        throw new Error(
          'No events found. Ensure the calendar Redis key is populated before updating events.',
        )
      }

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

      if (idx === -1) {
        throw new Error(
          'Event not found. The `oldEvent` payload must exactly match an existing event (start, end, label, color, border, background, labelSize).',
        )
      }

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

      return {
        content: [],
        structuredContent: { message: '✏️ Event updated', event: updatedEvent },
      }
    }),
  )

  server.registerTool(
    'delete_event',
    {
      title: 'Delete Event',
      description: 'Delete a calendar event',
      inputSchema: z.object({ event: eventSchema }),
      outputSchema: deleteResponseSchema,
    },
    withToolErrorHandling('delete_event', async ({ event }) => {
      const events: Array<Event> | null = await redis.json.get(
        `cal:${process.env.CAL_PASSWORD}`,
      )

      if (!events) {
        throw new Error(
          'No events found. Ensure the calendar Redis key is populated before deleting events.',
        )
      }

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

      if (idx === -1) {
        throw new Error(
          'Event not found. The `event` payload must exactly match an existing event (start, end, label, color, border, background, labelSize).',
        )
      }

      events.splice(idx, 1)

      await redis.json.set(`cal:${process.env.CAL_PASSWORD}`, '$', events)
      revalidatePath('/cal')

      return { content: [], structuredContent: { message: '🗑️ Event deleted' } }
    }),
  )
}
