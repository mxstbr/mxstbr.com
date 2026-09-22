import { requireDevice } from 'app/lib/chores/auth'
import { choresService } from 'app/lib/chores/runtime'
import { errorResponse, json } from '../http'

export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try {
    return json(
      await choresService().kidSummary(
        await requireDevice(),
        new URL(request.url).searchParams.get('day') || '',
      ),
    )
  } catch (error) {
    return errorResponse(error)
  }
}
