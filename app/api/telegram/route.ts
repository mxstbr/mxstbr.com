// This route gets posted by the Telegram Bot API when a message is sent to the bot.
import { NextRequest, NextResponse } from 'next/server'
import { type Update } from 'telegraf/types'
import { bot } from 'app/lib/telegram'
import { clippy } from 'app/lib/clippy-agent'
import { dedent } from 'app/lib/dedent'

export async function POST(request: NextRequest) {
  if (
    request.headers.get('X-Telegram-Bot-Api-Secret-Token') !==
    process.env.TELEGRAM_SECRET_TOKEN
  ) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const update: Update = await request.json()
  if ('message' in update) {
    const message = update.message
    const chatId = message.chat.id

    try {
      const result = await clippy.generate({
        messages: [
          {
            role: 'user',
            content: dedent`
              The following message was sent in a Telegram group chat between Maxie and Minnie.
              Determine whether it is meant for you and, if so, respond to it. If not, do nothing.
              <message>${JSON.stringify(message)}</message>`,
          },
        ],
      })

      // Only send a response if clippy generated one
      if (result.text && result.text.trim()) {
        await bot.telegram.sendMessage(chatId, result.text)
      }
    } catch (error) {
      console.error('Error processing Telegram message:', error)
      // Still return 200 to acknowledge receipt, but log the error
    }
  }

  // Always return 200 OK to acknowledge receipt
  return NextResponse.json({ ok: true })
}
