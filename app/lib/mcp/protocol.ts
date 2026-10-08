import { McpError } from '@modelcontextprotocol/sdk/types.js'
import z from 'zod/v3'
import type { McpAccess } from './access'
import { eventMethod, type EventOptions } from './events-http'

export const MCP_VERSION = '2026-07-28'
export const SERVER_INFO = { name: 'mxstbr-mcp', version: '2.0.0' }
const VERSION = 'io.modelcontextprotocol/protocolVersion'
const CAPABILITIES = 'io.modelcontextprotocol/clientCapabilities'
const legacyVersions = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05']
const envelope = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number().int()]),
  method: z.string(),
  params: z.record(z.unknown()).optional(),
})
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const mismatch = () => new McpError(-32020, 'Header mismatch')
function decodeHeader(value: string | null) {
  if (value === null) throw mismatch()
  if (value.startsWith('=?base64?') && value.endsWith('?=')) {
    const encoded = value.slice(9, -2),
      bytes = Buffer.from(encoded, 'base64')
    if (bytes.toString('base64') !== encoded) throw mismatch()
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    } catch {
      throw mismatch()
    }
  }
  if (!/^[\x20-\x7e\t]*$/.test(value) || value.trim() !== value)
    throw mismatch()
  return value
}
export type ProtocolOptions = EventOptions & {
  access: McpAccess | null
  instructions: string
  tools: (
    method: string,
    params: Record<string, unknown>,
    signal: AbortSignal,
  ) => Promise<Record<string, unknown>>
}

// The installed SDK serves legacy MCP. This narrow, stateless adapter adds
// 2026-07-28 for the tools/events we expose, delegating tool execution to that
// SDK rather than duplicating schemas or invoking private SDK internals.
export async function handleMcpProtocol(
  request: Request,
  options: ProtocolOptions,
): Promise<Response | null> {
  const versionHeader = request.headers.get('mcp-protocol-version')
  let modern = Boolean(versionHeader && !legacyVersions.includes(versionHeader))
  if (request.method !== 'POST')
    return modern
      ? new Response(null, { status: 405, headers: { Allow: 'POST' } })
      : null
  let body: unknown
  try {
    body = await request.clone().json()
  } catch {
    return modern
      ? Response.json(
          {
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: 'Parse error' },
          },
          { status: 400 },
        )
      : null
  }
  if (object(body)) {
    const params = body.params
    modern ||=
      body.method === 'server/discover' ||
      (object(params) &&
        object(params._meta) &&
        typeof params._meta[VERSION] === 'string')
  }
  const events =
    object(body) &&
    typeof body.method === 'string' &&
    body.method.startsWith('events/')
  if (!modern && !events) return null
  let id: string | number | null = null
  try {
    const parsed = envelope.safeParse(body)
    if (!parsed.success) throw new McpError(-32600, 'Invalid Request')
    const { method, params = {} } = parsed.data
    id = parsed.data.id
    const origin = request.headers.get('origin')
    if (
      origin &&
      ![
        new URL(request.url).origin,
        'https://chatgpt.com',
        'https://chat.openai.com',
      ].includes(origin)
    )
      return new Response('Forbidden origin', { status: 403 })
    if (!options.access) throw new McpError(-32012, 'Forbidden')
    if (modern) {
      const meta = params._meta
      if (!versionHeader || request.headers.get('mcp-method') !== method)
        throw mismatch()
      if (
        !object(meta) ||
        typeof meta[VERSION] !== 'string' ||
        !object(meta[CAPABILITIES])
      )
        throw new McpError(-32602, 'Missing request metadata')
      if (meta[VERSION] !== versionHeader) throw mismatch()
      if (versionHeader !== MCP_VERSION)
        throw new McpError(-32022, 'Unsupported protocol version', {
          supported: [MCP_VERSION, ...legacyVersions],
          requested: versionHeader,
        })
      if (
        ['tools/call', 'resources/read', 'prompts/get'].includes(method) &&
        decodeHeader(request.headers.get('mcp-name')) !==
          (method === 'resources/read' ? params.uri : params.name)
      )
        throw mismatch()
    }
    let result: Record<string, unknown>
    if (method === 'server/discover')
      result = {
        supportedVersions: [MCP_VERSION, ...legacyVersions],
        capabilities: { tools: {}, events: {} },
        instructions: options.instructions,
      }
    else if (events)
      result = (await eventMethod(
        method,
        params,
        options.access,
        modern,
        options,
      )) as Record<string, unknown>
    else if (method === 'tools/list' || method === 'tools/call')
      result = await options.tools(method, params, request.signal)
    else if (method === 'ping') result = {}
    else throw new McpError(-32601, 'Method not found')
    return Response.json(
      {
        jsonrpc: '2.0',
        id,
        result: modern
          ? {
              ...result,
              resultType: 'complete',
              _meta: {
                ...(result._meta as object),
                'io.modelcontextprotocol/serverInfo': SERVER_INFO,
              },
            }
          : result,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    const rpc =
      error instanceof McpError
        ? {
            code: error.code,
            message: error.message.replace(/^MCP error -?\d+: /, ''),
            ...(error.data === undefined ? {} : { data: error.data }),
          }
        : { code: -32603, message: 'MCP is temporarily unavailable.' }
    const status =
      rpc.code === -32012
        ? !modern && process.env.NODE_ENV === 'development'
          ? 200
          : 401
        : modern && rpc.code === -32601
          ? 404
          : modern && [-32020, -32022, -32600, -32602].includes(rpc.code)
            ? 400
            : 200
    return Response.json(
      { jsonrpc: '2.0', id, error: rpc },
      { status, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
