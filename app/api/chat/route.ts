import { openai } from '@ai-sdk/openai'
import { streamText, tool } from 'ai'
import z from 'zod'
import { Redis } from '@upstash/redis'
import { isMax } from 'app/auth'
import { colors, toDayString } from 'app/cal/data'
import type { Event } from 'app/cal/data'
import { PRESETS } from '../../cal/presets'
import { revalidatePath } from 'next/cache'

const redis = Redis.fromEnv()

const SYSTEM_PROMPT = String.raw`
You are Calendar Assistant, an AI that helps a single end-user create, edit, and review all day events on a quarterly calendar.  
Respond in a concise, helpful, and unambiguous way.

======================= GENERAL BEHAVIOR ======================
• Handle:  create ▸ update ▸ delete ▸ list events.  
• Ask follow-up questions when data is missing or unclear.  
• Don't ask for confirmation. Just do the tool calls.
• Never invent facts, colors, owners, or titles.

======================= EVENT BEHAVIOR ======================
• Event data is all full-day. Never ask for times. You only need to know the date.
• If events go for consecutive days, create one event for the whole period with start and end dates. NOT multiple events.
• If there is a one-day event that doesn't go the whole day (e.g., dinner or a concert), don't add a border or background.

======================= COLOR / STYLE POLICY ==================
• Each event must follow EXACTLY one preset defined in <PRESETS>.  
• Never invent, merge, or modify presets.  

======================= DEFAULT OWNER =========================
If the user omits the owner, assume "minmax" and use its preset.

======================= DEFAULT TITLE =========================
If the user omits an event title but specifies a preset, don't include a title.

======================= TODAY'S DATE ==========================
${new Date().toISOString().split('T')[0]}

======================= PRESET DEFINITIONS ====================
<PRESETS>
${JSON.stringify(
  PRESETS.map((p) => ({ ...p, color: colors[p.color] })),
  null,
  2,
)}
</PRESETS>`

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// Shared schema describing a calendar event
const eventSchema = z.object({
  start: z.string(),
  end: z.string(),
  color: z.string(),
  label: z.string().optional().nullable(),
  border: z.string().optional().nullable(),
  background: z.string().optional().nullable(),
  labelSize: z.literal('small').optional(),
})

export async function POST(req: Request) {
  if (!isMax()) throw new Error('Unauthorized')
  const { messages } = await req.json()

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    system: SYSTEM_PROMPT,
    tools: {
      // ---------------------------------------------------------------------
      // CREATE --------------------------------------------------------------
      // ---------------------------------------------------------------------
      create_event: tool({
        description: 'Create a new calendar event',
        parameters: eventSchema,
        execute: async ({ start, end, color, label, border, background }) => {
          if (!isMax()) throw new Error('Unauthorized')

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
        description: 'Return all calendar events',
        parameters: z.object({}),
        execute: async () => {
          if (!isMax()) throw new Error('Unauthorized')

          const events: Array<Event> | null = await redis.json.get(
            `cal:${process.env.CAL_PASSWORD}`,
          )

          return { events: events ?? [] }
        },
      }),

      // ---------------------------------------------------------------------
      // UPDATE --------------------------------------------------------------
      // ---------------------------------------------------------------------
      update_event: tool({
        description:
          'Update an existing calendar event (provide oldEvent and newEvent)',
        parameters: z.object({
          oldEvent: eventSchema,
          newEvent: eventSchema,
        }),
        execute: async ({ oldEvent, newEvent }) => {
          if (!isMax()) throw new Error('Unauthorized')

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
        parameters: z.object({ event: eventSchema }),
        execute: async ({ event }) => {
          if (!isMax()) throw new Error('Unauthorized')

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
    },
  })

  return result.toDataStreamResponse()
}
