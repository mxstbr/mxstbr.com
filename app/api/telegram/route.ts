// This route gets posted by the Telegram Bot API when a message is sent to the bot.
import { NextRequest, NextResponse } from 'next/server'
import { type Update } from 'telegraf/types'
import { bot } from 'app/lib/telegram'
import { getClippy } from 'app/lib/clippy-agent'
import { dedent } from 'app/lib/dedent'

export const maxDuration = 800

const TELEGRAM_MAX_MESSAGE_LENGTH = 4096
const STREAM_UPDATE_INTERVAL_MS = 700

type ToolTraceEntry = {
  toolName: string
  input?: unknown
  status: 'called' | 'ok' | 'error' | 'denied'
  outputSummary?: string
}

function truncateForTelegram(
  value: string,
  limit = TELEGRAM_MAX_MESSAGE_LENGTH,
) {
  if (!value) return ''
  if (value.length <= limit) return value
  return `${value.slice(0, Math.max(0, limit - 1)).trimEnd()}…`
}

function compactInline(value: unknown, limit = 180) {
  if (value === null || value === undefined) return ''
  let text = ''

  try {
    text =
      typeof value === 'string'
        ? value
        : JSON.stringify(value, (_key, nestedValue) =>
            typeof nestedValue === 'string' && nestedValue.length > 120
              ? `${nestedValue.slice(0, 117)}...`
              : nestedValue,
          )
  } catch {
    text = String(value)
  }

  const singleLine = text.replace(/\s+/g, ' ').trim()
  if (singleLine.length <= limit) return singleLine
  return `${singleLine.slice(0, Math.max(0, limit - 1)).trimEnd()}…`
}

function summarizeToolOutput(output: unknown) {
  if (typeof output === 'string') return compactInline(output, 140)
  if (output && typeof output === 'object') {
    const asRecord = output as Record<string, unknown>
    if (typeof asRecord.message === 'string') {
      return compactInline(asRecord.message, 140)
    }
    if (typeof asRecord.status === 'string') {
      return `status: ${asRecord.status}`
    }
    if (typeof asRecord.success === 'boolean') {
      return asRecord.success ? 'success' : 'failed'
    }
    if (typeof asRecord.count === 'number') {
      return `${asRecord.count} match${asRecord.count === 1 ? '' : 'es'}`
    }
  }

  return compactInline(output, 140)
}

function formatToolTraceLines(entries: ToolTraceEntry[]) {
  return entries.map((entry, index) => {
    const input = entry.input ? ` ${compactInline(entry.input)}` : ''
    const statusPrefix =
      entry.status === 'ok'
        ? 'ok'
        : entry.status === 'error'
          ? 'error'
          : entry.status === 'denied'
            ? 'denied'
            : 'called'
    const resultSuffix = entry.outputSummary
      ? ` -> ${compactInline(entry.outputSummary, 120)}`
      : ''
    return `${index + 1}. ${entry.toolName}${input} [${statusPrefix}]${resultSuffix}`
  })
}

function buildProgressMessage({
  draftText,
  reasoningText,
  toolEntries,
}: {
  draftText: string
  reasoningText: string
  toolEntries: ToolTraceEntry[]
}) {
  const sections: string[] = []
  const answerPreview = draftText.trim()
  const reasoningPreview = reasoningText.trim()

  if (answerPreview) {
    sections.push(truncateForTelegram(answerPreview, 1500))
    sections.push('')
  }

  sections.push('🤔 Thinking')
  sections.push(
    reasoningPreview
      ? truncateForTelegram(reasoningPreview, 900)
      : 'Gathering reasoning summary…',
  )

  if (toolEntries.length > 0) {
    sections.push('')
    sections.push('🛠 Tool calls')
    sections.push(...formatToolTraceLines(toolEntries).slice(0, 4))
  }

  sections.push('')
  sections.push('⏳ Working…')

  return truncateForTelegram(sections.join('\n'), TELEGRAM_MAX_MESSAGE_LENGTH)
}

function buildTraceMessage({
  reasoningText,
  toolEntries,
}: {
  reasoningText: string
  toolEntries: ToolTraceEntry[]
}) {
  if (!reasoningText.trim() && toolEntries.length === 0) return ''

  const sections: string[] = ['🧠 Trace']

  sections.push('')
  sections.push('Thinking')
  sections.push(
    reasoningText.trim()
      ? truncateForTelegram(reasoningText.trim(), 1800)
      : 'No visible reasoning summary returned by the model.',
  )

  sections.push('')
  sections.push(`Tool calls (${toolEntries.length})`)
  if (toolEntries.length === 0) {
    sections.push('None')
  } else {
    sections.push(...formatToolTraceLines(toolEntries))
  }

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
    let reasoningText = ''
    let lastDraftUpdate = 0
    const toolTraceById = new Map<string, ToolTraceEntry>()
    const toolTraceOrder: string[] = []

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
            if (typeof part.text === 'string') {
              draftText += part.text
            }
            break
          case 'reasoning-delta':
            if (typeof part.text === 'string') {
              reasoningText += part.text
            }
            break
          case 'tool-call': {
            const toolCallId =
              typeof part.toolCallId === 'string' ? part.toolCallId : undefined
            if (!toolCallId) break
            if (!toolTraceById.has(toolCallId)) {
              toolTraceById.set(toolCallId, {
                toolName:
                  typeof part.toolName === 'string'
                    ? part.toolName
                    : 'unknown_tool',
                input: part.input,
                status: 'called',
              })
              toolTraceOrder.push(toolCallId)
            }
            break
          }
          case 'tool-result': {
            const toolCallId =
              typeof part.toolCallId === 'string' ? part.toolCallId : undefined
            if (!toolCallId) break
            const existing = toolTraceById.get(toolCallId)
            const nextEntry: ToolTraceEntry = {
              toolName:
                (existing?.toolName ||
                  (typeof part.toolName === 'string'
                    ? part.toolName
                    : 'unknown_tool')) ??
                'unknown_tool',
              input: existing?.input ?? part.input,
              status: 'ok',
              outputSummary: summarizeToolOutput(part.output),
            }
            if (!existing) {
              toolTraceOrder.push(toolCallId)
            }
            toolTraceById.set(toolCallId, nextEntry)
            break
          }
          case 'tool-error': {
            const toolCallId =
              typeof part.toolCallId === 'string' ? part.toolCallId : undefined
            if (!toolCallId) break
            const existing = toolTraceById.get(toolCallId)
            const nextEntry: ToolTraceEntry = {
              toolName:
                (existing?.toolName ||
                  (typeof part.toolName === 'string'
                    ? part.toolName
                    : 'unknown_tool')) ??
                'unknown_tool',
              input: existing?.input ?? part.input,
              status: 'error',
              outputSummary: summarizeToolOutput(part.error),
            }
            if (!existing) {
              toolTraceOrder.push(toolCallId)
            }
            toolTraceById.set(toolCallId, nextEntry)
            break
          }
          case 'tool-output-denied': {
            const toolCallId =
              typeof part.toolCallId === 'string' ? part.toolCallId : undefined
            if (!toolCallId) break
            const existing = toolTraceById.get(toolCallId)
            const nextEntry: ToolTraceEntry = {
              toolName:
                (existing?.toolName ||
                  (typeof part.toolName === 'string'
                    ? part.toolName
                    : 'unknown_tool')) ??
                'unknown_tool',
              input: existing?.input ?? part.input,
              status: 'denied',
              outputSummary: 'output denied',
            }
            if (!existing) {
              toolTraceOrder.push(toolCallId)
            }
            toolTraceById.set(toolCallId, nextEntry)
            break
          }
          default:
            break
        }

        const now = Date.now()
        if (now - lastDraftUpdate >= STREAM_UPDATE_INTERVAL_MS) {
          const toolEntries = toolTraceOrder
            .map((id) => toolTraceById.get(id))
            .filter(Boolean) as ToolTraceEntry[]
          const progressText = buildProgressMessage({
            draftText,
            reasoningText,
            toolEntries,
          })
          await safeEditMessageText(
            chatId,
            thinkingMessage.message_id,
            progressText,
          )
          lastDraftUpdate = now
        }
      }

      const responseText = draftText.trim()
      const toolEntries = toolTraceOrder
        .map((id) => toolTraceById.get(id))
        .filter(Boolean) as ToolTraceEntry[]
      const traceText = buildTraceMessage({ reasoningText, toolEntries })

      await safeEditMessageText(
        chatId,
        thinkingMessage.message_id,
        responseText || 'Sorry, I could not generate a response.',
      )

      if (traceText) {
        await bot.telegram.sendMessage(chatId, traceText)
      }
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
