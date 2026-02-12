// This route gets posted by the Telegram Bot API when a message is sent to the bot.
import { NextRequest, NextResponse } from 'next/server'
import { type Update } from 'telegraf/types'
import { bot } from 'app/lib/telegram'
import { getClippy } from 'app/lib/clippy-agent'
import { dedent } from 'app/lib/dedent'

export const maxDuration = 800

const TELEGRAM_MAX_MESSAGE_LENGTH = 4096
const STREAM_UPDATE_INTERVAL_MS = 700

function truncateForTelegram(
  value: string,
  limit = TELEGRAM_MAX_MESSAGE_LENGTH,
) {
  if (!value) return ''
  if (value.length <= limit) return value
  return `${value.slice(0, Math.max(0, limit - 1)).trimEnd()}…`
}

function extractReasoningTitle(text: string) {
  const lines = text
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const firstLine = lines[0]
  if (!firstLine) return ''

  const boldHeading = firstLine.match(/^\*\*(.+?)\*\*$/)?.[1]?.trim()
  const markdownHeading = firstLine.match(/^#{1,6}\s+(.+)$/)?.[1]?.trim()
  const title = (boldHeading || markdownHeading || firstLine)
    .replace(/^[-*]\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()

  return title ? truncateForTelegram(title, 120) : ''
}

function buildProgressMessage(reasoningTitles: string[]) {
  const sections: string[] = ['🤔 Thinking']

  if (reasoningTitles.length === 0) {
    sections.push('• Gathering reasoning summaries…')
  } else {
    for (const title of reasoningTitles.slice(0, 8)) {
      sections.push(`• ${title}`)
    }
  }

  sections.push('')
  sections.push('⏳ Working…')

  return truncateForTelegram(sections.join('\n'), TELEGRAM_MAX_MESSAGE_LENGTH)
}

async function safeEditMessageText(
  chatId: number,
  messageId: number,
  text: string,
) {
  await bot.telegram
    .editMessageText(chatId, messageId, undefined, text)
    .catch((error: unknown) => {
      // Telegram returns "message is not modified" frequently during stream updates.
      const message = error instanceof Error ? error.message : String(error)
      if (!message.toLowerCase().includes('message is not modified')) {
        throw error
      }
    })
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

    let thinkingMessage
    let draftText = ''
    let lastDraftUpdate = 0
    const reasoningOrder: string[] = []
    const reasoningById = new Map<
      string,
      {
        text: string
        title: string
      }
    >()

    try {
      thinkingMessage = await bot.telegram.sendMessage(chatId, 'Thinking…')

      const userContent =
        ('text' in message && message.text) ||
        ('caption' in message && message.caption) ||
        ''

      const clippy = await getClippy(request)
      const stream = await clippy.stream({
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

      for await (const part of stream.fullStream as AsyncIterable<any>) {
        switch (part?.type) {
          case 'text-delta':
            if (typeof part.delta === 'string') draftText += part.delta
            else if (typeof part.text === 'string') draftText += part.text
            break
          case 'reasoning-start': {
            const reasoningId =
              typeof part.id === 'string' ? part.id : undefined
            if (!reasoningId) break
            if (!reasoningById.has(reasoningId)) {
              reasoningOrder.push(reasoningId)
              reasoningById.set(reasoningId, { text: '', title: '' })
            }
            break
          }
          case 'reasoning-delta':
            const reasoningId =
              typeof part.id === 'string' ? part.id : undefined
            const reasoningDelta =
              typeof part.delta === 'string'
                ? part.delta
                : typeof part.text === 'string'
                  ? part.text
                  : undefined
            if (!reasoningId || !reasoningDelta) break
            if (!reasoningById.has(reasoningId)) {
              reasoningOrder.push(reasoningId)
              reasoningById.set(reasoningId, { text: '', title: '' })
            }
            const entry = reasoningById.get(reasoningId)!
            entry.text += reasoningDelta
            entry.title = extractReasoningTitle(entry.text)
            reasoningById.set(reasoningId, entry)
            break
          case 'reasoning-end': {
            const reasoningId =
              typeof part.id === 'string' ? part.id : undefined
            if (!reasoningId) break
            if (!reasoningById.has(reasoningId)) {
              reasoningOrder.push(reasoningId)
              reasoningById.set(reasoningId, { text: '', title: '' })
            }
            const entry = reasoningById.get(reasoningId)!
            if (!entry.title) {
              entry.title = `Reasoning step ${reasoningOrder.indexOf(reasoningId) + 1}`
            }
            reasoningById.set(reasoningId, entry)
            break
          }
          default:
            break
        }

        const now = Date.now()
        if (now - lastDraftUpdate >= STREAM_UPDATE_INTERVAL_MS) {
          const reasoningTitles = reasoningOrder.map((id, index) => {
            const entry = reasoningById.get(id)
            return entry?.title || `Reasoning step ${index + 1}`
          })
          const progressText = buildProgressMessage(reasoningTitles)
          await safeEditMessageText(
            chatId,
            thinkingMessage.message_id,
            progressText,
          )
          lastDraftUpdate = now
        }
      }

      const responseText = draftText.trim()

      await safeEditMessageText(
        chatId,
        thinkingMessage.message_id,
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
          .sendMessage(
            chatId,
            'Sorry, something went wrong while generating a response.',
          )
          .catch(() => {})
      }
      // Still return 200 to acknowledge receipt, but log the error
    }
  }

  // Always return 200 OK to acknowledge receipt
  return NextResponse.json({ ok: true })
}
