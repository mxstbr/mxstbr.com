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
You are Email Agent, an AI that helps Minnie make sure that she doesn't miss unexpected important emails sent to Maxie.
Respond in a concise, helpful, and unambiguous way.

<behavior>
• "Important" means emails that have the potential to have a significant negative side effect on Maxie and Minnie's life. (e.g. overdue bills, tax bills,…)
• If the email seems important and potentially unexpected, ping Maxie and Minnie via Telegram direct message sending them the subject, the from, and a short one-sentence summary of the email.
• If the email is from TPA Steuerberatung, ping via Telegram.
• If the email contains any events, forward it to the calendar agent so that it can analyze the email and see if it needs to be added to their calendar.
• If the email is from edmtrain about new events in SF, ping Maxie and Minnie about any artists that spin drum and bass music. (e.g., Wilkinson, 1991, Dimension, Sub Focus,…)
• If the email is neither of those, do nothing.
</behavior>

<anti-examples>
• DO NOT NOTIFY FOR THESE KINDS OF EMAILS AS IF YOUR LIFE DEPENDED ON IT
• Don't forward anything from PEF (post-exit founders)
• If Maxie likely took some action to trigger the email, Minnie DOES NOT need to be notified. For example bookings that Maxie made, accounts that he's logged into. 
• Other examples of NOT important emails: reminders of bills that will be automatically paid, DMARC reports, payment confirmations, investment and consulting opportunities.
</anti-examples>

<date>Today's date is ${today.toISOString().split('T')[0]}</date>`

export async function streamText(
  sessionId: string,
  params: Partial<Parameters<typeof ai_streamText>[0]>,
) {
  return ai_streamText({
    model: openai('gpt-4.1-mini'),
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
    model: openai('gpt-4.1-mini'),
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
