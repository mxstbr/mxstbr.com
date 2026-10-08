import { redisClient } from '../chores/repository'
import { RETENTION_SECONDS, type Owner } from './config'
import type { IncomingRecording, Recording } from './ingest'

export type PebbleRecord = { position: number; recording: Recording }
export interface RecordingStore {
  accept(input: IncomingRecording): Promise<{ id: string; duplicate: boolean }>
  history(
    after: number | null,
  ): Promise<{ head: number; records: PebbleRecord[] }>
  recording(id: string): Promise<Recording | null>
  audio(id: string): Promise<string | null>
}
const HISTORY_LIMIT = 1000
// Commit audio, metadata, replay journal and duplicate protection together.
// Never acknowledge an event with only part of its data durably saved.
export const ACCEPT_RECORDING = `
local previous = redis.call('GET', KEYS[1])
if previous then return {previous, 1} end
local sequence = tonumber(redis.call('GET', KEYS[5]) or '0')
if not sequence or sequence >= 9007199254740991 then return redis.error_reply('Invalid sequence') end
local logType = redis.call('TYPE', KEYS[4]).ok
if logType ~= 'none' and logType ~= 'zset' then return redis.error_reply('Invalid journal') end
local recording = cjson.decode(ARGV[2])
sequence = sequence + 1
redis.call('SET', KEYS[2], ARGV[2], 'EX', ${RETENTION_SECONDS})
if ARGV[3] ~= '' then redis.call('SET', KEYS[3], ARGV[3], 'EX', ${RETENTION_SECONDS}) end
redis.call('ZADD', KEYS[4], sequence, cjson.encode({position=sequence, recording=recording}))
redis.call('ZREMRANGEBYRANK', KEYS[4], 0, -${HISTORY_LIMIT + 1})
redis.call('EXPIRE', KEYS[4], ${RETENTION_SECONDS})
redis.call('SET', KEYS[5], sequence)
redis.call('SET', KEYS[1], ARGV[1], 'EX', 2592000)
return {ARGV[1], 0}
`
const HISTORY = `
local head = tonumber(redis.call('GET', KEYS[1]) or '0')
local records = redis.call('ZRANGEBYSCORE', KEYS[2], '(' .. ARGV[1], '+inf', 'LIMIT', 0, ${HISTORY_LIMIT})
return {head, records}
`
function parse<T>(raw: unknown): T | null {
  return raw == null
    ? null
    : typeof raw === 'string'
      ? JSON.parse(raw)
      : (raw as T)
}
export class RedisRecordingStore implements RecordingStore {
  readonly prefix: string
  constructor(
    readonly owner: Owner,
    readonly redis = redisClient(() => AbortSignal.timeout(10000)),
    prefix?: string,
  ) {
    this.prefix = prefix ?? `pebble:index:mcp:v1:${owner}`
  }
  async accept(input: IncomingRecording) {
    const r = input.recording
    if (r.owner !== this.owner) throw new Error('Recording owner mismatch')
    const result = (await this.redis.eval(
      ACCEPT_RECORDING,
      [
        `${this.prefix}:delivery:${r.deliveryId}`,
        `${this.prefix}:recording:${r.id}`,
        `${this.prefix}:audio:${r.id}`,
        `${this.prefix}:log`,
        `${this.prefix}:sequence`,
      ],
      [r.id, JSON.stringify(r), input.audioBase64 ?? ''],
    )) as [string, number]
    return { id: result[0], duplicate: Number(result[1]) === 1 }
  }
  async history(after: number | null) {
    const result = (await this.redis.eval(
      HISTORY,
      [`${this.prefix}:sequence`, `${this.prefix}:log`],
      [after ?? 0],
    )) as [number, unknown[]]
    return {
      head: Number(result[0]),
      records: (result[1] ?? []).map((r) => parse<PebbleRecord>(r)!),
    }
  }
  async recording(id: string) {
    return parse<Recording>(
      await this.redis.get(`${this.prefix}:recording:${id}`),
    )
  }
  async audio(id: string) {
    return this.redis.get<string>(`${this.prefix}:audio:${id}`)
  }
}
