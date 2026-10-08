import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomUUID } from 'node:crypto'
import nextEnv from '@next/env'
import { redisClient } from '../chores/repository'
import { RedisRecordingStore } from './repository'
import { parseRecording } from './ingest'
import { phoneRequest } from './test-support'

test(
  'real Redis atomically deduplicates concurrent Pebble uploads and persists the original audio and replay journal',
  { skip: process.env.PEBBLE_REDIS_TEST !== '1' },
  async () => {
    nextEnv.loadEnvConfig(process.cwd())
    const redis = redisClient(() => AbortSignal.timeout(10000))
    const prefix = `pebble:index:verify:${randomUUID()}`
    const store = new RedisRecordingStore('max', redis, prefix)
    try {
      const now = Date.now(),
        bytes = Uint8Array.from([0, 1, 2, 254, 255])
      const input = await parseRecording(
        await phoneRequest('max', now, {
          audio: bytes,
          text: 'Disposable verification recording',
        }),
        'max',
        now,
      )
      const results = await Promise.all(
        Array.from({ length: 8 }, () =>
          new RedisRecordingStore('max', redis, prefix).accept(input),
        ),
      )
      assert.equal(results.filter((r) => !r.duplicate).length, 1)
      assert.equal(new Set(results.map((r) => r.id)).size, 1)
      const restored = new RedisRecordingStore('max', redis, prefix)
      assert.deepEqual(
        await restored.recording(input.recording.id),
        input.recording,
      )
      assert.deepEqual(
        Buffer.from((await restored.audio(input.recording.id))!, 'base64'),
        Buffer.from(bytes),
      )
      const history = await restored.history(0)
      assert.equal(history.head, 1)
      assert.equal(history.records.length, 1)
      assert.equal(history.records[0].recording.id, input.recording.id)
      assert.equal((await restored.history(1)).records.length, 0)
      for (const key of [
        `recording:${input.recording.id}`,
        `audio:${input.recording.id}`,
        'log',
      ]) {
        const ttl = await redis.ttl(`${prefix}:${key}`)
        assert(ttl > 0 && ttl <= 604800)
      }
      assert(
        (await redis.ttl(`${prefix}:delivery:${input.recording.deliveryId}`)) >
          604800,
      )
    } finally {
      const keys = await redis.keys(`${prefix}:*`)
      if (keys.length) await redis.del(...keys)
    }
  },
)
