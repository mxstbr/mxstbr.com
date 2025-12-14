import type { Tool, ToolCallOptions } from 'ai'

type ExtendedToolOptions = ToolCallOptions & {
  mcp?: boolean
}

type McpToolResponse = {
  content: Array<{ type: 'text'; text: string }>
  structuredContent: Record<string, unknown> | undefined
  _meta?: Record<string, unknown>
}

type ExtendedTool<TInput = any, TOutput = any> = Tool<
  TInput,
  McpToolResponse
> & {
  _meta?: Record<string, any>
}

function isAsyncIterable<T>(value: unknown): value is AsyncIterable<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    Symbol.asyncIterator in (value as Record<symbol, unknown>)
  )
}

async function resolveResult<T>(output: T | AsyncIterable<T>): Promise<T> {
  if (isAsyncIterable(output)) {
    const items: T[] = []
    for await (const item of output) {
      items.push(item)
    }
    return items.length === 1 ? items[0] : (items as unknown as T)
  }
  return output
}

export function tool<TInput = any, TStructuredContent = any>(
  toolDef: ExtendedTool<TInput, McpToolResponse>,
): Tool<TInput, TStructuredContent> {
  // Store reference to original execute function before we overwrite it
  const originalExecute = toolDef.execute
  if (!originalExecute) {
    throw new Error('Tool does not have an execute function')
  }

  const execute = async (
    args: TInput,
    options?: ExtendedToolOptions,
  ): Promise<
    TStructuredContent | AsyncIterable<TStructuredContent> | McpToolResponse
  > => {
    const rawResult = await originalExecute(
      args,
      options ?? ({ toolCallId: '', messages: [] } as ToolCallOptions),
    )
    const result = await resolveResult(rawResult)

    // If MCP mode is enabled, return the full MCP-style response
    if (options?.mcp) {
      return result
    }

    // Otherwise, extract and return just the structuredContent for AI SDK compatibility
    return (result.structuredContent ?? {}) as TStructuredContent
  }

  return Object.assign({ ...toolDef }, { execute }) as Tool<
    TInput,
    TStructuredContent
  >
}
