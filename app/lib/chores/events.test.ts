import { test } from 'node:test'
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { McpError } from '@modelcontextprotocol/sdk/types.js'
import { fixture } from './fixtures'
import { MemoryRepository } from './repository'
import { notify } from './domain'
import { ChoresService } from './service'
import {
  CHORE_EVENT,
  ChoreEvents,
  eventCursor,
  EVENT_MAX_AGE_MS,
} from './events'
import { handleChoreEvents } from './events-http'

const NOW = Date.parse('2026-09-09T15:00:00Z')
const input = { name: CHORE_EVENT, arguments: {} }
function setup() {
  const f = fixture()
  const repo = new MemoryRepository(f.core, f.days)
  const events = new ChoreEvents(repo, () => NOW)
  const emit = (text: string, at = NOW) =>
    repo.transact([], null, (tx) => notify(tx, text, new Date(at)))
  return { repo, events, emit }
}
function request(method: string, params?: unknown, signal?: AbortSignal) {
  return new Request('https://example.com/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 7,
      method,
      ...(params === undefined ? {} : { params }),
    }),
    signal,
  })
}
const authorized = () => {}
function decoder(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const utf8 = new TextDecoder()
  let pending = ''
  return async () => {
    while (!pending.includes('\n\n')) {
      const read = await reader.read()
      if (read.done) return null
      pending += utf8.decode(read.value, { stream: true })
    }
    const end = pending.indexOf('\n\n')
    const frame = pending.slice(0, end)
    pending = pending.slice(end + 2)
    return JSON.parse(frame.slice('data: '.length))
  }
}

test('events start at now, replay stable IDs and paginate without losing sibling notifications', async () => {
  const { events, emit } = setup()
  await emit('Historical')
  const start = await events.poll(input)
  assert.deepEqual(start.events, [])
  await emit('First')
  await emit('Second')
  const first = await events.poll({
    ...input,
    cursor: start.cursor,
    maxEvents: 1,
  })
  assert.equal(first.events[0].data.text, 'First')
  assert.equal(first.hasMore, true)
  assert.deepEqual(
    (await events.poll({ ...input, cursor: start.cursor, maxEvents: 1 }))
      .events,
    first.events,
  )
  const second = await events.poll({ ...input, cursor: first.cursor })
  assert.equal(second.events[0].data.text, 'Second')
  assert.equal(second.hasMore, false)
  assert.notEqual(second.events[0].eventId, first.events[0].eventId)
  assert.equal(
    (await events.poll({ ...input, cursor: second.cursor })).events.length,
    0,
  )
  assert.equal((await events.poll({ ...input, cursor: null })).events.length, 0)
})

test('real chore commands atomically mirror every notification without repeating a retried command', async () => {
  const { repo, events } = setup()
  const service = new ChoresService(repo, () => new Date(NOW))
  const actor = {
    kind: 'kid' as const,
    id: 'test-device',
    kidIds: ['kid-1', 'kid-2', 'kid-3'],
  }
  const approvalOccurrence = repo.days['2026-09-09'].occurrences.find(
    (o) => o.kidId === 'kid-1' && o.choreId.endsWith('-bed'),
  )!
  approvalOccurrence.chore.requiresApproval = true
  const board = await service.getBoard(actor)
  const cursor = (await events.poll(input)).cursor
  const devina = board.kids.find((kid) => kid.id === 'kid-3')!
  const command = {
    action: 'submit',
    occurrenceId: devina.chores[0].occurrenceId,
  }
  const first = await service.execute(actor, 'event-completion-1', command)
  await service.execute(actor, 'event-completion-1', command)
  await service.execute(actor, 'event-completion-2', {
    action: 'submit',
    occurrenceId: devina.chores[1].occurrenceId,
  })
  await service.execute(actor, 'event-redemption', {
    action: 'redeem',
    kidId: 'kid-3',
    rewardId: 'movie',
    expectedCost: 20,
  })
  await service.execute({ kind: 'parent', id: 'test-parent' }, 'event-undo', {
    action: 'undo',
    submissionId: first.id,
  })
  const pending = await service.execute(actor, 'event-pending', {
    action: 'submit',
    occurrenceId: approvalOccurrence.id,
  })
  await service.execute({ kind: 'parent', id: 'test-parent' }, 'event-review', {
    action: 'review',
    submissionId: pending.id,
    decision: 'approve',
  })
  const result = await events.poll({ ...input, cursor })
  assert.equal(result.events.length, repo.notifications.length)
  assert(result.events.length >= 5)
  assert.deepEqual(
    result.events.map((event) => event.data.text),
    repo.notifications.map((notification) => notification.text),
  )
  assert.equal(
    new Set(result.events.map((event) => event.eventId)).size,
    result.events.length,
  )
  assert(result.events.some((event) => event.data.text.includes('bonus stars')))
  assert(result.events.some((event) => event.data.submissionId === pending.id))
  for (const n of repo.notifications) n.status = 'delivered'
  assert.deepEqual(
    (await events.poll({ ...input, cursor })).events,
    result.events,
  )
})

test('retention and maxAge report gaps; a paused channel preserves its replay position', async () => {
  const { repo, events, emit } = setup()
  const cursor = (await events.poll(input)).cursor
  await emit('Outside retention', NOW - EVENT_MAX_AGE_MS - 1)
  await emit('Outside maxAge', NOW - 1000)
  await emit('Current')
  const aged = await events.poll({ ...input, cursor, maxAgeMs: 500 })
  assert.equal(aged.truncated, true)
  assert.deepEqual(
    aged.events.map((e) => e.data.text),
    ['Current'],
  )
  repo.events = repo.events.slice(1)
  assert.equal((await events.poll({ ...input, cursor })).truncated, true)
  repo.core.notificationsEnabled = false
  const paused = await events.poll({ ...input, cursor })
  assert.equal(paused.cursor, cursor)
  assert.deepEqual(paused.events, [])
  repo.core.notificationsEnabled = true
  assert.equal((await events.poll({ ...input, cursor })).events.length, 2)
  repo.events = []
  const expired = await events.poll({ ...input, cursor })
  assert.equal(expired.truncated, true)
  assert.equal(expired.cursor, eventCursor(repo.eventSequence))
})

test('invalid arguments, unknown events and malformed/future cursors use draft errors', async () => {
  const { events } = setup()
  for (const bad of [
    { ...input, arguments: { unknown: true } },
    { ...input, cursor: 'invalid' },
    { ...input, cursor: eventCursor(2) },
    { ...input, maxEvents: 0 },
    { ...input, maxAgeMs: -1 },
  ])
    await assert.rejects(events.poll(bad), (e: McpError) => e.code === -32602)
  await assert.rejects(
    events.poll({ name: 'unknown' }),
    (e: McpError) => e.code === -32011 && e.data?.['kind'] === 'event',
  )
})

test('HTTP discovery and polling require parent auth and return the draft wire format', async () => {
  const { events, emit } = setup()
  const options = { events: () => events, authorize: authorized }
  const forbidden = await handleChoreEvents(request('events/list'), {
    ...options,
    authorize() {
      throw new McpError(-32012, 'Forbidden')
    },
  })
  assert.equal((await forbidden!.json()).error.code, -32012)
  const list = await (await handleChoreEvents(
    request('events/list'),
    options,
  ))!.json()
  assert.deepEqual(list.result.events[0].delivery, ['poll', 'push'])
  const start = await (await handleChoreEvents(
    request('events/poll', input),
    options,
  ))!.json()
  await emit('A new notification')
  const polled = await (await handleChoreEvents(
    request('events/poll', { ...input, cursor: start.result.cursor }),
    options,
  ))!.json()
  assert.equal(polled.id, 7)
  assert.equal(polled.result.events[0].data.text, 'A new notification')
  assert(!('records' in polled.result))
  assert(!('cursor' in polled.result.events[0]))
  const invalid = await (await handleChoreEvents(
    request('events/poll', { ...input, arguments: { unexpected: 1 } }),
    options,
  ))!.json()
  assert.equal(invalid.error.code, -32602)
  const unsupported = await (await handleChoreEvents(
    request('events/subscribe', {}),
    options,
  ))!.json()
  assert.equal(unsupported.error.code, -32014)
  assert.equal(await handleChoreEvents(request('tools/list'), options), null)
})

test('push sends confirmation before replay, stable cursors, heartbeat and a final result', async () => {
  const { events, emit } = setup()
  const cursor = (await events.poll(input)).cursor
  await emit('Replay this')
  const response = await handleChoreEvents(
    request('events/stream', { ...input, cursor }),
    {
      events: () => events,
      authorize: authorized,
      streamDurationMs: 25,
      checkIntervalMs: 2,
      heartbeatMs: 5,
    },
  )
  assert.equal(response!.headers.get('content-type'), 'text/event-stream')
  const frames = (await response!.text())
    .split('\n\n')
    .filter(Boolean)
    .map((f) => JSON.parse(f.slice(6)))
  assert.equal(frames[0].method, 'notifications/events/active')
  assert.equal(frames[0].params.cursor, cursor)
  assert.equal(frames[1].method, 'notifications/events/event')
  assert.equal(frames[1].params.data.text, 'Replay this')
  assert.notEqual(frames[1].params.cursor, cursor)
  for (const frame of frames.filter((f) => f.method))
    assert.equal(
      frame.params._meta['io.modelcontextprotocol/subscriptionId'],
      7,
    )
  assert(frames.some((f) => f.method === 'notifications/events/heartbeat'))
  assert.deepEqual(frames.at(-1), {
    jsonrpc: '2.0',
    id: 7,
    result: { _meta: {} },
  })
})

test('streams with identical request IDs are isolated and cancellation stops reads', async () => {
  const { repo, events, emit } = setup()
  let reads = 0
  const read = repo.readNotificationEvents.bind(repo)
  repo.readNotificationEvents = async (after) => {
    reads++
    return read(after)
  }
  const options = {
    events: () => events,
    authorize: authorized,
    checkIntervalMs: 3,
    streamDurationMs: 1000,
  }
  const one = (await handleChoreEvents(
    request('events/stream', input),
    options,
  ))!.body!.getReader()
  const two = (await handleChoreEvents(
    request('events/stream', input),
    options,
  ))!.body!.getReader()
  const nextOne = decoder(one),
    nextTwo = decoder(two)
  assert.equal((await nextOne()).method, 'notifications/events/active')
  assert.equal((await nextTwo()).method, 'notifications/events/active')
  await one.cancel()
  await emit('Second stream still works')
  assert.equal((await nextTwo()).params.data.text, 'Second stream still works')
  await two.cancel()
  await delay(10)
  const stoppedAt = reads
  await delay(10)
  assert.equal(reads, stoppedAt)
})

test('push signals mid-stream gaps and transient failures, then resumes from the same cursor', async () => {
  const { repo, events, emit } = setup()
  const response = await handleChoreEvents(request('events/stream', input), {
    events: () => events,
    authorize: authorized,
    checkIntervalMs: 5,
    streamDurationMs: 1000,
  })
  const reader = response!.body!.getReader(),
    next = decoder(reader)
  await next()
  const original = repo.readNotificationEvents.bind(repo)
  let failed = false
  repo.readNotificationEvents = async (after) => {
    if (!failed) {
      failed = true
      throw new Error('Private connection failure')
    }
    return original(after)
  }
  assert.equal((await next()).method, 'notifications/events/error')
  await emit('Lost to retention')
  await emit('Survives')
  repo.events = repo.events.slice(1)
  const gap = await next()
  assert.equal(gap.method, 'notifications/events/active')
  assert.equal(gap.params.truncated, true)
  const delivered = await next()
  assert.equal(delivered.params.data.text, 'Survives')
  await reader.cancel()
})

test('revoked parent authorization terminates a stream without further events', async () => {
  const { events, emit } = setup()
  let allowed = true
  const response = await handleChoreEvents(request('events/stream', input), {
    events: () => events,
    authorize() {
      if (!allowed) throw new McpError(-32012, 'Forbidden')
    },
    checkIntervalMs: 2,
    streamDurationMs: 1000,
  })
  const reader = response!.body!.getReader(),
    next = decoder(reader)
  await next()
  allowed = false
  await emit('Must not reach the stream')
  const terminated = await next()
  assert.equal(terminated.method, 'notifications/events/terminated')
  assert.equal(terminated.params.error.code, -32012)
  const rest: { method?: string }[] = []
  for (let frame = await next(); frame; frame = await next()) rest.push(frame)
  assert(!rest.some((f) => f.method === 'notifications/events/event'))
})
