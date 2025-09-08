import { tool } from 'ai'
import { Telegraf } from 'telegraf'
import z from 'zod'

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string)
// bot.telegram.setWebhook("https://mxstbr.com/api/telegram", {
//   secret_token: process.env.TELEGRAM_SECRET_TOKEN,
// })

export const telegramTools = {
  send_message: tool({
    description: 'Send a message to Maxie and Minnie via Telegram',
    inputSchema: z.object({
      message: z.string(),
    }),
    execute: async ({ message }) => {
      try {
        await bot.telegram.sendMessage('-4904434425', message)
        return { message: `Message sent: ${message}` }
      } catch (error) {
        console.error(error)
        return { message: `Error sending message: ${error}` }
      }
    },
  }),
}
