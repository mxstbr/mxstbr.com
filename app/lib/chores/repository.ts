import { Redis } from '@upstash/redis'
import { createHash } from 'node:crypto'
import { emptyDay } from './domain'
import {
  EVENT_HISTORY_LIMIT,
  EVENT_MAX_AGE_MS,
  type EventHistory,
  type EventRecord,
} from './events'
import {
  ChoresError,
  fail,
  type Core,
  type Day,
  type Notification,
  type Repository,
  type RequestIdentity,
  type Transaction,
} from './types'

// Storage schema version, not the product name. Keep the existing live keys.
export const PREFIX = 'chores:mxstbr:v2'
export function redisClient(signal?: () => AbortSignal) {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  )
    throw new ChoresError(
      'UNAVAILABLE',
      'Chores is temporarily unavailable. Please try again.',
    )
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    automaticDeserialization: false,
    ...(signal ? { signal } : {}),
  })
}
const parse = <T>(value: unknown): T | null =>
  value === null || value === undefined
    ? null
    : typeof value === 'string'
      ? JSON.parse(value)
      : (value as T)
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
type SavedRequest = { actorId: string; fingerprint: string; result: unknown }
export const COMMIT_SCRIPT = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
if KEYS[2] ~= KEYS[1] and redis.call('EXISTS', KEYS[2]) == 1 then return 0 end
local writes = cjson.decode(ARGV[2])
local notifications = cjson.decode(ARGV[3])
local indexType = redis.call('TYPE', KEYS[3]).ok
if indexType ~= 'none' and indexType ~= 'zset' then return redis.error_reply('Invalid notification index') end
local eventType = redis.call('TYPE', KEYS[4]).ok
if eventType ~= 'none' and eventType ~= 'zset' then return redis.error_reply('Invalid event index') end
local sequence = tonumber(redis.call('GET', KEYS[5]) or '0')
if not sequence or sequence + #notifications > 9007199254740991 then return redis.error_reply('Invalid event sequence') end
for _, w in ipairs(writes) do
  if type(w.index) ~= 'number' or not KEYS[w.index] or type(w.value) ~= 'string' then return redis.error_reply('Invalid write') end
  local t = redis.call('TYPE', KEYS[w.index]).ok
  if t ~= 'none' and t ~= 'string' then return redis.error_reply('Invalid stored record type') end
end
for _, n in ipairs(notifications) do
  if type(n.id) ~= 'string' or type(n.at) ~= 'number' or type(n.event) ~= 'table' then return redis.error_reply('Invalid notification') end
end
for _, w in ipairs(writes) do redis.call('SET', KEYS[w.index], w.value) end
for _, n in ipairs(notifications) do
  redis.call('ZADD', KEYS[3], n.at, n.id)
  sequence = sequence + 1
  redis.call('ZADD', KEYS[4], sequence, cjson.encode({position=sequence, notification=n.event}))
end
if #notifications > 0 then
  redis.call('SET', KEYS[5], sequence)
  redis.call('ZREMRANGEBYRANK', KEYS[4], 0, -${EVENT_HISTORY_LIMIT + 1})
  redis.call('EXPIRE', KEYS[4], ${EVENT_MAX_AGE_MS / 1000})
end
return 1
`
const READ_EVENTS = `
local head = tonumber(redis.call('GET', KEYS[2]) or '0')
local records = {}
if ARGV[1] ~= '' then
  local rows = redis.call('ZRANGEBYSCORE', KEYS[1], '(' .. ARGV[1], '+inf')
  for _, raw in ipairs(rows) do table.insert(records, cjson.decode(raw)) end
end
return cjson.encode({head=head, records=records})
`
export class RedisRepository implements Repository {
  constructor(
    public redis = redisClient(),
    public prefix = PREFIX,
  ) {}
  async readNotificationEvents(after: number | null): Promise<EventHistory> {
    const result = parse<EventHistory>(
      await this.redis.eval(
        READ_EVENTS,
        [`${this.prefix}:events:log`, `${this.prefix}:events:sequence`],
        [after === null ? '' : after],
      ),
    )!
    // Redis Lua encodes an empty table as {}, not [].
    if (!Array.isArray(result.records)) result.records = []
    return result
  }
  async readCore() {
    return (
      parse<Core>(await this.redis.get(`${this.prefix}:core`)) ??
      fail(
        'NOT_INITIALIZED',
        'The chore board is being set up. Please try again shortly.',
      )
    )
  }
  async readDay(day: string) {
    return parse<Day>(await this.redis.get(`${this.prefix}:day:${day}`))
  }
  async transact<T>(
    dayIds: string[],
    request: RequestIdentity | null,
    operation: (tx: Transaction) => T,
  ): Promise<T> {
    const coreKey = `${this.prefix}:core`
    const requestKey = request
      ? `${this.prefix}:request:${hash(request.actorId + ':' + request.id)}`
      : coreKey
    const ids = Array.from(new Set(dayIds))
    for (let attempt = 0; attempt < 12; attempt++) {
      if (request) {
        const saved = parse<SavedRequest>(await this.redis.get(requestKey))
        if (saved) {
          if (
            saved.actorId !== request.actorId ||
            saved.fingerprint !== request.fingerprint
          )
            fail(
              'REQUEST_CONFLICT',
              'This request ID was already used for a different action.',
            )
          return saved.result as T
        }
      }
      const coreRaw = await this.redis.get<string>(coreKey)
      if (!coreRaw)
        fail('NOT_INITIALIZED', 'The chore board has not been initialized.')
      const core = parse<Core>(coreRaw)!
      const dayValues = await Promise.all(ids.map((id) => this.readDay(id)))
      const days = Object.fromEntries(
        ids.map((id, i) => [id, dayValues[i] || emptyDay(id)]),
      )
      const before = Object.fromEntries(
        ids.map((id) => [id, JSON.stringify(days[id])]),
      )
      const tx: Transaction = { core, days, notifications: [] }
      const originalCore = JSON.stringify(core)
      const result = operation(tx)
      const changed =
        originalCore !== JSON.stringify(core) ||
        ids.some((id) => before[id] !== JSON.stringify(days[id])) ||
        tx.notifications.length > 0
      if (changed) core.revision++
      const keys = [
        coreKey,
        requestKey,
        `${this.prefix}:outbox:due`,
        `${this.prefix}:events:log`,
        `${this.prefix}:events:sequence`,
      ]
      const writes: { index: number; value: string }[] = []
      const write = (key: string, value: unknown) => {
        let index = keys.indexOf(key)
        if (index === -1) {
          keys.push(key)
          index = keys.length - 1
        }
        writes.push({ index: index + 1, value: JSON.stringify(value) })
      }
      if (changed) write(coreKey, core)
      for (const id of ids)
        if (before[id] !== JSON.stringify(days[id]))
          write(`${this.prefix}:day:${id}`, days[id])
      for (const n of tx.notifications)
        write(`${this.prefix}:notification:${n.id}`, n)
      if (request)
        write(requestKey, {
          actorId: request.actorId,
          fingerprint: request.fingerprint,
          result,
        })
      const committed = await this.redis.eval(COMMIT_SCRIPT, keys, [
        typeof coreRaw === 'string' ? coreRaw : JSON.stringify(coreRaw),
        JSON.stringify(writes),
        JSON.stringify(
          tx.notifications.map((n) => ({
            id: n.id,
            at: n.nextAttemptAt,
            event: {
              id: n.id,
              text: n.text,
              createdAt: n.createdAt,
              ...(n.day ? { day: n.day } : {}),
              ...(n.submissionId ? { submissionId: n.submissionId } : {}),
            },
          })),
        ),
      ])
      if (Number(committed) === 1) return result
    }
    fail(
      'BUSY',
      'Another change is being saved. Please retry this same action.',
    )
  }
  async notification(id: string) {
    return parse<Notification>(
      await this.redis.get(`${this.prefix}:notification:${id}`),
    )
  }
}

export class MemoryRepository implements Repository {
  core: Core
  days: Record<string, Day>
  notifications: Notification[] = []
  events: EventRecord[] = []
  eventSequence = 0
  requests = new Map<string, SavedRequest>()
  constructor(core: Core, days: Record<string, Day> = {}) {
    this.core = structuredClone(core)
    this.days = structuredClone(days)
  }
  async readCore() {
    return structuredClone(this.core)
  }
  async readNotificationEvents(after: number | null): Promise<EventHistory> {
    return structuredClone({
      head: this.eventSequence,
      records:
        after === null ? [] : this.events.filter((e) => e.position > after),
    })
  }
  async readDay(day: string) {
    return structuredClone(this.days[day] || null)
  }
  async transact<T>(
    dayIds: string[],
    request: RequestIdentity | null,
    operation: (tx: Transaction) => T,
  ): Promise<T> {
    const key = request && `${request.actorId}:${request.id}`
    const saved = key && this.requests.get(key)
    if (saved) {
      if (saved.fingerprint !== request!.fingerprint)
        fail('REQUEST_CONFLICT', 'Request ID already used.')
      return structuredClone(saved.result) as T
    }
    const tx = {
      core: structuredClone(this.core),
      days: Object.fromEntries(
        dayIds.map((id) => [
          id,
          structuredClone(this.days[id] || emptyDay(id)),
        ]),
      ),
      notifications: [] as Notification[],
    }
    const result = operation(tx)
    tx.core.revision++
    this.core = tx.core
    Object.assign(this.days, tx.days)
    this.notifications.push(...tx.notifications)
    this.events.push(
      ...tx.notifications.map((notification) => ({
        position: ++this.eventSequence,
        notification: structuredClone(notification),
      })),
    )
    this.events = this.events.slice(-EVENT_HISTORY_LIMIT)
    if (key)
      this.requests.set(key, {
        actorId: request!.actorId,
        fingerprint: request!.fingerprint,
        result: structuredClone(result),
      })
    return result
  }
}
