import { Telegraf } from 'telegraf'
import z from 'zod/v3'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

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
      inputSchema: z.object({ message: z.string() }),
      outputSchema: telegramResponseSchema,
    },
    async ({ message }) => {
      try {
        await bot.telegram.sendMessage('-4904434425', message)
        return {
          content: [],
          structuredContent: { message: `Message sent: ${message}` },
        }
      } catch (error) {
        console.error(error)
        return {
          content: [],
          structuredContent: { message: `Error sending message: ${error}` },
          isError: true,
        }
      }
    },
  )
}
