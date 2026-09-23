import { Receiver } from '@upstash/qstash'
import { automationAuthorized } from 'app/lib/chores/auth'
import { drainAllNotifications } from 'app/lib/chores/notifications'
import { errorResponse, json } from '../http'

export const maxDuration = 60
export async function POST(request: Request) {
  try {
    let allowed = automationAuthorized(request)
    if (
      !allowed &&
      process.env.QSTASH_CURRENT_SIGNING_KEY &&
      process.env.QSTASH_NEXT_SIGNING_KEY
    ) {
      try {
        allowed = await new Receiver({
          currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
          nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
        }).verify({
          signature: request.headers.get('upstash-signature') || '',
          body: await request.text(),
          url: request.url,
        })
      } catch {
        allowed = false
      }
    }
    if (!allowed)
      return json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'A signed delivery request is required.',
          },
        },
        401,
      )
    return json(await drainAllNotifications())
  } catch (error) {
    return errorResponse(error)
  }
}
