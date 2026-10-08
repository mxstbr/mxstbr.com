import { createMcpHandler } from 'mcp-handler'
import { after, NextRequest, NextResponse } from 'next/server'
import { withParentContext } from 'app/lib/chores/auth'
import { registerAllTools } from 'app/lib/mcp/register-all-tools'
import { registerPebbleTools } from 'app/lib/pebble/mcp'
import { resolveMcpAccess, withMcpAccess } from 'app/lib/mcp/access'
import { handleMcpProtocol, SERVER_INFO } from 'app/lib/mcp/protocol'
import { INSTRUCTIONS, invokeSdkTool } from 'app/lib/mcp/server'

export const runtime = 'nodejs'
export const maxDuration = 800

const legacyHandler = (family: boolean) =>
  createMcpHandler(
    family ? registerAllTools : registerPebbleTools,
    { serverInfo: SERVER_INFO, instructions: INSTRUCTIONS },
    {
      basePath: '/api',
      maxDuration: 60,
      verboseLogs: false,
      redisUrl: `${process.env.UPSTASH_REDIS_REST_URL}?token=${process.env.UPSTASH_REDIS_REST_TOKEN}`,
    },
  )
const familyHandler = legacyHandler(true)
const pebbleHandler = legacyHandler(false)

async function routeWithAuth(req: NextRequest) {
  const access = resolveMcpAccess(req)
  const origin = req.headers.get('origin')
  if (
    origin &&
    ![
      new URL(req.url).origin,
      'https://chatgpt.com',
      'https://chat.openai.com',
    ].includes(origin)
  )
    return new NextResponse('Forbidden origin', { status: 403 })
  return withMcpAccess(access, () =>
    withParentContext(Boolean(access?.family), async () => {
      const response = await handleMcpProtocol(req, {
        access,
        instructions: INSTRUCTIONS,
        tools: (method, params, signal) =>
          invokeSdkTool(Boolean(access?.family), method, params, signal),
        afterSubscribe: (manager) =>
          after(async () => {
            await manager.drain()
          }),
      })
      if (response) return response
      if (!access && process.env.NODE_ENV !== 'development')
        return new NextResponse('Unauthorized', { status: 401 })
      return (access && !access.family ? pebbleHandler : familyHandler)(req)
    }),
  )
}
export { routeWithAuth as GET, routeWithAuth as POST, routeWithAuth as DELETE }
