import { unlockWithSitePassword, verifySameOrigin } from 'app/lib/chores2/auth'
import { errorResponse, json } from '../http'

export async function POST(request: Request) {
  try {
    verifySameOrigin(request)
    const body = await request.json()
    return json(
      await unlockWithSitePassword(
        typeof body.password === 'string' ? body.password : '',
      ),
    )
  } catch (error) {
    return errorResponse(error)
  }
}
