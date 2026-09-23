import { test } from 'node:test'
import assert from 'node:assert/strict'
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

const NOW = Date.parse('2026-09-09T14:15:00Z')
const input = { name: CHORE_EVENT, arguments: {} }
function setup() {
  const f = fixture()
  const repo = new MemoryRepository(f.core, f.days)
  const events = new ChoreEvents(repo, () => NOW)
  const emit = (text: string, at = NOW) =>
    repo.transact([], null, (tx) => notify(tx, text, new Date(at)))
  return { repo, events, emit }
}
test('events start at now, replay stable IDs and paginate without losing sibling notifications', async () => {
  const { events, emit } = setup()
  await emit('Historical')
  const start = await events.read(input)
  assert.deepEqual(start.events, [])
  await emit('First')
  await emit('Second')
  const first = await events.read({
    ...input,
    cursor: start.cursor,
    maxEvents: 1,
  })
  assert.equal(first.events[0].data.text, 'First')
  assert.equal(first.hasMore, true)
  assert.deepEqual(
    (await events.read({ ...input, cursor: start.cursor, maxEvents: 1 }))
      .events,
    first.events,
  )
  const second = await events.read({ ...input, cursor: first.cursor })
  assert.equal(second.events[0].data.text, 'Second')
  assert.equal(second.hasMore, false)
  assert.notEqual(second.events[0].eventId, first.events[0].eventId)
  assert.equal(
    (await events.read({ ...input, cursor: second.cursor })).events.length,
    0,
  )
  assert.equal((await events.read({ ...input, cursor: null })).events.length, 0)
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
  const cursor = (await events.read(input)).cursor
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
  const result = await events.read({ ...input, cursor })
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
    (await events.read({ ...input, cursor })).events,
    result.events,
  )
})

test('retention and maxAge report gaps; a paused channel preserves its replay position', async () => {
  const { repo, events, emit } = setup()
  const cursor = (await events.read(input)).cursor
  await emit('Outside retention', NOW - EVENT_MAX_AGE_MS - 1)
  await emit('Outside maxAge', NOW - 1000)
  await emit('Current')
  const aged = await events.read({ ...input, cursor, maxAgeMs: 500 })
  assert.equal(aged.truncated, true)
  assert.deepEqual(
    aged.events.map((e) => e.data.text),
    ['Current'],
  )
  repo.events = repo.events.slice(1)
  assert.equal((await events.read({ ...input, cursor })).truncated, true)
  repo.core.notificationsEnabled = false
  const paused = await events.read({ ...input, cursor })
  assert.equal(paused.cursor, cursor)
  assert.deepEqual(paused.events, [])
  repo.core.notificationsEnabled = true
  assert.equal((await events.read({ ...input, cursor })).events.length, 2)
  repo.events = []
  const expired = await events.read({ ...input, cursor })
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
    await assert.rejects(events.read(bad), (e: McpError) => e.code === -32602)
  await assert.rejects(
    events.read({ name: 'unknown' }),
    (e: McpError) => e.code === -32011 && e.data?.['kind'] === 'event',
  )
})
