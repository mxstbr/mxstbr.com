import { createHmac } from 'node:crypto'
import type {
  SubscriptionLease,
  WebhookStore,
  WebhookSubscription,
} from '../chores/webhook-store'
import { secret, type Owner } from './config'
import type { IncomingRecording, Recording } from './ingest'
import type { PebbleRecord, RecordingStore } from './repository'

export class MemoryRecordings implements RecordingStore {
  head = 0
  records: PebbleRecord[] = []
  audioData = new Map<string, string>()
  async accept(input: IncomingRecording) {
    const id = input.recording.id
    if (this.records.some((r) => r.recording.id === id))
      return { id, duplicate: true }
    this.records.push({
      position: ++this.head,
      recording: structuredClone(input.recording),
    })
    if (input.audioBase64) this.audioData.set(id, input.audioBase64)
    return { id, duplicate: false }
  }
  async history(after: number | null) {
    return {
      head: this.head,
      records: structuredClone(
        this.records.filter((r) => r.position > (after ?? 0)),
      ),
    }
  }
  async recording(id: string): Promise<Recording | null> {
    return this.records.find((r) => r.recording.id === id)?.recording ?? null
  }
  async audio(id: string) {
    return this.audioData.get(id) ?? null
  }
}
export class MemoryWebhooks<R> implements WebhookStore<R> {
  states = new Map<string, WebhookSubscription<R>>()
  verifiedKeys = new Set<string>()
  constructor(readonly now: () => number) {}
  async withLease<T>(
    id: string,
    wait: boolean,
    operation: (lease: SubscriptionLease<R>) => Promise<T>,
  ) {
    return operation({
      read: async () => {
        const value = this.states.get(id)
        return value && value.expiresAt > this.now()
          ? structuredClone(value)
          : null
      },
      save: async (value) => {
        this.states.set(id, structuredClone(value))
      },
      remove: async () => {
        this.states.delete(id)
      },
    })
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
  async claimVerification() {
    return true
  }
}
export async function phoneRequest(
  owner: Owner,
  now: number,
  options: {
    id?: string
    audio?: Uint8Array
    text?: string
    test?: boolean
    recordedAt?: number
  } = {},
) {
  const delivery = options.id ?? 'test-delivery'
  const trigger = options.test ? 'test-event' : 'single-click-hold'
  const timestamp = String(Math.floor(now / 1000))
  const form = new FormData()
  if (options.audio)
    form.set(
      'audio',
      new Blob([options.audio], { type: 'audio/mp4' }),
      `${delivery}.m4a`,
    )
  if (options.text !== undefined) form.set('transcription', options.text)
  if (options.test) form.set('test', 'true')
  form.set('recordedAt', String(options.recordedAt ?? now))
  form.set('client', 'ring')
  const raw = new Request('https://mxstbr.com', { method: 'POST', body: form })
  const body = Buffer.from(await raw.arrayBuffer())
  const headers = new Headers(raw.headers)
  headers.set('X-Index-Webhook-Version', '1')
  headers.set('X-Index-Trigger', trigger)
  headers.set('X-Index-Delivery', delivery)
  headers.set('X-Index-Timestamp', timestamp)
  if (options.test) headers.set('X-Index-Test', 'true')
  if (options.audio)
    headers.set('X-Audio-Size', String(options.audio.byteLength))
  headers.set(
    'X-Index-Signature',
    createHmac('sha256', secret(owner, 'webhook'))
      .update(
        `v1\n${timestamp}\n${delivery}\n${trigger}\n${options.test ? 1 : 0}\n`,
      )
      .update(body)
      .digest('hex'),
  )
  return new Request(`https://mxstbr.com/api/pebble-index/${owner}`, {
    method: 'POST',
    headers,
    body,
  })
}
