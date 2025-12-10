// This route gets posted by the Telegram Bot API when a message is sent to the bot.
import { NextRequest, NextResponse } from 'next/server'
import { type Update } from 'telegraf/types'
import { bot } from 'app/lib/telegram'
import { clippy } from 'app/lib/clippy-agent'
import { dedent } from 'app/lib/dedent'

export const maxDuration = 60

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatToolCalls(allToolCalls: any[]) {
  return (
    'Tools called:\n' +
    allToolCalls
      .map((tc) => {
        const input = ('input' in tc && tc.input) || {}
        const redactedInput =
          input && typeof input === 'object'
            ? Object.fromEntries(
                Object.entries(input).map(([key, value]) =>
                  key.toLowerCase() === 'message' && typeof value === 'string'
                    ? [key, '[hidden]']
                    : [key, value],
                ),
              )
            : {}
        const argsStr = JSON.stringify(redactedInput, null, 2)
        const spoilerContent =
          Object.keys(redactedInput).length === 0
            ? ''
            : `\n<tg-spoiler><pre>${escapeHtml(argsStr)}</pre></tg-spoiler>`

        return `- ${tc.toolName}: success${spoilerContent}`
      })
      .join('\n')
  )
}

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

      // Extract tool calls from the result steps
      const allToolCalls =
        result.steps?.flatMap((step) => step.toolCalls || []) || []

      // Only send a response if clippy generated one or if there were tool calls
      if (result.text && result.text.trim()) {
        await bot.telegram.sendMessage(chatId, result.text.trim())
      }

      if (allToolCalls.length > 0) {
        const toolDetails = formatToolCalls(allToolCalls)

        await bot.telegram.sendMessage(chatId, toolDetails, {
          parse_mode: 'HTML',
        })
      }
    } catch (error) {
      console.error('Error processing Telegram message:', error)
      // Still return 200 to acknowledge receipt, but log the error
    }
  }

  // Always return 200 OK to acknowledge receipt
  return NextResponse.json({ ok: true })
}
