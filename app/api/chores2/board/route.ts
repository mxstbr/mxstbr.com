import { requireDevice } from 'app/lib/chores2/auth'
import { choresService } from 'app/lib/chores2/runtime'
import { errorResponse, json } from '../http'

export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    return json(await choresService().getBoard(await requireDevice()))
  } catch (error) {
    return errorResponse(error)
  }
}
