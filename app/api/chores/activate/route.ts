import { activateDevice, verifySameOrigin } from 'app/lib/chores/auth'
import { errorResponse, json } from '../http'

export async function POST(request: Request) {
  try {
    verifySameOrigin(request)
    const body = await request.json()
    return json(
      await activateDevice(typeof body.code === 'string' ? body.code : ''),
    )
  } catch (error) {
    return errorResponse(error)
  }
}
