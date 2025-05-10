import { callCalendarAssistant } from '../../lib/cal-agent'
import { isMax } from 'app/auth'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  if (!isMax()) throw new Error('Unauthorized')
  const { messages } = await req.json()

  const result = await callCalendarAssistant(messages)
  
  return result.toDataStreamResponse()
}
