import { clippyAgent } from '../../lib/clippy-agent'
import { isMax } from 'app/auth'
import { convertToModelMessages } from 'ai'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  if (!(await isMax())) throw new Error('Unauthorized')
  const { messages } = await req.json()

  const sessionId = req.headers.get('x-session-id')

  if (!sessionId) throw new Error('Missing session id.')

  // Convert UIMessages from frontend to ModelMessages for AI SDK
  const modelMessages = await convertToModelMessages(messages)

  const result = await clippyAgent.stream({
    messages: modelMessages,
    options: { request: req },
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages, // Pass original messages to prevent duplicates
  })
}
