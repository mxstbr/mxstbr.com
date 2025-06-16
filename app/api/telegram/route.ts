// This route gets posted by the Telegram Bot API when a message is sent to the bot.
import { NextRequest, NextResponse } from 'next/server'
import { type Update } from 'telegraf/types'
import { bot } from 'app/lib/telegram'
import { generateText } from 'app/lib/routing-agent'
import { dedent } from 'app/lib/dedent'

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
          content: dedent`
            The following message was sent in a Telegram group chat between Maxie and Minnie.
            Determine whether it is meant for you and, if so, respond to it. If not, do nothing.
            <message>${JSON.stringify(message)}</message>`,
        },
      ],
    })

    await bot.telegram.sendMessage(message.chat.id, result.text)

    return NextResponse.json({ message: result.text })
  }

  return NextResponse.json({ message: 'Received successfully.' })
}
