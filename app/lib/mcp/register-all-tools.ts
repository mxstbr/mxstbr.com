import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { registerCalendarTools } from 'app/lib/calendar'
import { registerChoresTools } from 'app/lib/chores/mcp'
import { registerFinanceTools } from 'app/lib/finance'
import { registerTelegramTools } from 'app/lib/telegram'
import { registerPebbleTools } from 'app/lib/pebble/mcp'

export function registerAllTools(server: McpServer) {
  registerCalendarTools(server)
  registerTelegramTools(server)
  registerChoresTools(server)
  registerFinanceTools(server)
  registerPebbleTools(server)
}
