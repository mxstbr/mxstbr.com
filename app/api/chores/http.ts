import { ChoresError } from 'app/lib/chores/types'
import { choresAppVersion } from 'app/lib/chores/app-version'

export function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      Vary: 'Cookie',
      'X-Chores-Version': choresAppVersion(),
    },
  })
}
export function errorResponse(error: unknown) {
  if (error instanceof ChoresError)
    return json(
      { error: { code: error.code, message: error.message } },
      error.code === 'UNAUTHORIZED'
        ? 401
        : error.code === 'FORBIDDEN'
          ? 403
          : error.code === 'BUSY'
            ? 409
            : 400,
    )
  console.error(
    'Chores request failed',
    error instanceof Error ? error.name : 'Unknown error',
  )
  return json(
    {
      error: {
        code: 'UNAVAILABLE',
        message: 'Could not save that yet. Please retry the same action.',
      },
    },
    503,
  )
}
