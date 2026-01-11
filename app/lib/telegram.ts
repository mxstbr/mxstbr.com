import { Telegraf } from 'telegraf'
import z from 'zod/v3'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { withToolErrorHandling } from 'app/lib/mcp/tool-errors'

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string)
// bot.telegram.setWebhook("https://mxstbr.com/api/telegram", {
//   secret_token: process.env.TELEGRAM_SECRET_TOKEN,
// })

const telegramResponseSchema = z.object({
  message: z.string(),
})

export function registerTelegramTools(server: McpServer) {
  server.registerTool(
    'send_message',
    {
      title: 'Send Message',
      description: 'Send a message to Maxie and Minnie via Telegram',
      inputSchema: z.object({
        message: z.string().min(1, 'Message cannot be empty'),
      }),
      outputSchema: telegramResponseSchema,
    },
    withToolErrorHandling('send_message', async ({ message }) => {
      await bot.telegram.sendMessage('-4904434425', message)
      return {
        content: [],
        structuredContent: { message: `Message sent: ${message}` },
      }
    }),
  )
}
