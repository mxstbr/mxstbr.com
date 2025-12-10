// This route gets posted by the Telegram Bot API when a message is sent to the bot.
import { NextRequest, NextResponse } from 'next/server'
import { type Update } from 'telegraf/types'
import { bot } from 'app/lib/telegram'
import { clippy } from 'app/lib/clippy-agent'
import { dedent } from 'app/lib/dedent'

export const maxDuration = 60

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

    let thinkingMessage

    try {
      thinkingMessage = await bot.telegram.sendMessage(chatId, 'Thinking…')

      const userContent =
        ('text' in message && message.text) ||
        ('caption' in message && message.caption) ||
        ''

      const result = await clippy.generate({
        messages: [
          {
            role: 'system',
            content: dedent`
              You are Clippy, the assistant for Maxie and Minnie.
              Treat every message sent in their Telegram chat as being addressed to you and reply accordingly.
              Message details:
              <message>${JSON.stringify(message)}</message>`,
          },
          { role: 'user', content: userContent },
        ],
      })

      const responseText = result.text?.trim()

      await bot.telegram.editMessageText(
        chatId,
        thinkingMessage.message_id,
        undefined,
        responseText || 'Sorry, I could not generate a response.',
      )
    } catch (error) {
      console.error('Error processing Telegram message:', error)

      if (thinkingMessage) {
        await bot.telegram
          .editMessageText(
            chatId,
            thinkingMessage.message_id,
            undefined,
            'Sorry, something went wrong while generating a response.',
          )
          .catch(() => {})
      } else {
        await bot.telegram
          .sendMessage(chatId, 'Sorry, something went wrong while generating a response.')
          .catch(() => {})
      }
      // Still return 200 to acknowledge receipt, but log the error
    }
  }

  // Always return 200 OK to acknowledge receipt
  return NextResponse.json({ ok: true })
}
