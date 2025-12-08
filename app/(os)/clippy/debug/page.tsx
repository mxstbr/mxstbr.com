import { Redis } from '@upstash/redis'
import { isMax } from 'app/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

const redis = Redis.fromEnv()

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

type LogKey = {
  key: string
  timestamp: number
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

function parseTimestampFromKey(key: string) {
  const [, timestampPart] = key.split(':')
  const timestamp = Number(timestampPart)

  if (Number.isFinite(timestamp)) {
    return timestamp
  }

  return undefined
}

async function getTimestampForKey(key: string) {
  const timestampFromKey = parseTimestampFromKey(key)
  if (timestampFromKey !== undefined) {
    return timestampFromKey
  }

  const latestLog = await redis.lindex(key, 0)

  if (!latestLog) {
    return 0
  }

  let parsedLog: any

  try {
    parsedLog = typeof latestLog === 'string' ? JSON.parse(latestLog) : latestLog
  } catch (e) {
    return 0
  }

  const timestampCandidates = [
    parsedLog.response?.timestamp,
    parsedLog.response?.created,
    parsedLog.timestamp,
  ]

  for (const candidate of timestampCandidates) {
    const parsed = parseTimestamp(candidate)
    if (parsed !== undefined) {
      return parsed
    }
  }

  return 0
}

async function getSortedLogKeys() {
  const keys: LogKey[] = []
  let cursor = '0'

  const collectedKeys: string[] = []

  do {
    const [nextCursor, batch] = await redis.scan(cursor, {
      match: 'logs:*',
      count: 100,
    })

    collectedKeys.push(...batch)
    cursor = nextCursor
  } while (cursor !== '0')

  const keysWithTimestamps = await Promise.all(
    collectedKeys.map(async (key) => ({
      key,
      timestamp: await getTimestampForKey(key),
    })),
  )

  for (const item of keysWithTimestamps) {
    keys.push(item)
  }

  return keys.sort((a, b) => b.timestamp - a.timestamp)
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

  const sortedKeys = await getSortedLogKeys()
  const totalPages = Math.max(1, Math.ceil(sortedKeys.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const pageKeys = sortedKeys.slice(startIndex, startIndex + pageSize)

  const conversations = await Promise.all(
    pageKeys.map(async ({ key, timestamp }) => {
      const logs: Array<LogStep> = await redis.lrange(key, 0, -1)
      const date = new Date(timestamp)

      return {
        id: key,
        timestamp,
        date,
        logs,
      }
    }),
  )

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
          {sortedKeys.length === 0 ? (
            'No conversations yet'
          ) : (
            <>
              Showing{' '}
              <span className="font-medium">
                {startIndex + 1}–
                {Math.min(startIndex + conversations.length, sortedKeys.length)}
              </span>{' '}
              of <span className="font-medium">{sortedKeys.length}</span> conversations
            </>
          )}
        </div>

        {sortedKeys.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={buildPageHref(Math.max(1, currentPage - 1))}
              className={`px-3 py-1 rounded border transition-colors ${
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
              className={`px-3 py-1 rounded border transition-colors ${
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
              className="border rounded-lg p-4 bg-white shadow"
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
                const firstLog = conversation.logs[0]
                let parsedFirstLog: LogStep

                try {
                  parsedFirstLog =
                    typeof firstLog === 'string'
                      ? JSON.parse(firstLog)
                      : firstLog
                } catch (e) {
                  return (
                    <div className="p-3 bg-gray-50 rounded">
                      Failed to parse conversation data
                    </div>
                  )
                }

                let fullConversation: any[] = []
                if (parsedFirstLog.request?.body) {
                  try {
                    const requestBody = JSON.parse(parsedFirstLog.request.body)
                    if (
                      requestBody.messages &&
                      Array.isArray(requestBody.messages)
                    ) {
                      fullConversation = requestBody.messages
                    }
                  } catch (e) {
                    console.error('Failed to parse request body', e)
                  }
                }

                if (fullConversation.length === 0) {
                  return (
                    <div className="space-y-3">
                      {conversation.logs.map((log, index) => {
                        let parsedLog: LogStep
                        try {
                          parsedLog =
                            typeof log === 'string' ? JSON.parse(log) : log
                        } catch (e) {
                          return (
                            <div key={index} className="p-3 bg-gray-50 rounded">
                              <pre className="whitespace-pre-wrap text-sm">
                                {typeof log === 'string'
                                  ? log
                                  : JSON.stringify(log, null, 2)}
                              </pre>
                            </div>
                          )
                        }

                        return (
                          <div key={index} className="p-3 bg-gray-50 rounded">
                            <details>
                              <summary className="cursor-pointer font-medium mb-2">
                                {parsedLog.stepType || 'Log Entry'}{' '}
                                {parsedLog.text
                                  ? `- ${parsedLog.text.substring(0, 50)}...`
                                  : ''}
                              </summary>
                              <div className="space-y-3">
                                <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
                                  {JSON.stringify(parsedLog, null, 2)}
                                </pre>
                              </div>
                            </details>
                          </div>
                        )
                      })}
                    </div>
                  )
                }

                const toolCalls: ToolCall[] = []
                const toolResults: ToolResult[] = []

                conversation.logs.forEach((log) => {
                  try {
                    const parsedLog =
                      typeof log === 'string' ? JSON.parse(log) : log
                    if (parsedLog.toolCalls && parsedLog.toolCalls.length > 0) {
                      toolCalls.push(...parsedLog.toolCalls)
                    }
                    if (
                      parsedLog.toolResults &&
                      parsedLog.toolResults.length > 0
                    ) {
                      toolResults.push(...parsedLog.toolResults)
                    }
                  } catch (e) {}
                })

                const lastLog = conversation.logs[conversation.logs.length - 1]
                let finalTextResponse = ''
                try {
                  const parsedLastLog =
                    typeof lastLog === 'string' ? JSON.parse(lastLog) : lastLog
                  if (parsedLastLog.text) {
                    finalTextResponse = parsedLastLog.text
                  }
                } catch (e) {}

                return (
                  <div className="space-y-4">
                    {fullConversation.map((message, index) => {
                      if (message.role === 'system') {
                        return null
                      }

                      const isUser = message.role === 'user'
                      const isAssistant = message.role === 'assistant'
                      const isTool = message.role === 'tool'

                      return (
                        <div key={index} className="space-y-2">
                          {isUser && (
                            <div className="whitespace-pre-wrap flex justify-end">
                              <div className="max-w-full px-4 py-2 rounded-lg shadow-sm border text-sm bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700">
                                <div className="font-semibold mb-1 opacity-70 text-xs">
                                  User
                                </div>
                                <div>{message.content}</div>
                              </div>
                            </div>
                          )}

                          {isAssistant && (
                            <div className="whitespace-pre-wrap flex justify-start">
                              <div className="max-w-full px-4 py-2 rounded-lg shadow-sm border text-sm bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
                                <div className="font-semibold mb-1 opacity-70 text-xs">
                                  AI
                                </div>

                                {message.content && (
                                  <div className="mb-2">{message.content}</div>
                                )}

                                {message.tool_calls &&
                                  message.tool_calls.map(
                                    (toolCall: any, toolIndex: number) => {
                                      const toolName = toolCall.function?.name
                                      const args = toolCall.function?.arguments
                                        ? JSON.parse(
                                            toolCall.function.arguments,
                                          )
                                        : {}

                                      return (
                                        <div
                                          key={`tool-${index}-${toolIndex}`}
                                          className="my-2 p-2 rounded bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100"
                                        >
                                          <div className="flex items-start gap-2">
                                            <div className="flex-1">
                                              <div className="text-sm text-yellow-700 dark:text-yellow-200">
                                                <span className="font-medium">
                                                  {toolName}
                                                </span>
                                              </div>
                                              {args &&
                                                Object.keys(args).length >
                                                  0 && (
                                                  <div className="mt-1 text-xs text-yellow-800 dark:text-yellow-300">
                                                    with parameters:{' '}
                                                    {Object.entries(args).map(
                                                      ([key, value]) => (
                                                        <span
                                                          key={key}
                                                          className="inline-block mr-2"
                                                        >
                                                          <span className="font-medium">
                                                            {key}
                                                          </span>
                                                          :{' '}
                                                          {JSON.stringify(
                                                            value,
                                                          )}
                                                        </span>
                                                      ),
                                                    )}
                                                  </div>
                                                )}
                                            </div>
                                          </div>
                                          <details className="mt-1">
                                            <summary className="text-xs text-yellow-700 dark:text-yellow-200 cursor-pointer hover:text-yellow-900 dark:hover:text-yellow-100">
                                              View technical details
                                            </summary>
                                            <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-800 rounded text-xs overflow-x-auto">
                                              <div className="font-mono">
                                                <div>ID: {toolCall.id}</div>
                                                <div>Tool: {toolName}</div>
                                                {args && (
                                                  <div>
                                                    Args:{' '}
                                                    <pre className="mt-1">
                                                      {JSON.stringify(
                                                        args,
                                                        null,
                                                        2,
                                                      )}
                                                    </pre>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </details>
                                        </div>
                                      )
                                    },
                                  )}
                              </div>
                            </div>
                          )}

                          {isTool && (
                            <div className="whitespace-pre-wrap flex justify-start">
                              <div className="max-w-full px-4 py-2 rounded-lg shadow-sm border text-sm bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
                                <div className="font-semibold mb-1 opacity-70 text-xs">
                                  Tool Result
                                </div>
                                <div className="my-2 p-2 rounded bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-900 dark:text-green-100">
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1">
                                      {(() => {
                                        try {
                                          const result = JSON.parse(
                                            message.content,
                                          )
                                          if (result.message) {
                                            return (
                                              <div className="text-sm text-green-700 dark:text-green-200">
                                                {result.message}
                                              </div>
                                            )
                                          }
                                          return (
                                            <div className="text-sm text-green-700 dark:text-green-200">
                                              Tool completed successfully
                                            </div>
                                          )
                                        } catch (e) {
                                          return (
                                            <div className="text-sm text-green-700 dark:text-green-200">
                                              {message.content}
                                            </div>
                                          )
                                        }
                                      })()}
                                    </div>
                                  </div>
                                  <details className="mt-1">
                                    <summary className="text-xs text-green-700 dark:text-green-200 cursor-pointer hover:text-green-900 dark:hover:text-green-100">
                                      View response details
                                    </summary>
                                    <div className="mt-2 p-2 bg-green-100 dark:bg-green-800 rounded text-xs overflow-x-auto">
                                      <div className="font-mono">
                                        <div>ID: {message.tool_call_id}</div>
                                        <pre className="mt-1">
                                          {message.content}
                                        </pre>
                                      </div>
                                    </div>
                                  </details>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {finalTextResponse &&
                      !fullConversation.some(
                        (m) =>
                          m.role === 'assistant' &&
                          m.content === finalTextResponse,
                      ) && (
                        <div className="whitespace-pre-wrap flex justify-start">
                          <div className="max-w-full px-4 py-2 rounded-lg shadow-sm border text-sm bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
                            <div className="font-semibold mb-1 opacity-70 text-xs">
                              AI
                            </div>
                            <div>{finalTextResponse}</div>
                          </div>
                        </div>
                      )}

                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                        View Raw Conversation Data
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                        <pre className="whitespace-pre-wrap text-xs overflow-x-auto">
                          {JSON.stringify(conversation.logs, null, 2)}
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
