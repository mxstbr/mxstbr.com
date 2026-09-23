import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import nextEnv from '@next/env'
import { fixture } from './fixtures'
import { PREFIX, RedisRepository, redisClient } from './repository'
import { ChoresService } from './service'
import { drainNotifications } from './notifications'
import type { Actor } from './types'
import { CHORE_EVENT, ChoreEvents } from './events'

test(
  'Redis CAS preserves concurrent completions, balances, idempotency and durable delivery retries',
  { skip: process.env.CHORES_REDIS_TEST !== '1' },
  async () => {
    nextEnv.loadEnvConfig(process.cwd())
    const redis = redisClient(),
      prefix = `${PREFIX}:verify:${randomUUID()}`
    const f = fixture(),
      repo = new RedisRepository(redis, prefix),
      service = new ChoresService(repo, () => new Date('2026-09-09T15:00:00Z'))
    const events = new ChoreEvents(repo, () =>
      Date.parse('2026-09-09T15:00:00Z'),
    )
    const actor: Actor = {
      kind: 'kid',
      id: 'test-device',
      kidIds: ['kid-1', 'kid-2', 'kid-3'],
    }
    try {
      await redis.set(`${prefix}:core`, JSON.stringify(f.core))
      for (const d of Object.values(f.days))
        await redis.set(`${prefix}:day:${d.day}`, JSON.stringify(d))
      const initialCursor = (await events.read({ name: CHORE_EVENT })).cursor
      const b = await service.getBoard(actor),
        dev = b.kids.find((k) => k.id === 'kid-3')!
      const rid = randomUUID()
      await Promise.all([
        ...Array.from({ length: 6 }, () =>
          service.execute(actor, rid, {
            action: 'submit',
            occurrenceId: dev.chores[0].occurrenceId,
          }),
        ),
        service.execute(actor, randomUUID(), {
          action: 'submit',
          occurrenceId: dev.chores[1].occurrenceId,
        }),
        service.execute(actor, randomUUID(), {
          action: 'submit',
          occurrenceId: b.kids[0].chores[0].occurrenceId,
        }),
      ])
      assert.equal((await repo.readCore()).balances['kid-3'], 30)
      assert.equal((await repo.readCore()).balances['kid-1'], 43)
      assert.equal(
        (await repo.readDay(b.day))!.submissions.filter(
          (s) => s.kidId === 'kid-3',
        ).length,
        2,
      )
      const competing = await Promise.allSettled(
        Array.from({ length: 3 }, () =>
          service.execute(actor, randomUUID(), {
            action: 'redeem',
            kidId: 'kid-3',
            rewardId: 'movie',
            expectedCost: 20,
          }),
        ),
      )
      assert.equal(competing.filter((r) => r.status === 'fulfilled').length, 1)
      assert.equal((await repo.readCore()).balances['kid-3'], 10)
      const due = `${prefix}:outbox:due`
      const before = await redis.zcard(due)
      assert(before >= 4)
      const mirrored = await events.read({
        name: CHORE_EVENT,
        cursor: initialCursor,
      })
      assert.equal(mirrored.events.length, before)
      assert.equal(new Set(mirrored.events.map((e) => e.eventId)).size, before)
      const failed = await drainNotifications(repo, async () => {
        throw new Error('Injected transport failure')
      })
      assert.equal(failed.failed, before)
      assert.equal(await redis.zcard(due), before)
      assert.equal((await repo.readCore()).balances['kid-3'], 10)
      assert.deepEqual(
        (await events.read({ name: CHORE_EVENT, cursor: initialCursor }))
          .events,
        mirrored.events,
      )
      const ids = await redis.zrange<string[]>(due, 0, -1)
      for (const id of ids) {
        const n = (await repo.notification(id))!
        n.nextAttemptAt = 0
        await redis.set(`${prefix}:notification:${id}`, JSON.stringify(n))
        await redis.zadd(due, { member: id, score: 0 })
      }
      let delivered = 0
      await Promise.all([
        drainNotifications(repo, async () => {
          delivered++
        }),
        drainNotifications(repo, async () => {
          delivered++
        }),
      ])
      assert.equal(delivered, before)
      assert.equal(await redis.zcard(due), 0)
      assert.equal((await repo.readCore()).balances['kid-3'], 10)
      // Telegram delivery and receipt expiry cannot consume another client's events.
      assert.deepEqual(
        (await events.read({ name: CHORE_EVENT, cursor: initialCursor }))
          .events,
        mirrored.events,
      )
      const originalCount = await redis.zcard(`${prefix}:events:log`)
      await redis.del(`${prefix}:events:log`)
      const expired = await events.read({
        name: CHORE_EVENT,
        cursor: initialCursor,
      })
      assert.equal(expired.truncated, true)
      assert.equal(expired.events.length, 0)
      assert(originalCount > 0)
    } finally {
      let cursor = 0
      const keys: string[] = []
      do {
        const scan = await redis.scan(cursor, {
          match: `${prefix}:*`,
          count: 100,
        })
        cursor = Number(scan[0])
        keys.push(...scan[1])
      } while (cursor)
      if (keys.length) await redis.del(...keys)
    }
  },
)
