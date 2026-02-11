'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, getToolName, isToolUIPart } from 'ai'
import { ClippyAgentUIMessage } from 'app/lib/clippy-agent'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

function parseReasoningSummary(text: string): {
  heading?: string
  body: string
} {
  const trimmed = text.trim()
  if (!trimmed) return { body: '' }

  const lines = trimmed.split('\n')
  const firstNonEmptyLineIndex = lines.findIndex((line) => line.trim().length)
  if (firstNonEmptyLineIndex === -1) return { body: '' }

  const firstLine = lines[firstNonEmptyLineIndex]!.trim()
  const boldHeading = firstLine.match(/^\*\*(.+?)\*\*$/)?.[1]?.trim()
  const markdownHeading = firstLine.match(/^#{1,6}\s+(.+)$/)?.[1]?.trim()
  const heading = boldHeading || markdownHeading

  if (!heading) return { body: trimmed }

  const body = lines
    .filter((_, index) => index !== firstNonEmptyLineIndex)
    .join('\n')
    .trim()

  return { heading, body }
}

export default function Chat() {
  const [sessionId] = useState<string>(() => Date.now().toString())
  const [input, setInput] = useState<string>('')
  const router = useRouter()

  const { messages, sendMessage, status, error } =
    useChat<ClippyAgentUIMessage>({
      transport: new DefaultChatTransport({
        api: '/api/chat',
        headers: {
          'x-session-id': sessionId,
        },
      }),
      onFinish: ({ message }) => {
        if (message.parts.some((part) => part.type.includes('event'))) {
          router.refresh()
        }
      },
      onError: (error) => {
        console.error('Chat error:', error)
      },
    })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage({ text: input })
      setInput('')
    }
  }

  return (
    <div className="flex flex-col w-full h-64 mx-auto">
      <div className="flex-1 overflow-y-auto flex flex-col-reverse space-y-2 space-y-reverse p-3">
        {[...messages].reverse().map((message, index) => {
          const isUser = message.role === 'user'
          const hasThinkingPart = message.parts.some(
            (part) => part.type === 'reasoning',
          )
          const hasReasoningWithContent = message.parts.some(
            (part) =>
              part.type === 'reasoning' &&
              'text' in part &&
              part.text.trim().length > 0,
          )
          return (
            <div
              key={message.id}
              className={`whitespace-pre-wrap flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg shadow-xs border text-sm
                  ${
                    isUser
                      ? 'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700'
                      : 'bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'
                  }
                `}
              >
                {!isUser && <strong>Clippy</strong>}
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      return <div key={`${message.id}-${i}`}>{part.text}</div>
                    case 'reasoning': {
                      const thinkingContent =
                        'text' in part ? part.text.trim() : ''
                      if (!thinkingContent && hasReasoningWithContent) {
                        return null
                      }

                      const { heading, body } =
                        parseReasoningSummary(thinkingContent)
                      const detailsLabel = heading || 'Thinking'
                      const detailsBody = heading ? body : thinkingContent
                      const fallback =
                        'No visible reasoning summary was returned for this step.'
                      return (
                        <details
                          key={`${message.id}-${i}`}
                          className="my-2 text-xs text-slate-600 dark:text-slate-300"
                        >
                          <summary className="cursor-pointer font-medium">
                            {detailsLabel}
                          </summary>
                          {detailsBody ? (
                            <pre className="mt-2 whitespace-pre-wrap">
                              {detailsBody}
                            </pre>
                          ) : (
                            <div className="mt-2 italic">{fallback}</div>
                          )}
                        </details>
                      )
                    }
                    default:
                      // Handle dynamic tool calls (they start with 'tool-')
                      if (isToolUIPart(part)) {
                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className="my-2 p-2 rounded-sm bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100"
                          >
                            <div className="text-xs font-medium mb-1">
                              🔧 Tool Call: {getToolName(part)}
                            </div>
                            <details>
                              <summary>View details</summary>
                              <pre>
                                <code>{JSON.stringify(part, null, 2)}</code>
                              </pre>
                            </details>
                          </div>
                        )
                      }
                      return null
                  }
                })}
                {error && index === 0 && (
                  <div className="my-2 p-2 rounded-sm bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-900 dark:text-red-100 text-xs">
                    ⚠️ Error: {error.message || 'An error occurred'}
                  </div>
                )}
                {index === 0 &&
                  !isUser &&
                  status === 'streaming' &&
                  !hasThinkingPart && (
                    <details className="my-2 text-xs text-slate-600 dark:text-slate-300">
                      <summary className="cursor-pointer font-medium">
                        Thinking
                      </summary>
                      <div className="mt-2">Waiting for thinking stream…</div>
                    </details>
                  )}
              </div>
            </div>
          )
        })}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-200 dark:border-slate-700 w-full"
      >
        <input
          className="w-full p-3 bg-transparent dark:bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-hidden focus:outline-hidden border-none shadow-none rounded-none"
          style={{ boxShadow: 'none', border: 'none' }}
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== 'ready'}
        />
      </form>
    </div>
  )
}
