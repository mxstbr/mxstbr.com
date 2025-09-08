import { clippyStreamText } from '../../lib/clippy-agent'
import { isMax } from 'app/auth'
import { convertToModelMessages } from 'ai'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  if (!isMax()) throw new Error('Unauthorized')
  const { messages } = await req.json()

  const sessionId = req.headers.get('x-session-id')

  if (!sessionId) throw new Error('Missing session id.')

  // Convert UIMessages from frontend to ModelMessages for AI SDK
  const modelMessages = convertToModelMessages(messages)

  const result = await clippyStreamText(sessionId, { messages: modelMessages })

  return result.toUIMessageStreamResponse({
    originalMessages: messages, // Pass original messages to prevent duplicates
  })
}
