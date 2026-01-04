import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { registerCalendarTools } from 'app/lib/calendar'
import { registerChoreTools } from 'app/lib/chores'
import { registerFinanceTools } from 'app/lib/finance'
import { registerAlexaReminderTools } from 'app/lib/alexa-reminders'
import { registerTelegramTools } from 'app/lib/telegram'

export function registerAllTools(server: McpServer) {
  registerCalendarTools(server)
  registerAlexaReminderTools(server)
  registerTelegramTools(server)
  registerChoreTools(server)
  registerFinanceTools(server)
}
