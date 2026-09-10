import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { registerCalendarTools } from 'app/lib/calendar'
import { registerChoreTools } from 'app/lib/chores'
import { registerChores2Tools } from 'app/lib/chores2/mcp'
import { registerFinanceTools } from 'app/lib/finance'
import { registerTelegramTools } from 'app/lib/telegram'

export function registerAllTools(server: McpServer) {
  registerCalendarTools(server)
  registerTelegramTools(server)
  registerChoreTools(server)
  registerChores2Tools(server)
  registerFinanceTools(server)
}
