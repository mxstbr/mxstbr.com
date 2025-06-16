import { openai } from '@ai-sdk/openai'
import {
  streamText as ai_streamText,
  generateText as ai_generateText,
  tool,
} from 'ai'
import { Redis } from '@upstash/redis'
import { colors } from 'app/cal/data'
import { PRESETS } from '../cal/presets'
import { dedent } from './dedent'
import { calendarTools } from './calendar'
import { telegramTools } from './telegram'
import { z } from 'zod'
import { generateText as calGenerateText } from './cal-agent'

const redis = Redis.fromEnv()

export const SYSTEM_PROMPT = (today: Date) => dedent`
You are Email Agent, an AI that helps Maxie and Minnie make sure they don't miss important emails.
Respond in a concise, helpful, and unambiguous way.

<behavior>
• If the email is important (e.g. overdue bills, tax bills,…), ping Maxie and Minnie via Telegram direct message sending them the subject and from of the email.
• If the email contains any events, forward it to the calendar agent so that it can analyze the email and see if it needs to be added to their calendar.
• If the email is neither of those, do nothing.
</behavior>

<date>Today's date is ${today.toISOString().split('T')[0]}</date>

<PRESETS>
${JSON.stringify(
  PRESETS.map((p) => ({ ...p, color: colors[p.color] })),
  null,
  2,
)}
</PRESETS>`

export async function streamText(
  sessionId: string,
  params: Partial<Parameters<typeof ai_streamText>[0]>,
) {
  return ai_streamText({
    model: openai('gpt-4o'),
    system: SYSTEM_PROMPT(new Date()),
    tools: {
      calendar_agent: tool({
        description:
          "Routes the message to the Calendar Agent, which handles all calendar-related tasks including creating, updating, deleting, and listing events for Maxie and Minnie's shared quarterly calendar.",
        parameters: z.object({
          message: z
            .string()
            .describe('The original message to forward to the Calendar Agent'),
        }),
        execute: async ({ message }) => {
          const result = await calGenerateText({
            messages: [{ role: 'user', content: message }],
          })
          return { response: result.text }
        },
      }),
      ...telegramTools,
    },
    maxSteps: 10,
    onStepFinish: async (result) => {
      await redis.lpush(`logs:${sessionId}`, result)
    },
    ...params,
  })
}

export async function generateText(
  params: Partial<Parameters<typeof ai_generateText>[0]>,
) {
  const id = Date.now()
  return ai_generateText({
    model: openai('gpt-4o'),
    system: SYSTEM_PROMPT(new Date()),
    tools: {
      calendar_agent: tool({
        description:
          "Routes the message to the Calendar Agent, which handles all calendar-related tasks including creating, updating, deleting, and listing events for Maxie and Minnie's shared quarterly calendar.",
        parameters: z.object({
          message: z
            .string()
            .describe('The original message to forward to the Calendar Agent'),
        }),
        execute: async ({ message }) => {
          const result = await calGenerateText({
            messages: [{ role: 'user', content: message }],
          })
          return { response: result.text }
        },
      }),
      ...telegramTools,
    },
    maxSteps: 10,
    onStepFinish: async (result) => {
      await redis.lpush(`logs:${id}`, result)
    },
    ...params,
  })
}
