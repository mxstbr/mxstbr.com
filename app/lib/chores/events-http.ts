import { McpError } from '@modelcontextprotocol/sdk/types.js'
import z from 'zod/v3'
import { choreEventDescriptor, invalidParams, parseEventParams } from './events'
import type { ChoreWebhooks } from './webhooks'

type RpcId = string | number
const envelope = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number().int()]),
  method: z.string(),
  params: z.unknown().optional(),
})
const listParams = z.object({ cursor: z.string().optional() }).optional()
type Options = {
  principal: () => string
  webhooks: () => ChoreWebhooks
  afterSubscribe?: () => void
}
function protocolError(error: unknown) {
  if (error instanceof McpError)
    return {
      code: error.code,
      message: error.message.replace(/^MCP error -?\d+: /, ''),
      ...(error.data === undefined ? {} : { data: error.data }),
    }
  return { code: -32603, message: 'Chores events are temporarily unavailable.' }
}

// The draft methods are not implemented by the installed MCP SDK. Keep them
// alongside the existing authenticated handler; tools and initialization still
// use the SDK transport. There is no public polling or SSE Events adapter.
export async function handleChoreEvents(
  request: Request,
  options: Options,
): Promise<Response | null> {
  if (request.method !== 'POST') return null
  let body: unknown
  try {
    body = await request.clone().json()
  } catch {
    return null
  }
  if (
    !body ||
    typeof body !== 'object' ||
    !('method' in body) ||
    typeof body.method !== 'string' ||
    !body.method.startsWith('events/')
  )
    return null
  let id: RpcId | null = null
  try {
    const parsed = envelope.safeParse(body)
    if (!parsed.success) throw new McpError(-32600, 'Invalid Request')
    id = parsed.data.id
    const principal = options.principal()
    const { method, params } = parsed.data
    let result: unknown
    if (method === 'events/list') {
      const list = parseEventParams(listParams, params)
      if (list?.cursor !== undefined) throw invalidParams()
      result = { events: [choreEventDescriptor] }
    } else if (method === 'events/subscribe') {
      result = await options.webhooks().subscribe(principal, params)
      options.afterSubscribe?.()
    } else if (method === 'events/unsubscribe') {
      result = await options.webhooks().unsubscribe(principal, params)
    } else if (method === 'events/poll' || method === 'events/stream') {
      throw new McpError(-32014, 'Unsupported', {
        feature: 'deliveryMode',
        value: method === 'events/poll' ? 'poll' : 'push',
      })
    } else throw new McpError(-32601, 'Method not found')
    return Response.json(
      { jsonrpc: '2.0', id, result },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return Response.json(
      { jsonrpc: '2.0', id, error: protocolError(error) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
