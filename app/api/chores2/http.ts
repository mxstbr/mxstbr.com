import { ChoresError } from 'app/lib/chores2/types'

export function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
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
    'Chores2 request failed',
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
