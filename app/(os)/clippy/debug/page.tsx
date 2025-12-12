import { Redis } from '@upstash/redis'
import { isMax } from 'app/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

const redis = Redis.fromEnv()
const NEW_CONVERSATION_INDEX_KEY = 'clippy:conversations'

export const dynamic = 'force-dynamic'

type ToolCall = {
  type: string
  toolCallId: string
  toolName: string
  args: Record<string, any>
  state?: string
  result?: any
}

type ToolResult = {
  type: string
  toolCallId: string
  toolName: string
  args: Record<string, any>
  result: any
}

type LogStep = {
  stepType: string
  text: string
  reasoningDetails: any[]
  files: any[]
  sources: any[]
  toolCalls: ToolCall[]
  toolResults: ToolResult[]
  finishReason: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  warnings: any[]
  request: {
    body: string
  }
  response: {
    id: string
    timestamp: string
    modelId: string
    headers: Record<string, string>
    messages: {
      role: string
      content: Array<{
        type: string
        text?: string
        toolCallId?: string
        toolName?: string
        args?: Record<string, any>
      }>
      id: string
    }[]
  }
  providerMetadata: Record<string, any>
  experimental_providerMetadata: Record<string, any>
  isContinued: boolean
}

type ConversationMeta = {
  id: string
  createdAt: number
  updatedAt?: number
  sessionId?: string
  modelId?: string
  request?: any
}

type ConversationRecord = {
  id: string
  date: Date
  steps: LogStep[]
  messages: any[]
  meta?: ConversationMeta
  request?: any
}

function parseTimestamp(value: unknown) {
  if (typeof value === 'number') {
    return value > 1_000_000_000_000 ? value : value * 1000
  }

  if (typeof value === 'string') {
    const numericValue = Number(value)

    if (Number.isFinite(numericValue)) {
      return numericValue > 1_000_000_000_000
        ? numericValue
        : numericValue * 1000
    }

    const parsedDate = Date.parse(value)
    if (!Number.isNaN(parsedDate)) {
      return parsedDate
    }
  }

  return undefined
}

type DebugPageProps = {
  searchParams?: Promise<{
    page?: string | string[]
    pageSize?: string | string[]
  }>
}

function parseNumberParam(
  value: string | string[] | undefined,
  defaultValue: number,
  {
    min,
    max,
  }: {
    min: number
    max: number
  },
) {
  const rawValue = Array.isArray(value) ? value[0] : value
  const parsed = Number.parseInt(rawValue ?? '', 10)

  if (!Number.isFinite(parsed)) return defaultValue

  return Math.min(Math.max(parsed, min), max)
}

function safeParseJSON<T>(value: any): T | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'object') return value as T

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch (e) {
      return undefined
    }
  }

  return undefined
}

function normalizeMessages(value: any): any[] {
  if (!value) return []
  if (Array.isArray(value)) return value

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      return []
    }
  }

  return []
}

function getToolResultPreview(content: any) {
  const truncate = (value: string) => {
    const singleLine = value.replace(/\s+/g, ' ').trim()
    return singleLine.length > 120 ? `${singleLine.slice(0, 120)}…` : singleLine
  }

  if (typeof content === 'string') return truncate(content)

  if (Array.isArray(content) && content.length) {
    const first = content[0]
    if (typeof first === 'string') return truncate(first)
    if (typeof first?.text === 'string') return truncate(first.text)
  }

  if (content && typeof content === 'object') {
    if (typeof content.text === 'string') return truncate(content.text)
    if (typeof content.message === 'string') return truncate(content.message)
    try {
      return truncate(JSON.stringify(content))
    } catch (e) {}
  }

  return 'View result'
}

function parseLogStep(log: any): LogStep | undefined {
  if (!log) return undefined
  if (typeof log === 'object') return log as LogStep

  if (typeof log === 'string') {
    try {
      return JSON.parse(log) as LogStep
    } catch (e) {
      return undefined
    }
  }

  return undefined
}

function extractMessagesFromRequest(request: any) {
  if (!request) return undefined

  if (request.messages && Array.isArray(request.messages)) {
    return request.messages
  }

  const body = request.body ?? request

  if (!body) return undefined

  try {
    const parsedBody = typeof body === 'string' ? JSON.parse(body) : body
    if (parsedBody?.messages && Array.isArray(parsedBody.messages)) {
      return parsedBody.messages
    }
  } catch (e) {}

  return undefined
}

async function buildNewConversation(
  conversationId: string,
  score?: number,
): Promise<ConversationRecord> {
  const baseKey = `clippy:conversation:${conversationId}`
  const [metaRaw, stepsRaw, messagesRaw] = await Promise.all([
    redis.get(`${baseKey}:meta`),
    redis.lrange(`${baseKey}:steps`, 0, -1),
    redis.get(`${baseKey}:messages`),
  ])

  const meta = safeParseJSON<ConversationMeta>(metaRaw)
  const steps = (stepsRaw ?? [])
    .map(parseLogStep)
    .filter(Boolean) as LogStep[]

  const createdAt =
    (meta?.createdAt && parseTimestamp(meta.createdAt)) ||
    (typeof score === 'number' ? score : undefined) ||
    (steps[0]?.response?.timestamp &&
      parseTimestamp(steps[0]?.response?.timestamp)) ||
    Date.now()

  const messagesFromStore = normalizeMessages(messagesRaw)
  const requestPayload = meta?.request ?? steps[0]?.request
  const requestMessages = extractMessagesFromRequest(requestPayload)
  const combinedMessages =
    messagesFromStore.length > 0
      ? messagesFromStore
      : requestMessages ?? normalizeMessages(meta?.request?.messages)

  return {
    id: conversationId,
    date: new Date(createdAt),
    steps,
    messages: combinedMessages ?? [],
    meta: meta
      ? { ...meta, createdAt, updatedAt: meta.updatedAt ?? createdAt }
      : undefined,
    request: requestPayload,
  }
}

async function getNewConversations(
  page: number,
  pageSize: number,
): Promise<{ conversations: ConversationRecord[]; total: number }> {
  const total = await redis.zcard(NEW_CONVERSATION_INDEX_KEY)

  if (!total) {
    return { conversations: [], total: 0 }
  }

  const startIndex = (page - 1) * pageSize
  const entries = await redis.zrange(
    NEW_CONVERSATION_INDEX_KEY,
    startIndex,
    startIndex + pageSize - 1,
    {
      rev: true,
      withScores: true,
    },
  )

  const conversations = await Promise.all(
    entries.map((entry: any) => {
      if (typeof entry === 'string') {
        return buildNewConversation(entry)
      }

      const scoreValue =
        typeof entry?.score === 'string'
          ? Number(entry.score)
          : entry?.score ?? undefined

      return buildNewConversation(entry?.member ?? entry?.value ?? '', scoreValue)
    }),
  )

  return { conversations, total }
}

export default async function DebugPage({ searchParams }: DebugPageProps) {
  if (!(await isMax())) {
    redirect('/')
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined

  const pageSize = parseNumberParam(resolvedSearchParams?.pageSize, 20, {
    min: 1,
    max: 50,
  })
  const page = parseNumberParam(resolvedSearchParams?.page, 1, {
    min: 1,
    max: Number.MAX_SAFE_INTEGER,
  })

  let currentPage = page
  let { conversations, total } = await getNewConversations(currentPage, pageSize)

  let totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (currentPage > totalPages) {
    currentPage = totalPages
    const newPage = await getNewConversations(currentPage, pageSize)
    conversations = newPage.conversations
    total = newPage.total
    totalPages = Math.max(1, Math.ceil(total / pageSize))
  }

  const startIndex = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex =
    total === 0 ? 0 : Math.min(startIndex + conversations.length - 1, total)

  const buildPageHref = (pageNumber: number) => {
    const params = new URLSearchParams({
      page: pageNumber.toString(),
      pageSize: pageSize.toString(),
    })

    return `/clippy/debug?${params.toString()}`
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Clippy Debug Logs</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="text-sm text-gray-600">
          {total === 0 ? (
            'No conversations yet'
          ) : (
            <>
              Showing{' '}
              <span className="font-medium">
                {startIndex}–{endIndex}
              </span>{' '}
              of <span className="font-medium">{total}</span> conversations
            </>
          )}
        </div>

        {total > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={buildPageHref(Math.max(1, currentPage - 1))}
              className={`px-3 py-1 rounded-sm border transition-colors ${
                currentPage === 1
                  ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'text-blue-600 border-blue-200 hover:bg-blue-50'
              }`}
              aria-disabled={currentPage === 1}
              tabIndex={currentPage === 1 ? -1 : undefined}
            >
              Previous
            </Link>
            <span className="text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <Link
              href={buildPageHref(Math.min(totalPages, currentPage + 1))}
              className={`px-3 py-1 rounded-sm border transition-colors ${
                currentPage === totalPages
                  ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'text-blue-600 border-blue-200 hover:bg-blue-50'
              }`}
              aria-disabled={currentPage === totalPages}
              tabIndex={currentPage === totalPages ? -1 : undefined}
            >
              Next
            </Link>
          </div>
        )}
      </div>

      {conversations.length === 0 ? (
        <p>No conversations found</p>
      ) : (
        <div className="space-y-12">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-semibold">
                  Conversation from {conversation.date.toLocaleString()}
                </h2>
                <span className="text-sm text-gray-500">
                  ID: {conversation.id}
                </span>
              </div>
              {(() => {
                const toolCalls: ToolCall[] = []
                const toolResults: ToolResult[] = []

                conversation.steps.forEach((step) => {
                  if (step?.toolCalls?.length) {
                    toolCalls.push(...step.toolCalls)
                  }

                  if (step?.toolResults?.length) {
                    toolResults.push(...step.toolResults)
                  }
                })

                const finalTextResponse =
                  conversation.steps[conversation.steps.length - 1]?.text ?? ''

                const renderContent = (content: any, messageIndex: number) => {
                  const normalized =
                    typeof content === 'string'
                      ? [{ type: 'text', text: content }]
                      : Array.isArray(content)
                        ? content
                        : []

                  if (normalized.length === 0) {
                    return (
                      <pre className="whitespace-pre-wrap text-xs overflow-x-auto">
                        {typeof content === 'string'
                          ? content
                          : JSON.stringify(content, null, 2)}
                      </pre>
                    )
                  }

                  return normalized.map((part: any, idx: number) => {
                    if (part?.type === 'text') {
                      return <div key={`${messageIndex}-${idx}`}>{part.text}</div>
                    }

                    if (part?.type === 'tool-call' || part?.type === 'tool_call') {
                      const args =
                        typeof part.args === 'string'
                          ? (() => {
                              try {
                                return JSON.parse(part.args)
                              } catch (e) {
                                return part.args
                              }
                            })()
                          : part.args

                      return (
                        <div
                          key={`${messageIndex}-${idx}`}
                          className="my-2 p-2 rounded-sm bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100"
                        >
                          <div className="text-sm text-yellow-700 dark:text-yellow-200">
                            <span className="font-medium">{part.toolName}</span>
                          </div>
                          {args && Object.keys(args).length > 0 && (
                            <div className="mt-1 text-xs text-yellow-800 dark:text-yellow-300">
                              with parameters:{' '}
                              {Object.entries(args).map(([key, value]) => (
                                <span key={key} className="inline-block mr-2">
                                  <span className="font-medium">{key}</span>: {JSON.stringify(value)}
                                </span>
                              ))}
                            </div>
                          )}
                          <details className="mt-1">
                            <summary className="text-xs text-yellow-700 dark:text-yellow-200 cursor-pointer hover:text-yellow-900 dark:hover:text-yellow-100">
                              View technical details
                            </summary>
                            <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-800 rounded-sm text-xs overflow-x-auto">
                              <pre className="font-mono whitespace-pre-wrap">
                                {JSON.stringify(part, null, 2)}
                              </pre>
                            </div>
                          </details>
                        </div>
                      )
                    }

                    return (
                      <pre
                        key={`${messageIndex}-${idx}`}
                        className="whitespace-pre-wrap text-xs overflow-x-auto"
                      >
                        {JSON.stringify(part, null, 2)}
                      </pre>
                    )
                  })
                }

                if (conversation.messages.length === 0) {
                  return (
                    <div className="space-y-3">
                      {conversation.steps.map((log, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-sm">
                          <details>
                            <summary className="cursor-pointer font-medium mb-2">
                              {log?.stepType || 'Log Entry'}{' '}
                              {log?.text ? `- ${log.text.substring(0, 50)}...` : ''}
                            </summary>
                            <div className="space-y-3">
                              <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
                                {JSON.stringify(log, null, 2)}
                              </pre>
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>
                  )
                }

                return (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1 text-xs text-gray-500">
                      {conversation.meta?.sessionId && (
                        <span>Session: {conversation.meta.sessionId}</span>
                      )}
                      {conversation.meta?.modelId && (
                        <span>Model: {conversation.meta.modelId}</span>
                      )}
                    </div>

                    {conversation.messages.map((message, index) => {
                      const role = message.role ?? message.type ?? 'assistant'
                      if (role === 'system') return null

                      const isUser = role === 'user'
                      const isAssistant = role === 'assistant'
                      const isTool = role === 'tool'

                      const content =
                        message.content ?? message.parts ?? message.text ?? ''

                      return (
                        <div key={index} className="space-y-2">
                          {isUser && (
                            <div className="whitespace-pre-wrap flex justify-end">
                              <div className="max-w-full px-4 py-2 rounded-lg shadow-xs border text-sm bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700">
                                <div className="font-semibold mb-1 opacity-70 text-xs">
                                  User
                                </div>
                                <div>{renderContent(content, index)}</div>
                              </div>
                            </div>
                          )}

                          {isAssistant && (
                            <div className="whitespace-pre-wrap flex justify-start">
                              <div className="max-w-full px-4 py-2 rounded-lg shadow-xs border text-sm bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
                                <div className="font-semibold mb-1 opacity-70 text-xs">
                                  AI
                                </div>
                                <div className="mb-2">{renderContent(content, index)}</div>
                              </div>
                            </div>
                          )}

                          {isTool && (
                            <div className="whitespace-pre-wrap flex justify-start">
                              <div className="max-w-full px-4 py-2 rounded-lg shadow-xs border text-sm bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
                                <details className="space-y-2">
                                  <summary className="flex items-start justify-between gap-2 cursor-pointer font-semibold text-xs opacity-70">
                                    <span>Tool Result</span>
                                    <span className="text-[11px] font-normal text-gray-500 max-w-[260px] truncate">
                                      {getToolResultPreview(content)}
                                    </span>
                                  </summary>
                                  <div className="my-2 p-2 rounded-sm bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-900 dark:text-green-100">
                                    <div className="flex items-start gap-2">
                                      <div className="flex-1">{renderContent(content, index)}</div>
                                    </div>
                                  </div>
                                </details>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {finalTextResponse &&
                      !conversation.messages.some(
                        (m: any) =>
                          m.role === 'assistant' &&
                          (m.content === finalTextResponse ||
                            (typeof m.content === 'string' &&
                              m.content.includes(finalTextResponse))),
                      ) && (
                        <div className="whitespace-pre-wrap flex justify-start">
                          <div className="max-w-full px-4 py-2 rounded-lg shadow-xs border text-sm bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
                            <div className="font-semibold mb-1 opacity-70 text-xs">
                              AI
                            </div>
                            <div>{finalTextResponse}</div>
                          </div>
                        </div>
                      )}

                    {toolCalls.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                          Tool Calls ({toolCalls.length})
                        </summary>
                        <div className="mt-2 space-y-2">
                          {toolCalls.map((call, idx) => (
                            <div
                              key={`${call.toolCallId}-${idx}`}
                              className="p-2 rounded-sm bg-yellow-50 border border-yellow-200 text-xs text-yellow-900"
                            >
                              <div className="font-semibold">{call.toolName}</div>
                              <div className="text-[11px] text-yellow-800">
                                ID: {call.toolCallId}
                              </div>
                              {call.args && (
                                <pre className="mt-1 whitespace-pre-wrap">
                                  {JSON.stringify(call.args, null, 2)}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {toolResults.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                          Tool Results ({toolResults.length})
                        </summary>
                        <div className="mt-2 space-y-2">
                          {toolResults.map((result, idx) => (
                            <div
                              key={`${result.toolCallId}-${idx}`}
                              className="p-2 rounded-sm bg-green-50 border border-green-200 text-xs text-green-900"
                            >
                              <div className="font-semibold">{result.toolName}</div>
                              <div className="text-[11px] text-green-800">
                                ID: {result.toolCallId}
                              </div>
                              {result.result && (
                                <pre className="mt-1 whitespace-pre-wrap">
                                  {JSON.stringify(result.result, null, 2)}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                        View Raw Conversation Data
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded-sm border border-gray-200">
                        <pre className="whitespace-pre-wrap text-xs overflow-x-auto">
                          {JSON.stringify(conversation.steps, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                )
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
