import { registerAllTools } from 'app/lib/mcp/register-all-tools'
import { createMcpHandler } from 'mcp-handler'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v4'

export const maxDuration = 60

const handler = createMcpHandler(
  (server) => {
    registerAllTools(server)
  },
  {},
  {
    basePath: '/api', // this needs to match where the [transport] is located.
    maxDuration: 60,
    verboseLogs: true,
    redisUrl: `${process.env.UPSTASH_REDIS_REST_URL}?token=${process.env.UPSTASH_REDIS_REST_TOKEN}`,
  },
)

const routeWithAuth = (req: NextRequest) => {
  const bearer =
    req.headers.get('authorization') ?? req.headers.get('Authorization')
  const bearerToken = bearer?.startsWith('Bearer ')
    ? bearer.slice(7)
    : undefined
  const pwd = new URL(req.url).searchParams.get('pwd')

  if (
    process.env.NODE_ENV !== 'development' &&
    !(
      pwd === process.env.CAL_PASSWORD ||
      bearerToken === process.env.CAL_PASSWORD ||
      bearerToken === process.env.CLIPPY_AUTOMATION_TOKEN
    )
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  return handler(req)
}

export { routeWithAuth as GET, routeWithAuth as POST }
