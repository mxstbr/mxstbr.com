import { Redis } from '@upstash/redis'
import { createHash } from 'node:crypto'
import { emptyDay } from './domain'
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

export const PREFIX = 'chores:mxstbr:v2'
export function redisClient() {
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
for _, w in ipairs(writes) do
  if type(w.index) ~= 'number' or not KEYS[w.index] or type(w.value) ~= 'string' then return redis.error_reply('Invalid write') end
  local t = redis.call('TYPE', KEYS[w.index]).ok
  if t ~= 'none' and t ~= 'string' then return redis.error_reply('Invalid stored record type') end
end
for _, n in ipairs(notifications) do
  if type(n.id) ~= 'string' or type(n.at) ~= 'number' then return redis.error_reply('Invalid notification') end
end
for _, w in ipairs(writes) do redis.call('SET', KEYS[w.index], w.value) end
for _, n in ipairs(notifications) do redis.call('ZADD', KEYS[3], n.at, n.id) end
return 1
`
export class RedisRepository implements Repository {
  constructor(
    public redis = redisClient(),
    public prefix = PREFIX,
  ) {}
  async readCore() {
    return (
      parse<Core>(await this.redis.get(`${this.prefix}:core`)) ??
      fail(
        'NOT_INITIALIZED',
        'The test board is being set up. Please try again shortly.',
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
        fail('NOT_INITIALIZED', 'The test board has not been initialized.')
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
      const keys = [coreKey, requestKey, `${this.prefix}:outbox:due`]
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
          tx.notifications.map((n) => ({ id: n.id, at: n.nextAttemptAt })),
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
  requests = new Map<string, SavedRequest>()
  constructor(core: Core, days: Record<string, Day> = {}) {
    this.core = structuredClone(core)
    this.days = structuredClone(days)
  }
  async readCore() {
    return structuredClone(this.core)
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
    if (key)
      this.requests.set(key, {
        actorId: request!.actorId,
        fingerprint: request!.fingerprint,
        result: structuredClone(result),
      })
    return result
  }
}
