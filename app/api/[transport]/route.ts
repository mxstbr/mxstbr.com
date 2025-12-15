import { registerAllTools } from 'app/lib/mcp/register-all-tools'
import { createMcpHandler } from 'mcp-handler'
import { NextRequest, NextResponse } from 'next/server'

const redisUrl = (() => {
  const redisRestUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (redisRestUrl && redisRestToken) {
    const url = new URL(redisRestUrl)
    url.searchParams.set('_token', redisRestToken)
    return url.toString()
  }

  return process.env.REDIS_URL ?? process.env.KV_URL
})()

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
    redisUrl,
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
