import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { McpError } from '@modelcontextprotocol/sdk/types.js'
import { fixture } from './fixtures'
import { MemoryRepository } from './repository'
import { notify } from './domain'
import { ChoresService } from './service'
import { CHORE_EVENT, ChoreEvents, cursorPosition, eventCursor } from './events'
import { handleChoreEvents } from './events-http'
import { ChoreWebhooks, subscriptionId } from './webhooks'
import {
  CallbackFailure,
  callbackUrl,
  publicAddress,
  resolveCallback,
  secretBytes,
  sendCallback,
  webhookHeaders,
  type CallbackRequest,
  type SendCallback,
} from './webhook-http'
import type {
  SubscriptionLease,
  WebhookStore,
  WebhookSubscription,
} from './webhook-store'
import { mcpEventPrincipal, webhookPrincipalAllowed } from './webhook-auth'

const NOW = Date.parse('2026-09-09T15:00:00Z')
const SECRET = `whsec_${Buffer.alloc(32, 17).toString('base64')}`
const NEW_SECRET = `whsec_${Buffer.alloc(32, 29).toString('base64')}`
const INPUT = {
  name: CHORE_EVENT,
  arguments: {},
  delivery: {
    mode: 'webhook',
    url: 'https://receiver.example/hooks/chores',
    secret: SECRET,
  },
}

class MemoryWebhookStore implements WebhookStore {
  states = new Map<string, WebhookSubscription>()
  verifiedKeys = new Set<string>()
  rates = new Map<string, number>()
  locks = new Map<string, Promise<void>>()
  constructor(readonly now: () => number) {}
  async withLease<T>(
    id: string,
    wait: boolean,
    operation: (lease: SubscriptionLease) => Promise<T>,
  ) {
    while (this.locks.has(id)) {
      if (!wait) return undefined
      await this.locks.get(id)
    }
    let release!: () => void
    this.locks.set(
      id,
      new Promise<void>((resolve) => {
        release = resolve
      }),
    )
    try {
      return await operation({
        read: async () => {
          const state = this.states.get(id)
          return state && state.expiresAt > this.now()
            ? structuredClone(state)
            : null
        },
        save: async (state) => {
          this.states.set(id, structuredClone(state))
        },
        remove: async () => {
          this.states.delete(id)
        },
      })
    } finally {
      this.locks.delete(id)
      release()
    }
  }
  async activeIds() {
    return Array.from(this.states.values())
      .filter((s) => s.expiresAt > this.now())
      .map((s) => s.id)
  }
  async verified(key: string) {
    return this.verifiedKeys.has(key)
  }
  async markVerified(key: string) {
    this.verifiedKeys.add(key)
  }
  async claimVerification(host: string) {
    if ((this.rates.get(host) || 0) > this.now()) return false
    this.rates.set(host, this.now() + 10000)
    return true
  }
}
function signatureValid(request: CallbackRequest, secret = SECRET) {
  const headers = request.headers
  const expected = createHmac('sha256', Buffer.from(secret.slice(6), 'base64'))
    .update(
      `${headers['webhook-id']}.${headers['webhook-timestamp']}.${request.body}`,
    )
    .digest('base64')
  return headers['webhook-signature'].split(' ').includes(`v1,${expected}`)
}
function setup() {
  let time = NOW,
    allowed = true
  const f = fixture(),
    repo = new MemoryRepository(f.core, f.days)
  const now = () => time,
    store = new MemoryWebhookStore(now)
  const calls: CallbackRequest[] = []
  let receiver: SendCallback = async () => ({ status: 200, body: '' })
  let challenge: SendCallback = async (request) => ({
    status: 200,
    body: JSON.stringify({ challenge: JSON.parse(request.body).challenge }),
  })
  const send: SendCallback = async (request) => {
    calls.push(request)
    assert(
      signatureValid(request) || signatureValid(request, NEW_SECRET),
      'The receiver must authenticate the raw request',
    )
    assert.equal(request.headers['Content-Type'], 'application/json')
    assert(request.headers['X-MCP-Subscription-Id'].startsWith('sub_'))
    return JSON.parse(request.body).type === 'verification'
      ? challenge(request)
      : receiver(request)
  }
  const events = new ChoreEvents(repo, now)
  const accepts = () => allowed
  const hooks = new ChoreWebhooks(events, store, send, now, accepts)
  return {
    hooks,
    repo,
    store,
    calls,
    events,
    now,
    send,
    accepts,
    tick: (ms: number) => {
      time += ms
    },
    revoke: () => {
      allowed = false
    },
    receiver: (value: SendCallback) => {
      receiver = value
    },
    challenge: (value: SendCallback) => {
      challenge = value
    },
    emit: (text: string, at = time) =>
      repo.transact([], null, (tx) => notify(tx, text, new Date(at))),
  }
}
function request(method: string, params?: unknown) {
  return new Request('https://mxstbr.example/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 7, method, params }),
  })
}

test('MCP discovers only webhooks, rejects poll/push and keeps ordinary tools on their transport', async () => {
  const { hooks } = setup()
  const options = { principal: () => 'parent-a', webhooks: () => hooks }
  const call = async (method: string, params?: unknown) =>
    (await handleChoreEvents(request(method, params), options))!.json()
  assert.deepEqual((await call('events/list')).result.events[0].delivery, [
    'webhook',
  ])
  for (const [method, value] of [
    ['events/poll', 'poll'],
    ['events/stream', 'push'],
  ]) {
    assert.deepEqual((await call(method, { name: CHORE_EVENT })).error, {
      code: -32014,
      message: 'Unsupported',
      data: { feature: 'deliveryMode', value },
    })
  }
  const denied = await handleChoreEvents(request('events/subscribe', INPUT), {
    ...options,
    principal: () => {
      throw new McpError(-32012, 'Forbidden')
    },
  })
  assert.equal((await denied!.json()).error.code, -32012)
  assert.equal(await handleChoreEvents(request('tools/list'), options), null)
  assert.equal(
    (await call('events/list', { cursor: 'unknown' })).error.code,
    -32602,
  )
  assert.equal((await call('events/unknown')).error.code, -32601)
})

test('signed challenge precedes activation; real fixture commands fan out unchanged and deduplicate retries', async () => {
  const { hooks, repo, calls } = setup()
  const options = { principal: () => 'parent-a', webhooks: () => hooks }
  const subscribe = await (await handleChoreEvents(
    request('events/subscribe', INPUT),
    options,
  ))!.json()
  assert.equal(subscribe.result.cursor, eventCursor(0))
  assert.equal(subscribe.result.truncated, false)
  assert.equal(calls.length, 1)
  assert.equal(JSON.parse(calls[0].body).type, 'verification')
  assert(calls[0].headers['webhook-id'].startsWith('msg_verification_'))
  const service = new ChoresService(repo, () => new Date(NOW))
  const actor = {
    kind: 'kid' as const,
    id: 'fixture-ipad',
    kidIds: ['kid-1', 'kid-2', 'kid-3'],
  }
  const board = await service.getBoard(actor)
  const occurrenceId = board.kids.find((k) => k.id === 'kid-3')!.chores[0]
    .occurrenceId
  await service.execute(actor, 'webhook-command-once', {
    action: 'submit',
    occurrenceId,
  })
  await service.execute(actor, 'webhook-command-once', {
    action: 'submit',
    occurrenceId,
  })
  await Promise.all([hooks.drain(), hooks.drain()])
  assert.equal(calls.length, 2)
  const event = JSON.parse(calls[1].body)
  assert.equal(event.eventId, repo.notifications[0].id)
  assert.equal(event.data.text, repo.notifications[0].text)
  assert.equal(calls[1].headers['webhook-id'], event.eventId)
  assert.equal(event.cursor, eventCursor(1))
  const unsub = await handleChoreEvents(
    request('events/unsubscribe', {
      name: CHORE_EVENT,
      delivery: { url: INPUT.delivery.url },
    }),
    options,
  )
  assert.deepEqual((await unsub!.json()).result, {})
  assert.deepEqual(await hooks.drain(), { delivered: 0, failed: 0 })
})

test('failed endpoint verification and invalid parameters never activate delivery or expose response text', async () => {
  const s = setup()
  s.challenge(async () => ({
    status: 200,
    body: '{"challenge":"wrong", "private":"do not expose"}',
  }))
  await assert.rejects(
    s.hooks.subscribe('parent-a', INPUT),
    (error: McpError) => {
      assert.equal(error.code, -32015)
      assert.deepEqual(error.data, { reason: 'challenge_failed' })
      assert(!error.message.includes('private'))
      return true
    },
  )
  assert.equal(s.store.states.size, 0)
  await assert.rejects(
    s.hooks.subscribe('parent-a', INPUT),
    (error: McpError) => error.code === -32015,
  )
  assert.equal(
    s.calls.length,
    1,
    'Verification attempts are rate limited per host',
  )
  for (const delivery of [
    { ...INPUT.delivery, url: 'http://receiver.example/hook' },
    { ...INPUT.delivery, url: 'https://user:pass@receiver.example/hook' },
    { ...INPUT.delivery, url: 'https://receiver.example/hook#fragment' },
    { ...INPUT.delivery, secret: 'whsec_c2hvcnQ=' },
    {
      ...INPUT.delivery,
      secret: `whsec_${Buffer.alloc(65).toString('base64')}`,
    },
    { ...INPUT.delivery, secret: 'not-a-secret' },
  ])
    await assert.rejects(
      s.hooks.subscribe('parent-a', { ...INPUT, delivery }),
      (e: McpError) => e.code === -32602,
    )
  for (const extra of [
    { ttlMs: -1 },
    { ttlMs: 1.5 },
    { cursor: 'garbage' },
    { cursor: eventCursor(999) },
    { arguments: { kid: 'one' } },
  ])
    await assert.rejects(
      s.hooks.subscribe('parent-a', { ...INPUT, ...extra }),
      (e: McpError) => e.code === -32602,
    )
  await assert.rejects(
    s.hooks.subscribe('parent-a', { ...INPUT, name: 'unknown' }),
    (e: McpError) => e.code === -32011,
  )
  assert.equal(s.calls.length, 1)
})

test('independent retries retain a safe watermark when later deliveries succeed first', async () => {
  const s = setup(),
    start = await s.hooks.subscribe('parent-a', INPUT)
  await s.emit('First')
  await s.emit('Second')
  s.receiver(async (request) => ({
    status: JSON.parse(request.body).data.text === 'First' ? 503 : 200,
    body: 'private endpoint response',
  }))
  assert.deepEqual(await s.hooks.drain(), { delivered: 1, failed: 1 })
  const eventCalls = s.calls.slice(1)
  assert.equal(JSON.parse(eventCalls[1].body).cursor, start.cursor)
  const refresh = await s.hooks.subscribe('parent-a', {
    ...INPUT,
    cursor: eventCursor(2),
  })
  assert.equal(
    refresh.cursor,
    start.cursor,
    'Refresh cannot jump past an unacked event',
  )
  assert.equal(refresh.deliveryStatus!.lastError, 'http_5xx')
  await s.emit('Third')
  assert.deepEqual(await s.hooks.drain(), { delivered: 1, failed: 0 })
  const stillRetrying = await s.hooks.subscribe('parent-a', INPUT)
  assert.equal(stillRetrying.cursor, start.cursor)
  assert.equal(stillRetrying.deliveryStatus!.lastError, 'http_5xx')
  s.tick(60000)
  s.receiver(async () => ({ status: 204, body: '' }))
  assert.deepEqual(await s.hooks.drain(), { delivered: 1, failed: 0 })
  const retry = s.calls.at(-1)!
  assert.equal(retry.headers['webhook-id'], eventCalls[0].headers['webhook-id'])
  assert.notEqual(
    retry.headers['webhook-timestamp'],
    eventCalls[0].headers['webhook-timestamp'],
  )
  assert.notEqual(
    retry.headers['webhook-signature'],
    eventCalls[0].headers['webhook-signature'],
  )
  const current = await s.hooks.subscribe('parent-a', {
    ...INPUT,
    cursor: start.cursor,
  })
  assert.equal(current.id, start.id)
  assert.equal(current.cursor, eventCursor(3))
  assert.equal(current.deliveryStatus!.lastError, null)
  assert.equal(
    s.calls.filter((c) => JSON.parse(c.body).type === 'verification').length,
    1,
  )
})

test('subscriptions survive worker recreation, negotiate TTL, rotate secrets and replay after lapse', async () => {
  const s = setup(),
    first = await s.hooks.subscribe('parent-a', { ...INPUT, ttlMs: 1 })
  assert.equal(Date.parse(first.refreshBefore) - s.now(), 60000)
  await s.emit('Queued')
  const restart = new ChoreWebhooks(s.events, s.store, s.send, s.now, s.accepts)
  const rotation = await restart.subscribe('parent-a', {
    ...INPUT,
    delivery: { ...INPUT.delivery, secret: NEW_SECRET },
    ttlMs: null,
  })
  assert.equal(rotation.id, first.id)
  assert.equal(Date.parse(rotation.refreshBefore) - s.now(), 3600000)
  await restart.drain()
  assert(signatureValid(s.calls.at(-1)!, SECRET))
  assert(signatureValid(s.calls.at(-1)!, NEW_SECRET))
  s.tick(300001)
  await s.emit('After grace')
  await restart.drain()
  assert(!signatureValid(s.calls.at(-1)!, SECRET))
  assert(signatureValid(s.calls.at(-1)!, NEW_SECRET))
  const short = await restart.subscribe('parent-a', {
    ...INPUT,
    delivery: { ...INPUT.delivery, secret: NEW_SECRET },
    ttlMs: 60000,
  })
  s.tick(60001)
  await s.emit('During lapse')
  assert.equal((await restart.drain()).delivered, 0)
  const replay = await restart.subscribe('parent-a', {
    ...INPUT,
    cursor: short.cursor,
    ttlMs: 999999999,
  })
  assert.equal(replay.id, first.id)
  assert.equal(Date.parse(replay.refreshBefore) - s.now(), 86400000)
  assert.equal((await restart.drain()).delivered, 1)
  assert.equal(JSON.parse(s.calls.at(-1)!.body).data.text, 'During lapse')
  assert(!JSON.stringify(replay).includes(SECRET))
})

test('principal-scoped identity and verification prevent cross-principal cleanup or rotation', async () => {
  const s = setup(),
    a = await s.hooks.subscribe('parent-a', INPUT)
  s.tick(10001)
  const b = await s.hooks.subscribe('parent-b', INPUT)
  assert.notEqual(a.id, b.id)
  assert.equal(s.calls.length, 2, 'Consent must be verified for each principal')
  await s.hooks.unsubscribe('parent-a', {
    name: CHORE_EVENT,
    delivery: { url: INPUT.delivery.url },
  })
  assert(!s.store.states.has(a.id))
  assert(s.store.states.has(b.id))
  await s.emit('Only B')
  await s.hooks.drain()
  assert.equal(s.calls.at(-1)!.headers['X-MCP-Subscription-Id'], b.id)
  assert.equal(subscriptionId('parent-b', INPUT.delivery.url), b.id)
})

test('410/413 and bounded failures abandon only the event; pause and revocation stop chore delivery', async () => {
  const s = setup(),
    subscribed = await s.hooks.subscribe('parent-a', INPUT)
  await s.emit('410')
  await s.emit('413')
  await s.emit('retry')
  s.receiver(async (request) => ({
    status: Number(JSON.parse(request.body).data.text) || 500,
    body: '',
  }))
  s.repo.core.notificationsEnabled = false
  assert.equal((await s.hooks.drain()).paused, true)
  assert.equal(s.calls.length, 1)
  s.repo.core.notificationsEnabled = true
  assert.equal((await s.hooks.drain()).failed, 3)
  for (let attempt = 1; attempt < 5; attempt++) {
    s.tick(30000 * 2 ** (attempt - 1))
    await s.hooks.drain()
  }
  const texts = s.calls
    .slice(1)
    .map((request) => JSON.parse(request.body).data.text)
  assert.equal(texts.filter((text) => text === '410').length, 1)
  assert.equal(texts.filter((text) => text === '413').length, 1)
  assert.equal(texts.filter((text) => text === 'retry').length, 5)
  const refresh = await s.hooks.subscribe('parent-a', INPUT)
  assert.equal(refresh.cursor, eventCursor(3))
  assert(s.store.states.has(subscribed.id))
  s.receiver(async () => ({ status: 200, body: '' }))
  await s.emit('After revocation')
  s.revoke()
  await s.hooks.drain()
  assert.equal(JSON.parse(s.calls.at(-1)!.body).type, 'terminated')
  assert(!s.store.states.has(subscribed.id))
  assert(!s.calls.some((request) => request.body.includes('After revocation')))
})

test('initial maxAge and mid-subscription retention gaps report loss without unsafe cursors', async () => {
  const s = setup()
  await s.emit('Old', NOW - 100000)
  await s.emit('Current')
  const first = await s.hooks.subscribe('parent-a', {
    ...INPUT,
    cursor: eventCursor(0),
    maxAgeMs: 500,
  })
  assert.equal(first.truncated, true)
  assert.equal(first.cursor, eventCursor(1))
  await s.hooks.drain()
  assert.equal(JSON.parse(s.calls.at(-1)!.body).data.text, 'Current')
  await s.emit('Lost')
  await s.emit('Retained')
  s.repo.events = s.repo.events.slice(-1)
  s.receiver(async (request) => ({
    status: JSON.parse(request.body).type === 'gap' ? 500 : 200,
    body: '',
  }))
  await s.hooks.drain()
  const gap = s.calls.find(
    (request) => JSON.parse(request.body).type === 'gap',
  )!
  assert(gap.headers['webhook-id'].startsWith('msg_gap_'))
  assert.equal(JSON.parse(gap.body).cursor, eventCursor(3))
  const event = s.calls.find((request) => request.body.includes('Retained'))!
  assert.equal(JSON.parse(event.body).cursor, eventCursor(2))
  assert.equal(
    (await s.hooks.subscribe('parent-a', INPUT)).cursor,
    eventCursor(2),
  )
  s.tick(60000)
  s.receiver(async () => ({ status: 200, body: '' }))
  await s.hooks.drain()
  assert.equal(
    (await s.hooks.subscribe('parent-a', INPUT)).cursor,
    eventCursor(4),
  )
})

test('HTTPS callback validation rejects local/special addresses, DNS rebinding, redirects and invalid secrets', async () => {
  for (const address of [
    '0.0.0.0',
    '10.0.0.1',
    '100.64.0.1',
    '127.0.0.1',
    '169.254.169.254',
    '172.31.0.1',
    '192.168.0.1',
    '192.0.2.1',
    '198.18.0.1',
    '203.0.113.1',
    '224.0.0.1',
    '255.255.255.255',
    '::1',
    '::ffff:127.0.0.1',
    'fc00::1',
    'fe80::1',
    '64:ff9b::a00:1',
    '2001:db8::1',
    '2002:7f00:1::',
    '3fff::1',
  ])
    assert(!publicAddress(address), address)
  for (const address of [
    '93.184.216.34',
    '8.8.8.8',
    '2001:4860:4860::8888',
    '2606:4700:4700::1111',
  ])
    assert(publicAddress(address), address)
  for (const url of [
    'https://127.1/hook',
    'https://0x7f000001/hook',
    'https://2130706433/hook',
    'https://[::ffff:127.0.0.1]/hook',
  ])
    await assert.rejects(resolveCallback(url), CallbackFailure)
  let rebound = false
  const dns = async () => [
    { address: rebound ? '10.0.0.1' : '93.184.216.34', family: 4 },
  ]
  assert.equal(
    (await resolveCallback(INPUT.delivery.url, dns)).address.address,
    '93.184.216.34',
  )
  rebound = true
  await assert.rejects(
    resolveCallback(INPUT.delivery.url, dns),
    CallbackFailure,
  )
  await assert.rejects(
    resolveCallback(INPUT.delivery.url, async () => [
      { address: '93.184.216.34', family: 4 },
      { address: '::1', family: 6 },
    ]),
    CallbackFailure,
  )
  await assert.rejects(
    sendCallback({ url: 'https://127.0.0.1/hook', body: '{}', headers: {} }),
    (error: CallbackFailure) => error.reason === 'connection_refused',
  )
  assert.throws(() => callbackUrl('http://receiver.example/hook'), McpError)
  for (const secret of [
    '',
    'whsec_!!!',
    `whsec_${Buffer.alloc(23).toString('base64')}`,
  ])
    assert.throws(() => secretBytes(secret), McpError)
  const body = '{ "text": "Exact bytes, including whitespace" }'
  const headers = webhookHeaders('sub_test', 'event_123', body, [SECRET], NOW)
  assert(signatureValid({ url: INPUT.delivery.url, body, headers }))
  assert(
    !signatureValid({
      url: INPUT.delivery.url,
      body: JSON.stringify(JSON.parse(body)),
      headers,
    }),
  )
  const s = setup()
  s.challenge(async () => ({
    status: 302,
    body: '{"challenge":"not followed"}',
  }))
  await assert.rejects(
    s.hooks.subscribe('parent-a', INPUT),
    (error: McpError) => error.data?.['reason'] === 'challenge_failed',
  )
})

test('parent credential identity is stable across transport forms and revoked credentials stop authorization', () => {
  const before = {
    CAL_PASSWORD: process.env.CAL_PASSWORD,
    CLIPPY_AUTOMATION_TOKEN: process.env.CLIPPY_AUTOMATION_TOKEN,
  }
  try {
    process.env.CAL_PASSWORD = 'fixture-site-password'
    process.env.CLIPPY_AUTOMATION_TOKEN = 'fixture-automation-token'
    const a = mcpEventPrincipal(
      new Request('https://example.com/api/mcp?pwd=fixture-site-password'),
    )
    const b = mcpEventPrincipal(
      new Request('https://example.com/api/mcp', {
        headers: { Authorization: 'Bearer fixture-site-password' },
      }),
    )
    const c = mcpEventPrincipal(
      new Request('https://example.com/api/mcp', {
        headers: { Authorization: 'Bearer fixture-automation-token' },
      }),
    )
    assert.equal(a, b)
    assert.notEqual(a, c)
    assert(webhookPrincipalAllowed(a))
    assert.throws(
      () =>
        mcpEventPrincipal(
          new Request('https://example.com/api/mcp', {
            headers: { Cookie: 'chores-device=kid' },
          }),
        ),
      McpError,
    )
    process.env.CAL_PASSWORD = 'rotated-fixture-password'
    assert(!webhookPrincipalAllowed(a))
    assert(webhookPrincipalAllowed(c))
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test('HTTPS transport pins the validated DNS result, preserves hostname/TLS defaults and never follows redirects', async () => {
  const { EventEmitter } = await import('node:events')
  const { callbackSender } = await import('./webhook-http')
  const { request: nativeRequest } = await import('node:https')
  let connections = 0,
    resolutions = 0
  let written = '',
    destroyed = false
  const connect = ((url, options, receive) => {
    connections++
    assert(url instanceof URL)
    assert(options.lookup)
    assert(receive)
    assert.equal(url.href, INPUT.delivery.url)
    assert.equal(options.method, 'POST')
    assert.equal(options.agent, false)
    assert.equal(options.family, 4)
    assert.notEqual(options.rejectUnauthorized, false)
    options.lookup(
      'receiver.example',
      { family: 4 },
      (error, address, family) => {
        assert.equal(error, null)
        assert.equal(address, '93.184.216.34')
        assert.equal(family, 4)
      },
    )
    const outgoing = new EventEmitter() as any
    outgoing.destroy = () => {
      destroyed = true
    }
    outgoing.end = (body) => {
      written = body
      const response = new EventEmitter() as any
      response.statusCode = 302
      response.headers = { location: 'https://127.0.0.1/private' }
      receive(response)
      response.emit('data', Buffer.from('redirect'))
      response.emit('end')
    }
    return outgoing
  }) as typeof nativeRequest
  const send = callbackSender(async (url) => {
    resolutions++
    return resolveCallback(url, async () => [
      { address: '93.184.216.34', family: 4 },
    ])
  }, connect)
  const result = await send({
    url: INPUT.delivery.url,
    body: '{"exact": true}',
    headers: {},
  })
  assert.equal(result.status, 302)
  assert.equal(connections, 1)
  assert.equal(resolutions, 1)
  assert.equal(written, '{"exact": true}')
  assert(destroyed)
  await send({ url: INPUT.delivery.url, body: '{}', headers: {} })
  assert.equal(resolutions, 2, 'A retry must resolve and validate again')
})

test('the callback timeout covers DNS resolution and cannot connect after its deadline', async () => {
  const { callbackSender } = await import('./webhook-http')
  let resolve!: (value: Awaited<ReturnType<typeof resolveCallback>>) => void
  let connected = false
  const sender = callbackSender(
    () =>
      new Promise((done) => {
        resolve = done
      }),
    (() => {
      connected = true
      throw new Error('Must not connect')
    }) as any,
    5,
  )
  const delivery = sender({ url: INPUT.delivery.url, body: '{}', headers: {} })
  await assert.rejects(
    delivery,
    (error: CallbackFailure) => error.reason === 'timeout',
  )
  resolve({
    url: new URL(INPUT.delivery.url),
    address: { address: '93.184.216.34', family: 4 },
  })
  await new Promise((done) => setTimeout(done, 5))
  assert(!connected)
})

test('public subscription IDs exclude credential revisions and a rotated credential establishes fresh consent', async () => {
  const s = setup()
  const oldPrincipal = `site-password:${'a'.repeat(64)}`
  const newPrincipal = `site-password:${'b'.repeat(64)}`
  const old = await s.hooks.subscribe(oldPrincipal, INPUT)
  assert.equal(old.id, subscriptionId(newPrincipal, INPUT.delivery.url))
  assert.equal(old.id, subscriptionId('site-password', INPUT.delivery.url))
  await s.emit('Unsent before rotation')
  s.tick(10001)
  const fresh = await s.hooks.subscribe(newPrincipal, {
    ...INPUT,
    cursor: old.cursor,
  })
  assert.equal(fresh.id, old.id)
  assert.equal(
    s.calls.length,
    2,
    'Credential rotation must establish fresh receiver consent',
  )
  assert.equal(s.store.states.get(fresh.id)!.principal, newPrincipal)
  await s.hooks.drain()
  assert.equal(
    JSON.parse(s.calls.at(-1)!.body).data.text,
    'Unsent before rotation',
  )
})
