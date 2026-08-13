import { registerAllTools } from 'app/lib/mcp/register-all-tools'
import { createMcpHandler } from 'mcp-handler'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 800

const handler = createMcpHandler(
  (server) => {
    registerAllTools(server)
  },
  {
    serverInfo: {
      name: 'mxstbr-mcp',
      version: '1.0.0',
    },
    instructions: `This MCP server powers Maxie and Minnie workflows.

Chores workflow:
- Use get_chore_board for the UI-shaped state of a Pacific day (today by default). It returns each kid's current star balance, open chores, completed chores, and daily progress.
- Use search_chores and search_rewards for the durable catalogs, including definitions that may not appear on today's board. Use list_kids for the small canonical kid roster.
- Resolve canonical IDs with those read tools before mutating. Never invent an existing kid, chore, reward, or completion ID.
- Use create_chore/update_chore/archive_chore for chore definitions. update_chore also handles assignments, recurrence, one-off dates, time of day, approval, and a single repeated chore's pause.
- complete_chore and undo_chore_completion operate on today's Pacific date. Use completion IDs from get_chore_board when selecting a specific completion to undo.
- pause_all_chores uses an inclusive paused_until date; pass an empty string to resume all chores.
- Use create_reward/update_reward/archive_reward/redeem_reward for rewards, update_kid for kid metadata, and adjust_kid_stars for manual ledger adjustments.
- Mutations return the affected entity and required machine-readable status fields, but not a board snapshot. Call get_chore_board or a search tool afterward only when refreshed read state is needed.
- Business-rule failures return isError=true with structured status=error, a stable code, and a message. Treat structuredContent as authoritative; text content is only a concise summary.
- All date inputs are Pacific dates in YYYY-MM-DD format.`,
  },
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
  const calendarPassword = process.env.CAL_PASSWORD
  const automationToken = process.env.CLIPPY_AUTOMATION_TOKEN
  const isAuthorized =
    (!!calendarPassword &&
      (pwd === calendarPassword || bearerToken === calendarPassword)) ||
    (!!automationToken && bearerToken === automationToken)

  if (process.env.NODE_ENV !== 'development' && !isAuthorized) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  return handler(req)
}

export { routeWithAuth as GET, routeWithAuth as POST }
