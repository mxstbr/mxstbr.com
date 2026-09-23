import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID, createHmac } from 'node:crypto'
import nextEnv from '@next/env'
import { fixture } from './fixtures'
import { notify } from './domain'
import { PREFIX, RedisRepository, redisClient } from './repository'
import { CHORE_EVENT, ChoreEvents, eventCursor } from './events'
import { ChoreWebhooks } from './webhooks'
import { RedisWebhookStore } from './webhook-store'
import type { CallbackRequest, SendCallback } from './webhook-http'

test(
  'Redis webhook leases preserve independent retries across workers, refreshes and cleanup',
  { skip: process.env.CHORES_REDIS_TEST !== '1' },
  async () => {
    nextEnv.loadEnvConfig(process.cwd())
    const redis = redisClient(() => AbortSignal.timeout(5000))
    const prefix = `${PREFIX}:verify:webhooks:${randomUUID()}`
    const repo = new RedisRepository(redis, prefix),
      store = new RedisWebhookStore(redis, prefix)
    const secret = `whsec_${Buffer.alloc(32, 45).toString('base64')}`
    const input = {
      name: CHORE_EVENT,
      delivery: {
        mode: 'webhook',
        url: 'https://fixture-receiver.example/hooks',
        secret,
      },
      ttlMs: 60000,
    }
    const calls: CallbackRequest[] = []
    let failing = true
    const send: SendCallback = async (request) => {
      calls.push(request)
      const header = request.headers
      assert.equal(
        header['webhook-signature'],
        `v1,${createHmac('sha256', Buffer.from(secret.slice(6), 'base64'))
          .update(
            `${header['webhook-id']}.${header['webhook-timestamp']}.${request.body}`,
          )
          .digest('base64')}`,
      )
      const body = JSON.parse(request.body)
      if (body.type === 'verification')
        return {
          status: 200,
          body: JSON.stringify({ challenge: body.challenge }),
        }
      return {
        status:
          failing && body.data.text === 'First fixture notification'
            ? 503
            : 200,
        body: '',
      }
    }
    const hooks = () =>
      new ChoreWebhooks(
        new ChoreEvents(repo),
        new RedisWebhookStore(redis, prefix),
        send,
        Date.now,
        () => true,
      )
    try {
      await redis.set(`${prefix}:core`, JSON.stringify(fixture().core))
      const [a, b] = await Promise.all([
        hooks().subscribe('fixture-parent', input),
        hooks().subscribe('fixture-parent', input),
      ])
      assert.equal(a.id, b.id)
      assert.equal(
        calls.length,
        1,
        'Only one verification POST for concurrent identical subscriptions',
      )
      assert.equal((await store.activeIds()).length, 1)
      const ttl = await redis.pttl(
        `${prefix}:events:webhooks:subscription:${a.id}`,
      )
      assert(ttl > 0 && ttl <= 60000)
      await repo.transact([], null, (tx) => {
        notify(tx, 'First fixture notification', new Date())
        notify(tx, 'Second fixture notification', new Date())
      })
      const outcomes = await Promise.all([hooks().drain(), hooks().drain()])
      assert.equal(
        outcomes.reduce((sum, result) => sum + result.delivered, 0),
        1,
      )
      assert.equal(
        outcomes.reduce((sum, result) => sum + result.failed, 0),
        1,
      )
      assert.equal(calls.length, 3)
      const refresh = await hooks().subscribe('fixture-parent', {
        ...input,
        cursor: eventCursor(2),
      })
      assert.equal(refresh.cursor, eventCursor(0))
      assert.equal(refresh.deliveryStatus!.lastError, 'http_5xx')
      await store.withLease(a.id, true, async (lease) => {
        const saved = (await lease.read())!
        assert.equal(saved.queue[0].attempts, 1)
        saved.queue[0].nextAttemptAt = 0
        await lease.save(saved)
      })
      failing = false
      await Promise.all([hooks().drain(), hooks().drain()])
      assert.equal(calls.length, 4)
      assert.equal(
        calls[1].headers['webhook-id'],
        calls[3].headers['webhook-id'],
      )
      assert.equal(
        (await hooks().subscribe('fixture-parent', input)).cursor,
        eventCursor(2),
      )
      await hooks().unsubscribe('different-parent', {
        name: CHORE_EVENT,
        delivery: { url: input.delivery.url },
      })
      assert.deepEqual(await store.activeIds(), [a.id])
      // A stale worker cannot overwrite a subscription after losing its lease.
      await store.withLease(a.id, true, async (lease) => {
        const saved = (await lease.read())!
        const key = `${prefix}:events:webhooks:lock:${a.id}`
        await redis.pexpire(key, 10000)
        await lease.save(saved)
        assert(
          (await redis.pttl(key)) > 50000,
          'Saving renews the lease before delivery',
        )
        await redis.set(key, 'new-owner', { px: 60000 })
        await assert.rejects(lease.save(saved), /could not be saved/)
        await redis.del(key)
      })
      await hooks().unsubscribe('fixture-parent', {
        name: CHORE_EVENT,
        delivery: { url: input.delivery.url },
      })
      await hooks().unsubscribe('fixture-parent', {
        name: CHORE_EVENT,
        delivery: { url: input.delivery.url },
      })
      assert.equal((await store.activeIds()).length, 0)
      assert.equal(
        await redis.exists(`${prefix}:events:webhooks:subscription:${a.id}`),
        0,
      )
    } finally {
      let cursor = 0
      const keys: string[] = []
      do {
        const scanned = await redis.scan(cursor, {
          match: `${prefix}:*`,
          count: 100,
        })
        cursor = Number(scanned[0])
        keys.push(...scanned[1])
      } while (cursor !== 0)
      if (keys.length) await redis.del(...keys)
    }
  },
)
