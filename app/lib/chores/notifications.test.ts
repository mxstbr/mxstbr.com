import { test } from 'node:test'
import assert from 'node:assert/strict'
import { drainNotifications } from './notifications'
import {
  ChoresError,
  type Core,
  type Day,
  type Notification,
  type Transaction,
} from './types'

function makeNotification(over: Partial<Notification> = {}): Notification {
  return {
    id: 'notif-1',
    text: 'kid submitted a chore',
    createdAt: '2026-09-09T15:00:00.000Z',
    status: 'pending',
    attempts: 0,
    nextAttemptAt: Date.now(),
    day: '2026-09-09',
    submissionId: 'sub-1',
    ...over,
  }
}

function makeCore(): Core {
  return {
    version: 2,
    revision: 0,
    initializedAt: '2026-09-09T00:00:00.000Z',
    kids: [],
    chores: [],
    rewards: [],
    balances: {},
    orders: {},
    pending: {},
    oneOffCompletions: {},
    oneOffRedemptions: {},
    lastCompleted: {},
    packing: {},
    packingImported: true,
    notificationsEnabled: true,
    migration: {
      sourceKey: '',
      timestamp: '2026-09-09T00:00:00.000Z',
      counts: {},
      openingBalances: {},
    },
  }
}

function makeDay(): Day {
  return {
    day: '2026-09-09',
    occurrences: [],
    ledger: [],
    redemptions: [],
    awards: {},
    planned: false,
    submissions: [
      {
        id: 'sub-1',
        occurrenceId: 'occ-1',
        kidId: 'kid-1',
        submittedAt: '2026-09-09T15:00:00.000Z',
        stars: 1,
        notifiedAt: undefined,
        notificationRetrying: false,
        status: 'pending',
        source: 'chores2',
      },
    ],
  }
}

interface EvalCall {
  keys: string[]
  args: (string | number)[]
}

function makeRepo(opts: {
  notification: Notification
  core?: Core
  day?: Day
  busyOnTransact?: number[]
}) {
  const core = opts.core ?? makeCore()
  const day = opts.day ?? makeDay()
  let transactCount = 0
  const finishCalls: EvalCall[] = []
  const repo = {
    prefix: 'test',
    redis: {
      async zrange() {
        return ['notif-1']
      },
      async eval(script: string, keys: string[], args: (string | number)[]) {
        if (script.includes('sending')) {
          opts.notification.status = 'sending'
          opts.notification.attempts = (opts.notification.attempts || 0) + 1
          opts.notification.leaseUntil = Date.now() + 60000
          return JSON.stringify(opts.notification)
        }
        finishCalls.push({ keys, args })
        return 1
      },
    },
    async readCore() {
      return structuredClone(core)
    },
    async transact<T>(
      _ids: string[],
      _req: unknown,
      op: (tx: Transaction) => T,
    ): Promise<T> {
      const index = transactCount++
      const tx: Transaction = {
        core: structuredClone(core),
        days: { '2026-09-09': structuredClone(day) },
        notifications: [],
      }
      const result = op(tx)
      if (opts.busyOnTransact?.includes(index))
        throw new ChoresError('BUSY', 'Another change is being saved.')
      day.submissions[0] = tx.days['2026-09-09']
        .submissions[0] as (typeof day.submissions)[number]
      return result
    },
  }
  return {
    repo,
    get transactCount() {
      return transactCount
    },
    get finishCalls() {
      return finishCalls
    },
    get subState() {
      return day.submissions[0]
    },
  }
}

test('send succeeds but success-path transact throws BUSY -> delivery is NOT recorded as failed; BUSY propagates', async () => {
  const notification = makeNotification()
  const sendCalls: string[] = []
  const mockSend = async (text: string) => {
    sendCalls.push(text)
  }
  const harness = makeRepo({ notification, busyOnTransact: [0] })

  let caught: unknown
  try {
    await drainNotifications(harness.repo as any, mockSend)
    assert.fail('expected drainNotifications to reject with a BUSY error')
  } catch (e) {
    caught = e
  }
  assert.ok(caught instanceof ChoresError, 'propagated error is a ChoresError')
  assert.equal((caught as ChoresError).code, 'BUSY')

  assert.equal(sendCalls.length, 1, 'Telegram send was attempted exactly once')
  assert.equal(
    harness.transactCount,
    1,
    'only the success-path transact ran; the send-failure catch-path transact was never invoked',
  )
  assert.equal(
    harness.finishCalls.length,
    0,
    'FINISH never ran because the commit failure propagated past it',
  )
  assert.equal(
    harness.subState.notificationRetrying,
    false,
    'a successfully delivered message must not be marked as retrying',
  )
  assert.equal(
    harness.subState.notifiedAt,
    undefined,
    'notifiedAt stays unset because the success-path commit did not persist',
  )
})

test('send failure -> pending, lastError set, retrying true, counted as failed, re-enqueued with backoff', async () => {
  const notification = makeNotification({ attempts: 1, nextAttemptAt: 0 })
  const mockSend = async () => {
    throw new Error('Telegram 429')
  }
  const harness = makeRepo({ notification })

  const result = await drainNotifications(harness.repo as any, mockSend)

  assert.equal(result.delivered, 0)
  assert.equal(result.failed, 1)
  assert.equal(harness.transactCount, 1, 'the catch-path transact ran once')
  assert.equal(harness.finishCalls.length, 1)
  assert.equal(
    harness.finishCalls[0].args[2],
    'pending',
    'FINISH records pending status to re-enqueue the notification',
  )
  const stored = JSON.parse(
    harness.finishCalls[0].args[1] as string,
  ) as Notification
  assert.equal(stored.status, 'pending')
  assert.equal(stored.lastError, 'Delivery failed; retry scheduled.')
  assert.equal(stored.leaseUntil, undefined)
  const score = harness.finishCalls[0].args[4] as number
  const expected = 30_000 * 2 ** Math.min(stored.attempts, 7)
  assert.ok(score > Date.now(), 'nextAttemptAt is a future backoff time')
  assert.ok(score <= Date.now() + 3_600_000, 'backoff capped at one hour')
  assert.ok(
    Math.abs(score - Date.now() - expected) < 1000,
    `backoff matches the attempts-based schedule (got ~${score - Date.now()}ms, expected ~${expected}ms)`,
  )
  assert.equal(
    harness.subState.notificationRetrying,
    true,
    'retrying flagged for kid UI',
  )
  assert.equal(harness.subState.notifiedAt, undefined, 'no delivery to record')
})
