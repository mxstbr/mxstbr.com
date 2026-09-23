import { McpError } from '@modelcontextprotocol/sdk/types.js'
import { setTimeout as delay } from 'node:timers/promises'
import z from 'zod/v3'
import {
  ChoreEvents,
  checkEventName,
  choreEventDescriptor,
  eventCursor,
  eventOccurrence,
  eventParams,
  invalidParams,
  parseEventParams,
  pollParams,
} from './events'

type RpcId = string | number
const envelope = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number().int()]),
  method: z.string(),
  params: z.unknown().optional(),
})
const listParams = z.object({ cursor: z.string().optional() }).optional()
const SUBSCRIPTION_ID = 'io.modelcontextprotocol/subscriptionId'
type Options = {
  events: () => ChoreEvents
  authorize: () => void
  // Bounded streams reconnect with their cursor before the serverless timeout.
  streamDurationMs?: number
  checkIntervalMs?: number
  heartbeatMs?: number
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
function rpcResult(id: RpcId, result: unknown) {
  return Response.json(
    { jsonrpc: '2.0', id, result },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

// The installed mcp-handler shares one stateless SDK transport and does not
// forward HTTP cancellation into long-lived handlers. Keep event SSE scoped to
// the actual request so two clients using the same JSON-RPC id cannot mix streams.
// The existing handler continues serving initialize and all ordinary MCP tools.
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
    options.authorize()
    const { method, params } = parsed.data
    if (method === 'events/list') {
      const list = parseEventParams(listParams, params)
      // This fixed catalog has one page and never issues pagination cursors.
      if (list?.cursor !== undefined) throw invalidParams()
      return rpcResult(id, { events: [choreEventDescriptor] })
    }
    if (method === 'events/poll') {
      const input = parseEventParams(pollParams, params)
      const { records: _, ...result } = await options.events().poll(input)
      return rpcResult(id, result)
    }
    if (method === 'events/stream') {
      const input = parseEventParams(eventParams, params)
      checkEventName(input.name)
      if (!request.headers.get('accept')?.includes('text/event-stream'))
        return Response.json(
          {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32600,
              message: 'Accept must include text/event-stream.',
            },
          },
          { status: 406 },
        )
      const events = options.events()
      // Validate access, arguments and cursor before opening the stream.
      const initial = await events.poll(input)
      return eventStream(request, id, input, initial, events, options)
    }
    if (method === 'events/subscribe' || method === 'events/unsubscribe')
      throw new McpError(-32014, 'Unsupported', {
        feature: 'deliveryMode',
        value: 'webhook',
      })
    throw new McpError(-32601, 'Method not found')
  } catch (error) {
    return Response.json(
      { jsonrpc: '2.0', id, error: protocolError(error) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }
}

type Batch = Awaited<ReturnType<ChoreEvents['poll']>>
function eventStream(
  request: Request,
  id: RpcId,
  input: z.output<typeof eventParams>,
  initial: Batch,
  events: ChoreEvents,
  options: Options,
) {
  const stopped = new AbortController()
  const abort = () => stopped.abort()
  request.signal.addEventListener('abort', abort, { once: true })
  if (request.signal.aborted) abort()
  const encoder = new TextEncoder()
  const duration = options.streamDurationMs ?? 55000
  const checkInterval = options.checkIntervalMs ?? 2000
  const heartbeat = options.heartbeatMs ?? 15000
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (value: unknown) => {
        if (!stopped.signal.aborted)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(value)}\n\n`),
          )
      }
      const notify = (kind: string, params: Record<string, unknown>) =>
        write({
          jsonrpc: '2.0',
          method: `notifications/events/${kind}`,
          params: { ...params, _meta: { [SUBSCRIPTION_ID]: id } },
        })
      void (async () => {
        const deadline = Date.now() + duration
        let batch = initial
        let cursor = input.cursor
        let first = true
        let terminated = false
        let lastHeartbeat = Date.now()
        try {
          while (!stopped.signal.aborted && Date.now() < deadline) {
            try {
              options.authorize()
              if (!first)
                batch = await events.poll({
                  name: input.name,
                  arguments: input.arguments,
                  cursor,
                })
              if (stopped.signal.aborted) break
              if (first || batch.truncated) {
                // An active cursor cannot jump past events we have yet to send.
                const before = batch.records.length
                  ? eventCursor(batch.records[0].position - 1)
                  : batch.cursor
                notify('active', { cursor: before, truncated: batch.truncated })
              }
              first = false
              for (const record of batch.records) {
                notify('event', {
                  ...eventOccurrence(record),
                  cursor: eventCursor(record.position),
                })
              }
              cursor = batch.cursor
              if (batch.hasMore) continue
            } catch (error) {
              if (stopped.signal.aborted) break
              const value = protocolError(error)
              if ([-32011, -32012, -32014].includes(value.code)) {
                notify('terminated', { error: value })
                terminated = true
                break
              }
              notify('error', { error: value })
            }
            if (Date.now() - lastHeartbeat >= heartbeat) {
              notify('heartbeat', { cursor })
              lastHeartbeat = Date.now()
            }
            await delay(
              Math.min(checkInterval, Math.max(0, deadline - Date.now())),
              undefined,
              { signal: stopped.signal },
            )
          }
          if (!stopped.signal.aborted) {
            // Send the final checked position even on a quiet connection.
            if (!terminated) notify('heartbeat', { cursor })
            write({ jsonrpc: '2.0', id, result: { _meta: {} } })
          }
        } catch (error) {
          if (!stopped.signal.aborted) controller.error(error)
        } finally {
          request.signal.removeEventListener('abort', abort)
          try {
            controller.close()
          } catch {}
          stopped.abort()
        }
      })()
    },
    cancel() {
      abort()
    },
  })
  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
