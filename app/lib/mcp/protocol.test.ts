import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  handleMcpProtocol,
  MCP_VERSION,
  type ProtocolOptions,
} from './protocol'
import { eventName, pebblePrincipal, secret } from '../pebble/config'
import { resolveMcpAccess, requireOwner, withMcpAccess } from './access'
import { MemoryRecordings, MemoryWebhooks } from '../pebble/test-support'
import { PebbleEvents } from '../pebble/events'
import { EventWebhooks } from './event-webhooks'
import type { PebbleRecord } from '../pebble/repository'

process.env.PEBBLE_INDEX_SECRET = 'test-only-root-key'
const meta = {
  'io.modelcontextprotocol/protocolVersion': MCP_VERSION,
  'io.modelcontextprotocol/clientCapabilities': {},
}
function request(
  method: string,
  params: Record<string, unknown> = {},
  headers: Record<string, string> = {},
) {
  return new Request('https://mxstbr.com/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'MCP-Protocol-Version': MCP_VERSION,
      'Mcp-Method': method,
      ...(method === 'tools/call' ? { 'Mcp-Name': String(params.name) } : {}),
      ...headers,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 7,
      method,
      params: { _meta: meta, ...params },
    }),
  })
}
function options(owner: 'max' | 'sue' = 'max'): ProtocolOptions {
  return {
    access: {
      family: false,
      owners: [owner],
      principal: pebblePrincipal(owner),
    },
    instructions: 'personal test',
    tools: async () => ({ content: [] }),
  }
}
async function call(req: Request, opts = options()) {
  const response = await handleMcpProtocol(req, opts)
  assert(response)
  return { status: response.status, ...(await response.json()) }
}

test('MCP 2.0 discovers tools and events without initialize; account event catalogs are isolated', async () => {
  const discovered = await call(request('server/discover'))
  assert.equal(discovered.result.resultType, 'complete')
  assert(discovered.result.supportedVersions.includes(MCP_VERSION))
  assert.deepEqual(discovered.result.capabilities.events, {})
  assert.equal(
    discovered.result._meta['io.modelcontextprotocol/serverInfo'].name,
    'mxstbr-mcp',
  )
  for (const owner of ['max', 'sue'] as const) {
    const listed = await call(request('events/list'), options(owner))
    assert.deepEqual(
      listed.result.events.map((e: any) => e.name),
      [eventName(owner)],
    )
    assert.deepEqual(listed.result.events[0].delivery, ['webhook'])
    const forbidden = await call(
      request('events/subscribe', {
        name: eventName(owner === 'max' ? 'sue' : 'max'),
      }),
      options(owner),
    )
    assert.equal(forbidden.error.code, -32011)
  }
  const family = options()
  family.access = {
    principal: 'family-test',
    family: true,
    owners: ['max', 'sue'],
  }
  const listed = await call(request('events/list'), family)
  assert.deepEqual(
    listed.result.events.map((e: any) => e.name),
    ['chores.notification', eventName('max'), eventName('sue')],
  )
})

test('modern HTTP checks auth, versions, mirrored headers, metadata, origins and unsupported methods', async () => {
  const unauthenticated = options()
  unauthenticated.access = null
  assert.equal(
    (await call(request('events/list'), unauthenticated)).status,
    401,
  )
  for (const req of [
    request(
      'tools/call',
      { name: 'pebble_get_recording' },
      { 'Mcp-Name': 'different' },
    ),
    request('tools/list', {}, { 'Mcp-Method': 'events/list' }),
    request('server/discover', {}, { 'MCP-Protocol-Version': '1900-01-01' }),
  ]) {
    const response = await call(req)
    assert.equal(response.status, 400)
    assert.equal(response.error.code, -32020)
  }
  const missing = request('server/discover')
  missing.headers.delete('Mcp-Method')
  assert.equal((await call(missing)).error.code, -32020)
  assert.equal(
    (await call(request('server/discover', { _meta: {} }))).error.code,
    -32602,
  )
  const unsupported = await call(
    request(
      'server/discover',
      {
        _meta: {
          ...meta,
          'io.modelcontextprotocol/protocolVersion': '2099-01-01',
        },
      },
      { 'MCP-Protocol-Version': '2099-01-01' },
    ),
  )
  assert.equal(unsupported.status, 400)
  assert.equal(unsupported.error.code, -32022)
  assert.equal((await call(request('unknown/method'))).status, 404)
  assert.equal((await call(request('events/poll'))).error.code, -32014)
  assert.equal((await call(request('events/stream'))).error.code, -32014)
  const origin = await handleMcpProtocol(
    request('tools/list', {}, { Origin: 'https://attacker.example' }),
    options(),
  )
  assert.equal(origin?.status, 403)
  const encoded = request(
    'tools/call',
    { name: 'example' },
    { 'Mcp-Name': '=?base64?ZXhhbXBsZQ==?=' },
  )
  assert.equal((await call(encoded)).result.resultType, 'complete')
  assert.equal(
    (
      await handleMcpProtocol(
        new Request('https://mxstbr.com/api/mcp', {
          headers: { 'MCP-Protocol-Version': MCP_VERSION },
        }),
        options(),
      )
    )?.status,
    405,
  )
})

test('legacy initialization stays with SDK, legacy events still work', async () => {
  const req = new Request('https://mxstbr.com/api/mcp', {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {},
    }),
  })
  assert.equal(await handleMcpProtocol(req, options()), null)
  const events = new Request('https://mxstbr.com/api/mcp', {
    method: 'POST',
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'events/list' }),
  })
  const result = await call(events)
  assert.equal(result.result.resultType, undefined)
  assert.equal(result.result.events[0].name, eventName('max'))
})

test('modern subscribe verifies, refreshes, survives worker recreation and idempotently unsubscribes', async () => {
  const now = Date.now(),
    journal = new MemoryRecordings(),
    store = new MemoryWebhooks<PebbleRecord>(() => now)
  let verified = 0,
    drains = 0
  const opts = options()
  opts.pebble = (owner) =>
    new EventWebhooks(
      new PebbleEvents(owner, journal, () => now),
      store,
      async (request) => {
        verified++
        return {
          status: 200,
          body: JSON.stringify({
            challenge: JSON.parse(request.body).challenge,
          }),
        }
      },
      () => now,
      () => true,
    )
  opts.afterSubscribe = () => {
    drains++
  }
  const input = {
    name: eventName('max'),
    delivery: {
      mode: 'webhook',
      url: 'https://receiver.example/max',
      secret: `whsec_${Buffer.alloc(32, 8).toString('base64')}`,
    },
  }
  const a = await call(request('events/subscribe', input), opts)
  const b = await call(request('events/subscribe', input), opts)
  assert.equal(a.result.id, b.result.id)
  assert.equal(verified, 1)
  assert.equal(drains, 2)
  assert.equal(store.states.get(a.result.id)?.controls, false)
  for (let i = 0; i < 2; i++)
    assert.equal(
      (await call(request('events/unsubscribe', input), opts)).result
        .resultType,
      'complete',
    )
  assert.equal(store.states.size, 0)
})

test('scoped MCP tokens cannot become family credentials or cross the recording ownership boundary', () => {
  for (const owner of ['max', 'sue'] as const) {
    const access = resolveMcpAccess(
      new Request('https://mxstbr.com/api/mcp', {
        headers: { Authorization: `Bearer ${secret(owner, 'mcp')}` },
      }),
    )
    assert(access)
    assert.equal(access.family, false)
    assert.deepEqual(access.owners, [owner])
    withMcpAccess(access, () => {
      requireOwner(owner)
      assert.throws(() => requireOwner(owner === 'max' ? 'sue' : 'max'))
    })
    assert.equal(
      resolveMcpAccess(
        new Request(`https://mxstbr.com/api/mcp?pwd=${secret(owner, 'mcp')}`),
      ),
      null,
    )
  }
  assert.equal(
    resolveMcpAccess(
      new Request('https://mxstbr.com/api/mcp', {
        headers: { Cookie: 'password=fake' },
      }),
    ),
    null,
  )
})
