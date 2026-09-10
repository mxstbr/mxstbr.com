import { after } from 'next/server'
import { requireDevice, verifySameOrigin } from 'app/lib/chores2/auth'
import { requestSchema } from 'app/lib/chores2/commands'
import { choresService, developmentFixture } from 'app/lib/chores2/runtime'
import { fail } from 'app/lib/chores2/types'
import { drainNotifications } from 'app/lib/chores2/notifications'
import { errorResponse, json } from '../http'

export async function POST(request: Request) {
  try {
    verifySameOrigin(request)
    const actor = await requireDevice()
    const payload = requestSchema.safeParse(await request.json())
    if (!payload.success)
      fail(
        'INVALID_INPUT',
        'This action could not be understood. Refresh and try again.',
      )
    const result = await choresService().execute(
      actor,
      payload.data.requestId,
      payload.data.command,
    )
    if (!developmentFixture()) after(() => drainNotifications())
    return json({ result, board: await choresService().getBoard(actor) })
  } catch (error) {
    return errorResponse(error)
  }
}
