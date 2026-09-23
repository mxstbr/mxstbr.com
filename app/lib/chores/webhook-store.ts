import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { redisClient, PREFIX } from './repository'
import type { EventRecord } from './events'
import type { CallbackError } from './webhook-http'

export type WebhookDelivery = {
  id: string
  position: number
  event?: EventRecord
  attempts: number
  firstAttemptAt?: number
  nextAttemptAt: number
  done?: boolean
}
export type WebhookSubscription = {
  id: string
  principal: string
  url: string
  secret: string
  previousSecret?: string
  previousSecretUntil?: number
  expiresAt: number
  watermark: number
  readPosition: number
  queue: WebhookDelivery[]
  lastDeliveryAt?: string
  lastError?: CallbackError
  failedSince?: string
}
export type SubscriptionLease = {
  read(): Promise<WebhookSubscription | null>
  save(value: WebhookSubscription): Promise<void>
  remove(): Promise<void>
}
export interface WebhookStore {
  withLease<T>(
    id: string,
    wait: boolean,
    operation: (lease: SubscriptionLease) => Promise<T>,
  ): Promise<T | undefined>
  activeIds(): Promise<string[]>
  verified(key: string): Promise<boolean>
  markVerified(key: string): Promise<void>
  claimVerification(host: string): Promise<boolean>
}

const WRITE = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
redis.call('ZREMRANGEBYSCORE', KEYS[3], '-inf', ARGV[4])
if redis.call('EXISTS', KEYS[2]) == 0 and redis.call('ZCARD', KEYS[3]) >= 64 then return -1 end
local remaining = tonumber(ARGV[3]) - tonumber(ARGV[4])
if remaining <= 0 then return 0 end
redis.call('SET', KEYS[2], ARGV[2], 'PX', remaining)
redis.call('ZADD', KEYS[3], ARGV[3], ARGV[5])
redis.call('PEXPIRE', KEYS[1], 60000)
return 1
`
const REMOVE = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
redis.call('DEL', KEYS[2])
redis.call('ZREM', KEYS[3], ARGV[2])
return 1
`
const RELEASE = `
if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end
return 0
`
const parse = <T>(raw: unknown): T | null =>
  raw == null ? null : typeof raw === 'string' ? JSON.parse(raw) : (raw as T)

export class RedisWebhookStore implements WebhookStore {
  constructor(
    readonly redis = redisClient(() => AbortSignal.timeout(5000)),
    readonly prefix = PREFIX,
  ) {}
  private key(suffix: string) {
    return `${this.prefix}:events:webhooks:${suffix}`
  }
  async withLease<T>(
    id: string,
    wait: boolean,
    operation: (lease: SubscriptionLease) => Promise<T>,
  ) {
    const token = randomUUID(),
      lock = this.key(`lock:${id}`)
    const deadline = Date.now() + (wait ? 12000 : 0)
    while (!(await this.redis.set(lock, token, { nx: true, px: 60000 }))) {
      if (!wait) return undefined
      if (Date.now() >= deadline)
        throw new Error('Webhook subscription is busy')
      await delay(100)
    }
    const keys = [lock, this.key(`subscription:${id}`), this.key('active')]
    try {
      return await operation({
        read: async () => {
          const value = parse<WebhookSubscription>(
            await this.redis.get(keys[1]),
          )
          return value && value.expiresAt > Date.now() ? value : null
        },
        save: async (value) => {
          const result = await this.redis.eval(WRITE, keys, [
            token,
            JSON.stringify(value),
            value.expiresAt,
            Date.now(),
            id,
          ])
          if (Number(result) !== 1)
            throw new Error('Webhook subscription could not be saved')
        },
        remove: async () => {
          if (Number(await this.redis.eval(REMOVE, keys, [token, id])) !== 1)
            throw new Error('Webhook subscription lease expired')
        },
      })
    } finally {
      await this.redis.eval(RELEASE, [lock], [token])
    }
  }
  async activeIds() {
    const key = this.key('active')
    await this.redis.zremrangebyscore(key, 0, Date.now())
    return this.redis.zrange<string[]>(key, 0, 63)
  }
  async verified(key: string) {
    return Boolean(await this.redis.get(this.key(`verified:${key}`)))
  }
  async markVerified(key: string) {
    await this.redis.set(this.key(`verified:${key}`), '1', { ex: 86400 })
  }
  async claimVerification(host: string) {
    return Boolean(
      await this.redis.set(this.key(`verification-rate:${host}`), '1', {
        nx: true,
        ex: 10,
      }),
    )
  }
}
