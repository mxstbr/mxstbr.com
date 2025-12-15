import { openai } from '@ai-sdk/openai'
import {
  experimental_createMCPClient as createMCPClient,
  stepCountIs,
  Experimental_Agent as Agent,
} from 'ai'
import { Redis } from '@upstash/redis'
import { headers } from 'next/headers'
import { colors } from 'app/(os)/cal/data'
import { PRESETS } from 'app/(os)/cal/presets'
import { dedent } from './dedent'
import { siteUrl } from './site-url'

function resolveDeploymentUrl() {
  const envUrl =
    process.env.SITE_URL ??
    process.env.VERCEL_URL ??
    process.env.VERCEL_BRANCH_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL

  if (envUrl) return envUrl.startsWith('http') ? envUrl : `https://${envUrl}`

  try {
    const hostHeader = headers().get('host') ?? undefined
    if (hostHeader) return `https://${hostHeader}`
  } catch (error) {
    console.warn('Unable to read request headers for MCP origin resolution', error)
  }

  const fallback = siteUrl()

  if (process.env.NODE_ENV === 'production') {
    console.warn(
      'Falling back to localhost MCP transport URL; set SITE_URL/VERCEL_URL to the deployment origin.',
    )
  }

  return fallback
}

const redis = Redis.fromEnv()
const CONVERSATION_INDEX_KEY = 'clippy:conversations'

function parseTimestamp(value: unknown) {
  if (typeof value === 'number') {
    return value > 1_000_000_000_000 ? value : value * 1000
  }

  if (typeof value === 'string') {
    const numericValue = Number(value)

    if (Number.isFinite(numericValue)) {
      return numericValue > 1_000_000_000_000
        ? numericValue
        : numericValue * 1000
    }

    const parsedDate = Date.parse(value)
    if (!Number.isNaN(parsedDate)) {
      return parsedDate
    }
  }

  return undefined
}

function extractSessionId(stepResult: any) {
  const headers = stepResult?.request?.headers
  if (!headers || typeof headers !== 'object') return undefined

  const rawValue =
    headers['x-session-id'] ??
    headers['X-Session-Id'] ??
    headers['X-SESSION-ID'] ??
    headers['x-Session-Id']

  if (!rawValue) return undefined
  if (Array.isArray(rawValue)) return rawValue[0]
  if (typeof rawValue === 'string') return rawValue
  return String(rawValue)
}

function extractRequestMessages(stepResult: any) {
  const body = stepResult?.request?.body
  if (!body) return undefined

  try {
    const parsedBody = typeof body === 'string' ? JSON.parse(body) : body
    if (parsedBody?.messages && Array.isArray(parsedBody.messages)) {
      return parsedBody.messages
    }
  } catch (e) {}

  return undefined
}

function extractConversationMessages(stepResult: any) {
  if (
    stepResult?.response?.messages &&
    Array.isArray(stepResult.response.messages)
  ) {
    return stepResult.response.messages
  }

  return extractRequestMessages(stepResult)
}

async function persistConversationStep(stepResult: any) {
  const conversationId =
    stepResult?.response?.id ??
    stepResult?.response?.requestId ??
    stepResult?.request?.id ??
    `clippy-${Date.now()}`
  const timestamp =
    parseTimestamp(stepResult?.response?.timestamp) ?? Date.now()

  const baseKey = `clippy:conversation:${conversationId}`
  const metaKey = `${baseKey}:meta`
  const stepsKey = `${baseKey}:steps`
  const messagesKey = `${baseKey}:messages`

  const existingMeta = await redis.get(metaKey)
  const parsedMeta =
    typeof existingMeta === 'string'
      ? JSON.parse(existingMeta)
      : (existingMeta ?? {})

  const createdAt =
    (typeof parsedMeta?.createdAt === 'number' && parsedMeta.createdAt) ||
    timestamp
  const sessionId = parsedMeta?.sessionId ?? extractSessionId(stepResult)

  const meta = {
    id: conversationId,
    createdAt,
    updatedAt: timestamp,
    sessionId,
    modelId: stepResult?.response?.modelId,
    request: stepResult?.request,
  }

  const conversationMessages = extractConversationMessages(stepResult)

  await redis.zadd(CONVERSATION_INDEX_KEY, {
    score: createdAt,
    member: conversationId,
  })
  await redis.rpush(stepsKey, stepResult)
  await redis.set(metaKey, meta)

  if (conversationMessages && conversationMessages.length > 0) {
    await redis.set(messagesKey, conversationMessages)
  }
}

export const SYSTEM_PROMPT = (today: Date) => dedent`
You are the unified AI assistant named Clippy that helps Maxie and Minnie with calendar management.
Respond in a concise, helpful, and unambiguous way.

<context>
• You work for Maxie and Minnie. Maxie built you to help them with their life.
• Minnie is a nickname for Sue. Maxie is a nickname for Max. Minmax is both of them.
</context>

<calendar-management>
• Handle: create ▸ update ▸ delete ▸ list events.  
• Ask follow-up questions when data is missing or unclear.  
• Don't ask for confirmation. Just do the tool calls.
• Always finish your message with a single-sentence summary of the result.
• Never invent facts, colors, owners, or titles.

Event Guidelines:
• Never ask for times. You only need to know the date.
• Each event must follow EXACTLY one preset color as defined in <PRESETS>.  
• Event data is full-day unless specified otherwise. Full-day events should have a background and border. Shorter events should not have a background or border.
• If events go for consecutive days, create one event for the whole period with start and end dates. NOT multiple events.
• If the user specifies a week day, assume it's the next occurence of that week day.
• Never invent, merge, or modify preset colors.
• To delete events, you have to first read the events for that time and then pass the full data of the event to delete.

Defaults:
• If the user omits the owner, assume "minmax" and use its preset.
• If the user omits an event title but specifies a preset, don't include a title.

School Guidelines:
• Our kids go to Fiesta Gardens International School.
• We are not a part of the Parent Teacher Association (PTA), nor do we volunteer, nor are we a part of the school board.
• When emails arrive from school that contain dates, add them to the calendar only if they are required for us and they don't already exist in the calendar. (e.g., teacher appreciation weeks, spirit weeks, fall breaks,…)

Email Events:
• Every event you create from a forwarded email or a calendar invite must have ✉️ at the beginning of the title.
• Never add the ✉️ to manual user requests.
</calendar-management>

<chores-management>
• Handle: read ▸ add ▸ complete/undo ▸ pause/resume ▸ schedule ▸ assign kids ▸ archive chores ▸ manage rewards ▸ adjust kid stars.
• Always read the current board with the tools before changing chores so you have the real kid IDs and existing tasks.
• Ask follow-up questions when data is missing (kid, title, type, cadence/days, time of day, approval needs), but otherwise act without extra confirmation.
• Use Pacific dates in YYYY-MM-DD for pauses or schedules. Never invent kid IDs—map names to IDs from the board.
• Apply the parental pin flag when a chore requires approval and keep responses concise with a one-sentence summary of what changed.
</chores-management>

<date>Today's date is ${today.toISOString().split('T')[0]}</date>

<PRESETS>
${JSON.stringify(
  PRESETS.map((p) => ({ ...p, color: colors[p.color] })),
  null,
  2,
)}
</PRESETS>`

let clippyPromise: Promise<Agent<any, any, any>> | null = null

export async function getClippy() {
  if (clippyPromise) return clippyPromise

  clippyPromise = (async () => {
    const token =
      process.env.CLIPPY_AUTOMATION_TOKEN ?? process.env.CAL_PASSWORD

    const client = await createMCPClient({
      transport: {
        type: 'sse',
        url: new URL('/api/sse', resolveDeploymentUrl()).toString(),
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
      name: 'clippy-mcp-client',
      onUncaughtError: (error) => {
        console.error('Clippy MCP client error', error)
      },
    })

    const tools = await client.tools()

    return new Agent({
      model: openai('gpt-5-mini'),
      system: SYSTEM_PROMPT(new Date()),
      tools,
      onStepFinish: async (result) => {
        try {
          await persistConversationStep(result)
        } catch (error) {
          console.error('Failed to persist Clippy step log', error)
        }
      },
      stopWhen: stepCountIs(10),
    })
  })()

  return clippyPromise
}
