import { registerAllTools } from 'app/lib/mcp/register-all-tools'
import { createMcpHandler } from 'mcp-handler'
import { NextRequest, NextResponse } from 'next/server'
import { withParentContext } from 'app/lib/chores/auth'

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
- Manage /chores with chores_catalog, chores_inspect_day, chores_pending_approvals, chores_command, chores_device and chores_notification_status. There is only one chores implementation; the old board and legacy tools have been removed. These tools require this authenticated MCP connection; browser cookies grant kid actions only.
- Resolve exact IDs with catalog/day/approvals before changing anything. Use a unique requestId per logical command and reuse it after an uncertain response. Inspect the affected day afterward.
- submit only accepts current eligible occurrences. review can approve an on-time submission later; undo targets the exact submission. Never subtract stars manually as well as undoing the same completion.
- Dates are Pacific YYYY-MM-DD. snoozedUntil, snoozedForKids and pause_all.until are exclusive reappear dates; pausedUntil is inclusive. Merge per-child snoozes before replacing the map. Hidden chores are not required, even after opening. Only nonempty completed periods earn +2; no +10 daily bonus.
- Preserve saved routine order with set_order. Preserve history and balances; do not import or synchronize retired data. Parents use ChatGPT and MCP; Telegram delivers notifications only. No skips, past completions, parent UI or bedtime-recognition workflow.`,
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

  return withParentContext(isAuthorized, () => handler(req))
}

export { routeWithAuth as GET, routeWithAuth as POST }
