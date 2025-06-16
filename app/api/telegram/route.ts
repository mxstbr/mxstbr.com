// This route gets posted by the Telegram Bot API when a message is sent to the bot.
import { NextRequest, NextResponse } from 'next/server'
import { type Update } from 'telegraf/types'
import { bot } from 'app/lib/telegram'
import { generateText } from 'app/lib/cal-agent'

export async function POST(request: NextRequest) {
    if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== process.env.TELEGRAM_SECRET_TOKEN) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

  const update: Update = await request.json()
  if ('message' in update) {
    const message = update.message
    const result = await generateText({
      messages: [
        {
          role: 'user',
          content: `You just received the below message via Telegram, reply to it: ${JSON.stringify(message)}`,
        },
      ],
    })

    await bot.telegram.sendMessage(message.chat.id, result.text)

    return NextResponse.json({ message: result.text })
  }

  return NextResponse.json({ message: 'Received successfully.' })
}
