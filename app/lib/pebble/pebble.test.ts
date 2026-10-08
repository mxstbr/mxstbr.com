import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHash } from 'node:crypto'
import { Webhook } from 'standardwebhooks'
import {
  audioAuthorized,
  audioUrl,
  eventName,
  ownerAllowed,
  pebblePrincipal,
  secret,
} from './config'
import { parseRecording, PebbleError } from './ingest'
import { PebbleEvents, recordingData } from './events'
import { EventWebhooks, subscriptionId } from '../mcp/event-webhooks'
import type { PebbleRecord } from './repository'
import { MemoryRecordings, MemoryWebhooks, phoneRequest } from './test-support'

process.env.PEBBLE_INDEX_SECRET = 'test-only-pebble-root-credential'
const NOW = Date.parse('2026-10-08T18:00:00Z')

test('Pebble official version 1 worked example validates without reserializing multipart bytes', async () => {
  const boundary = '7d3b8e5a-1f2c-4a6b-9c0d-2e4f6a8b0c1d'
  const body =
    [
      ['transcription', 'Index webhook test event'],
      ['test', 'true'],
      ['recordedAt', '1791244798766'],
      ['client', 'ring'],
    ]
      .map(
        ([name, value]) =>
          `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
      )
      .join('') + `--${boundary}--\r\n`
  assert.equal(Buffer.byteLength(body), 460)
  assert.equal(
    createHash('sha256').update(body).digest('hex'),
    'dd947b94767662935ea27baa1e7e4297d7cc86513f66ff2d96b3c975b39b8d05',
  )
  const request = new Request('https://mxstbr.com/api/pebble-index/max', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'X-Index-Webhook-Version': '1',
      'X-Index-Trigger': 'test-event',
      'X-Index-Test': 'true',
      'X-Index-Timestamp': '1791244800',
      'X-Index-Delivery': '6f1c2a3e-8b4d-4c5e-9f60-1a2b3c4d5e6f',
      'X-Index-Signature':
        'f3cda81969d98bfdaf2ed8e5e4019a8c3f2b99263e39a8c090c48d63c51738f7',
    },
  })
  const parsed = await parseRecording(
    request,
    'max',
    1791244800000,
    '0123456789abcdef0123456789abcdef',
  )
  assert.equal(parsed.recording.isTest, true)
  assert.equal(parsed.recording.transcription, 'Index webhook test event')
  assert.equal(parsed.audioBase64, undefined)
})

test('audio-only, Both and typed notes preserve original data; duplicates have stable owner-scoped IDs', async () => {
  const audio = Uint8Array.from([
    0, 0, 0, 24, 102, 116, 121, 112, 77, 52, 65, 32, 255,
  ])
  for (const options of [
    { audio },
    { audio, text: 'Über café 🪨' },
    { text: 'typed note' },
  ]) {
    const parsed = await parseRecording(
      await phoneRequest('max', NOW, options),
      'max',
      NOW,
    )
    assert.equal(parsed.recording.transcription, options.text)
    assert.deepEqual(
      parsed.audioBase64
        ? Buffer.from(parsed.audioBase64, 'base64')
        : undefined,
      options.audio ? Buffer.from(audio) : undefined,
    )
  }
  const a = await parseRecording(
    await phoneRequest('max', NOW, { text: 'One' }),
    'max',
    NOW,
  )
  const b = await parseRecording(
    await phoneRequest('max', NOW + 1000, { text: 'One' }),
    'max',
    NOW + 1000,
  )
  const sue = await parseRecording(
    await phoneRequest('sue', NOW, { text: 'One' }),
    'sue',
    NOW,
  )
  assert.equal(a.recording.id, b.recording.id)
  assert.notEqual(a.recording.id, sue.recording.id)
})

test('ingress rejects invalid signatures, cross-owner uploads, stale requests, metadata tampering and body limits', async () => {
  const check = async (
    request: Request,
    status: number,
    owner: 'max' | 'sue' = 'max',
    now = NOW,
  ) =>
    assert.rejects(
      parseRecording(request, owner, now),
      (e: PebbleError) => e.status === status,
    )
  await check(await phoneRequest('max', NOW, { text: 'secret' }), 401, 'sue')
  await check(
    await phoneRequest('max', NOW, { text: 'stale' }),
    401,
    'max',
    NOW + 301000,
  )
  const tampered = await phoneRequest('max', NOW, { text: 'note' })
  tampered.headers.set('X-Index-Trigger', 'double-click-hold')
  await check(tampered, 401)
  const missing = await phoneRequest('max', NOW, { text: 'note' })
  missing.headers.delete('X-Index-Signature')
  await check(missing, 401)
  const size = await phoneRequest('max', NOW, { audio: Uint8Array.of(1, 2) })
  size.headers.set('X-Audio-Size', '9')
  await check(size, 400)
  const large = await phoneRequest('max', NOW, { text: 'a'.repeat(65537) })
  await check(large, 413)
  await check(await phoneRequest('max', NOW), 400)
  const bodyLimit = await phoneRequest('max', NOW, { text: 'small' })
  bodyLimit.headers.set('Content-Length', '5000000')
  await check(bodyLimit, 413)
})

test('audio URLs expire and cannot authorize another owner, recording, or modified expiry', () => {
  const id = `idx_${'a'.repeat(64)}`
  const link = audioUrl('max', id, NOW + 60000)
  assert(audioAuthorized('max', id, new Request(link), NOW))
  assert(!audioAuthorized('sue', id, new Request(link), NOW))
  assert(
    !audioAuthorized('max', `idx_${'b'.repeat(64)}`, new Request(link), NOW),
  )
  assert(!audioAuthorized('max', id, new Request(link), NOW + 60000))
  const tampered = new URL(link)
  tampered.searchParams.set('expires', String(NOW / 1000 + 99999))
  assert(!audioAuthorized('max', id, new Request(tampered), NOW))
  assert(ownerAllowed(pebblePrincipal('max'), 'max'))
  assert(!ownerAllowed(pebblePrincipal('max'), 'sue'))
  assert.notEqual(secret('max', 'webhook'), secret('max', 'mcp'))
})

test('signed phone upload flows through a replayable event, independent retries, refresh, rotation and cleanup', async () => {
  let now = NOW
  const records = new MemoryRecordings(),
    store = new MemoryWebhooks<PebbleRecord>(() => now)
  const source = new PebbleEvents('max', records, () => now)
  const signing = `whsec_${Buffer.alloc(32, 17).toString('base64')}`,
    rotated = `whsec_${Buffer.alloc(32, 18).toString('base64')}`
  const delivered: any[] = [],
    attempts: any[] = []
  let failFirst = true
  const send = async (request: {
    body: string
    headers: Record<string, string>
  }) => {
    // Independent official verifier; stable IDs, exact bytes and current signatures.
    const verification = new Webhook(signing)
    const value = verification.verify(request.body, {
      ...request.headers,
      'webhook-timestamp': request.headers['webhook-timestamp'],
    }) as any
    if (value.type === 'verification')
      return {
        status: 200,
        body: JSON.stringify({ challenge: value.challenge }),
      }
    attempts.push(value)
    assert.equal(value.name, eventName('max'))
    assert.equal(value.type, undefined)
    assert.equal(request.headers['webhook-id'], value.eventId)
    if (failFirst && value.data.transcription === 'first')
      return { status: 503, body: '' }
    delivered.push(value)
    return { status: 200, body: '' }
  }
  // The Standard Webhooks verifier checks wall time; run the delivery portion at now.
  now = Date.now()
  const hooks = () =>
    new EventWebhooks(
      source,
      store,
      send,
      () => now,
      () => true,
    )
  const input = {
    name: eventName('max'),
    delivery: {
      mode: 'webhook',
      url: 'https://receiver.example/hooks/max',
      secret: signing,
    },
  }
  const subscription = await hooks().subscribe('max', input, false)
  assert.equal(subscription.cursor, source.cursor(0))
  for (const [id, text] of [
    ['first', 'first'],
    ['second', 'second'],
  ]) {
    const parsed = await parseRecording(
      await phoneRequest('max', now, {
        id,
        text,
        audio: Uint8Array.of(1, 2, 3),
      }),
      'max',
      now,
    )
    await records.accept(parsed)
    assert((await records.accept(parsed)).duplicate)
  }
  assert.deepEqual(await hooks().drain(), { delivered: 1, failed: 1 })
  assert.equal(
    delivered[0].cursor,
    source.cursor(0),
    'later event cannot skip failed earlier event',
  )
  const refreshed = await hooks().subscribe(
    'max',
    {
      ...input,
      cursor: source.cursor(2),
      delivery: { ...input.delivery, secret: rotated },
    },
    false,
  )
  assert.equal(refreshed.id, subscription.id)
  assert.equal(refreshed.cursor, source.cursor(0))
  failFirst = false
  store.states.get(subscription.id)!.queue.forEach((q) => (q.nextAttemptAt = 0))
  assert.deepEqual(await hooks().drain(), { delivered: 1, failed: 0 })
  assert.equal(attempts[0].eventId, attempts[2].eventId)
  assert.equal(store.states.get(subscription.id)?.watermark, 2)
  assert.notEqual(
    subscriptionId('max', input.delivery.url, eventName('max')),
    subscriptionId('max', input.delivery.url, eventName('sue')),
  )
  await hooks().unsubscribe('max', input, true)
  await hooks().unsubscribe('max', input, true)
  assert.equal(store.states.size, 0)
})

test('ChatGPT gap and revocation handling emits no unsupported control messages', async () => {
  let now = NOW,
    allowed = true
  const records = new MemoryRecordings(),
    store = new MemoryWebhooks<PebbleRecord>(() => now)
  const source = new PebbleEvents('max', records, () => now)
  const controls: string[] = []
  const hooks = new EventWebhooks(
    source,
    store,
    async (r) => {
      const body = JSON.parse(r.body)
      if (body.type) controls.push(body.type)
      return {
        status: 200,
        body: JSON.stringify({ challenge: body.challenge }),
      }
    },
    () => now,
    () => allowed,
  )
  const input = {
    name: source.name,
    delivery: {
      mode: 'webhook',
      url: 'https://receiver.example/max',
      secret: `whsec_${Buffer.alloc(32).toString('base64')}`,
    },
  }
  await hooks.subscribe('max', input, false)
  records.head = 9 // all prior records are outside retention
  await hooks.drain()
  assert.equal((await hooks.subscribe('max', input, false)).truncated, true)
  assert.equal((await hooks.subscribe('max', input, false)).truncated, false)
  allowed = false
  await hooks.drain()
  assert.deepEqual(controls, ['verification'])
  assert.equal(store.states.size, 0)
})

test('journal enforces owner cursors, starts at now and preserves text through bounded summaries', async () => {
  const records = new MemoryRecordings(),
    source = new PebbleEvents('max', records, () => NOW)
  const parsed = await parseRecording(
    await phoneRequest('max', NOW, { text: '🪨'.repeat(6000) }),
    'max',
    NOW,
  )
  await records.accept(parsed)
  assert.equal((await source.read({ name: source.name })).records.length, 0)
  assert.equal(
    (await source.read({ name: source.name, cursor: source.cursor(0) })).records
      .length,
    1,
  )
  assert.throws(() =>
    source.position(new PebbleEvents('sue', records).cursor(0)),
  )
  const data = recordingData(parsed.recording, true)
  assert.equal(data.transcriptionTruncated, true)
  assert.equal(Array.from(data.transcription!).length, 4000)
  assert.equal(
    recordingData(parsed.recording).transcription,
    parsed.recording.transcription,
  )
})
