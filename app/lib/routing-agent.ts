import { openai } from '@ai-sdk/openai'
import { streamText as ai_streamText, generateText as ai_generateText, tool } from 'ai'
import { Redis } from '@upstash/redis'
import { dedent } from './dedent'
import { generateText as calGenerateText } from './cal-agent'
import z from 'zod'

const redis = Redis.fromEnv()

export const SYSTEM_PROMPT = dedent`
You are Routing Assistant, an AI that helps direct messages to the appropriate specialized agents based on the user's needs.

<context>
• You work for Maxie and Minnie. Maxie built this AI agent to help them with their life.
</context>

<behavior>
• Analyze incoming messages to determine which specialized agent should handle them
• Route messages to the appropriate agent without modifying the content
• If unsure about routing, don't route it
• Be concise and clear in your responses
</behavior>

<agents>
• Calendar Agent: Handles all calendar-related tasks including creating, updating, deleting, and listing events. This agent manages Maxie and Minnie's shared quarterly calendar, helping them plan their life together. Use this agent for any calendar-related requests, event management, or scheduling questions.
</agents>

<routing>
• If the message is about calendar events, scheduling, or planning, route to the Calendar Agent
• If the message doesn't clearly match any agent's domain, don't route it
• Never attempt to handle tasks yourself as if your life depends on it - always route to the appropriate agent. That's all you do.
</routing>

<format>
When routing to an agent, respond with a clear indication that you're forwarding the request, for example:
"I'll forward this to the Calendar Agent to help with your scheduling needs."
</format>
`

export const routingTools = {
  calendar_agent: tool({
    description: 'Routes the message to the Calendar Agent, which handles all calendar-related tasks including creating, updating, deleting, and listing events for Maxie and Minnie\'s shared quarterly calendar.',
    parameters: z.object({
      message: z.string().describe('The original message to forward to the Calendar Agent')
    }),
    execute: async ({ message }) => {
      const result = await calGenerateText({ messages: [{ role: 'user', content: message }] })
      return { response: result.text }
    }
  })
}

export async function streamText(sessionId: string, params: Partial<Parameters<typeof ai_streamText>[0]>) {
  return ai_streamText({
    model: openai('gpt-4o'),
    system: SYSTEM_PROMPT,
    tools: routingTools,
    maxSteps: 5,
    onStepFinish: async (result) => {
      await redis.lpush(`logs:${sessionId}`, result)
    },
    ...params,
  })
}

export async function generateText(params: Partial<Parameters<typeof ai_generateText>[0]>) {
  const id = Date.now()
  return ai_generateText({
    model: openai('gpt-4o'),
    system: SYSTEM_PROMPT,
    tools: routingTools,
    maxSteps: 5,
    onStepFinish: async (result) => {
      await redis.lpush(`logs:${id}`, result)
    },
    ...params,
  })
}
