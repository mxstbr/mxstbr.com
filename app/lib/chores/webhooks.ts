import { McpError } from '@modelcontextprotocol/sdk/types.js'
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto'
import z from 'zod/v3'
import {
  CHORE_EVENT,
  ChoreEvents,
  checkEventName,
  cursorPosition,
  eventArguments,
  eventCursor,
  eventOccurrence,
  eventParams,
  parseEventParams,
} from './events'
import {
  CallbackFailure,
  callbackUrl,
  responseFailure,
  secretBytes,
  sendCallback,
  webhookHeaders,
  type SendCallback,
} from './webhook-http'
import {
  RedisWebhookStore,
  type WebhookStore,
  type WebhookSubscription,
} from './webhook-store'
import {
  canonicalWebhookPrincipal,
  webhookPrincipalAllowed,
} from './webhook-auth'

export const subscribeParams = eventParams.extend({
  delivery: z.object({
    mode: z.literal('webhook'),
    url: z.string().max(2048),
    secret: z.string().max(100),
  }),
  ttlMs: z
    .number()
    .int()
    .nonnegative()
    .max(Number.MAX_SAFE_INTEGER)
    .nullable()
    .optional(),
})
export const unsubscribeParams = z.object({
  name: z.string(),
  arguments: eventArguments.optional().default({}),
  delivery: z.object({
    url: z.string().max(2048),
    mode: z.literal('webhook').optional(),
  }),
})
const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex')
export const subscriptionId = (principal: string, url: string) =>
  `sub_${digest(JSON.stringify([canonicalWebhookPrincipal(principal), url, CHORE_EVENT, {}]))}`
const messageId = (type: string) => `msg_${type}_${randomUUID()}`
const DEFAULT_TTL = 3600000
const MAX_TTL = 86400000
const MAX_RETRY_AGE = 15 * 60000

export class ChoreWebhooks {
  constructor(
    readonly events: ChoreEvents,
    readonly store: WebhookStore = new RedisWebhookStore(),
    readonly send: SendCallback = sendCallback,
    readonly now: () => number = Date.now,
    readonly allowed: (principal: string) => boolean = webhookPrincipalAllowed,
  ) {}

  private async post(
    subscription: WebhookSubscription,
    id: string,
    payload: unknown,
  ) {
    const body = JSON.stringify(payload)
    const secrets = [subscription.secret]
    if (
      subscription.previousSecret &&
      (subscription.previousSecretUntil || 0) > this.now()
    )
      secrets.push(subscription.previousSecret)
    return this.send({
      url: subscription.url,
      body,
      headers: webhookHeaders(subscription.id, id, body, secrets, this.now()),
    })
  }

  async subscribe(principal: string, input: unknown) {
    if (!this.allowed(principal)) throw new McpError(-32012, 'Forbidden')
    const params = parseEventParams(subscribeParams, input)
    checkEventName(params.name)
    callbackUrl(params.delivery.url)
    secretBytes(params.delivery.secret)
    // Validate even a redundant cursor, without allowing a refresh to skip
    // pending deliveries. Only a fresh subscription uses it as a replay point.
    const batch = await this.events.read({ ...params, maxEvents: 1 })
    const start = batch.records.length
      ? batch.records[0].position - 1
      : cursorPosition(batch.cursor)
    const id = subscriptionId(principal, params.delivery.url)
    return (await this.store.withLease(id, true, async (lease) => {
      const stored = await lease.read()
      // A new credential revision must establish a fresh verified grant; it
      // cannot silently revive delivery authorized by the revoked credential.
      const existing = stored?.principal === principal ? stored : null
      const subscription: WebhookSubscription = existing ?? {
        id,
        principal,
        url: params.delivery.url,
        secret: params.delivery.secret,
        expiresAt: 0,
        watermark: start,
        readPosition: start,
        queue: [],
      }
      if (!existing) {
        const key = digest(JSON.stringify([principal, subscription.url]))
        if (!(await this.store.verified(key))) {
          const host = digest(callbackUrl(subscription.url).hostname)
          if (!(await this.store.claimVerification(host)))
            throw new McpError(-32015, 'CallbackEndpointError', {
              reason: 'challenge_failed',
            })
          const challenge = randomBytes(32).toString('base64url')
          try {
            const response = await this.post(
              subscription,
              messageId('verification'),
              { type: 'verification', challenge },
            )
            let echo: unknown
            try {
              echo = JSON.parse(response.body)?.challenge
            } catch {}
            const actual =
              typeof echo === 'string' ? Buffer.from(echo) : Buffer.alloc(0)
            const expected = Buffer.from(challenge)
            if (
              responseFailure(response.status) ||
              actual.length !== expected.length ||
              !timingSafeEqual(actual, expected)
            )
              throw new CallbackFailure('challenge_failed')
          } catch (error) {
            throw new McpError(-32015, 'CallbackEndpointError', {
              reason:
                error instanceof CallbackFailure
                  ? error.reason
                  : 'connection_refused',
            })
          }
          await this.store.markVerified(key)
        }
      }
      if (!this.allowed(principal)) throw new McpError(-32012, 'Forbidden')
      if (subscription.secret !== params.delivery.secret) {
        subscription.previousSecret = subscription.secret
        subscription.previousSecretUntil = this.now() + 300000
        subscription.secret = params.delivery.secret
      }
      if ((subscription.previousSecretUntil || 0) <= this.now()) {
        delete subscription.previousSecret
        delete subscription.previousSecretUntil
      }
      subscription.expiresAt =
        this.now() +
        Math.max(60000, Math.min(params.ttlMs ?? DEFAULT_TTL, MAX_TTL))
      await lease.save(subscription)
      return {
        id,
        refreshBefore: new Date(subscription.expiresAt).toISOString(),
        cursor: eventCursor(subscription.watermark),
        truncated: existing ? false : batch.truncated,
        ...(existing
          ? {
              deliveryStatus: {
                active: true,
                lastDeliveryAt: subscription.lastDeliveryAt ?? null,
                lastError: subscription.lastError ?? null,
                ...(subscription.failedSince
                  ? { failedSince: subscription.failedSince }
                  : {}),
              },
            }
          : {}),
      }
    }))!
  }

  async unsubscribe(principal: string, input: unknown) {
    if (!this.allowed(principal)) throw new McpError(-32012, 'Forbidden')
    const params = parseEventParams(unsubscribeParams, input)
    checkEventName(params.name)
    callbackUrl(params.delivery.url)
    await this.store.withLease(
      subscriptionId(principal, params.delivery.url),
      true,
      (lease) => lease.remove(),
    )
    return {}
  }

  async drain() {
    if (!(await this.events.repository.readCore()).notificationsEnabled)
      return { delivered: 0, failed: 0, paused: true }
    const ids = await this.store.activeIds()
    const deadline = Date.now() + 40000
    let delivered = 0,
      failed = 0
    // Bound concurrency and work so the existing minute drain fits in its
    // serverless invocation. Pending deliveries survive until the next drain.
    const workers = Array.from(
      { length: Math.min(4, ids.length) },
      async () => {
        while (ids.length && Date.now() < deadline) {
          const id = ids.shift()!
          try {
            const result = await this.drainSubscription(id)
            delivered += result?.delivered ?? 0
            failed += result?.failed ?? 0
          } catch {
            // A single callback/storage failure cannot block other subscribers.
            failed++
          }
        }
      },
    )
    await Promise.all(workers)
    return { delivered, failed }
  }

  private async drainSubscription(id: string) {
    return this.store.withLease(id, false, async (lease) => {
      const subscription = await lease.read()
      if (!subscription) {
        await lease.remove()
        return { delivered: 0, failed: 0 }
      }
      if (!this.allowed(subscription.principal)) {
        await lease.remove()
        // Best effort only, with no chore data after authorization is revoked.
        await this.post(subscription, messageId('terminated'), {
          type: 'terminated',
          error: { code: -32012, message: 'Forbidden' },
        }).catch(() => {})
        return { delivered: 0, failed: 0 }
      }
      const advance = () => {
        while (subscription.queue[0]?.done)
          subscription.watermark = subscription.queue.shift()!.position
        if (!subscription.queue.length)
          subscription.watermark = subscription.readPosition
      }
      for (const item of subscription.queue)
        if (
          !item.done &&
          item.firstAttemptAt !== undefined &&
          (item.attempts >= 5 ||
            this.now() - item.firstAttemptAt >= MAX_RETRY_AGE)
        )
          item.done = true
      advance()
      if (subscription.queue.length < 100) {
        const batch = await this.events.read({
          name: CHORE_EVENT,
          cursor: eventCursor(subscription.readPosition),
          maxEvents: Math.min(50, 100 - subscription.queue.length),
        })
        if (batch.truncated) {
          const position = batch.records.length
            ? batch.records[0].position - 1
            : cursorPosition(batch.cursor)
          subscription.queue.push({
            id: messageId('gap'),
            position,
            attempts: 0,
            nextAttemptAt: 0,
          })
        }
        for (const event of batch.records)
          subscription.queue.push({
            id: event.notification.id,
            position: event.position,
            event,
            attempts: 0,
            nextAttemptAt: 0,
          })
        subscription.readPosition = cursorPosition(batch.cursor)
      }
      advance()
      const due = subscription.queue
        .filter((item) => !item.done && item.nextAttemptAt <= this.now())
        .slice(0, 8)
      // Persist attempts before POST: a crash can cause a duplicate delivery,
      // but cannot reset its retry budget or lose the pending event.
      for (const item of due) {
        item.attempts++
        item.firstAttemptAt ??= this.now()
        item.nextAttemptAt = this.now() + 60000
      }
      await lease.save(subscription)
      if (
        !this.allowed(subscription.principal) ||
        subscription.expiresAt <= this.now()
      )
        return { delivered: 0, failed: 0 }
      const outcomes = await Promise.all(
        due.map(async (item) => {
          // Only the first outstanding item can advance its own delivery cursor.
          // Later events may succeed first, but must retain the older watermark.
          const cursor = eventCursor(
            subscription.queue.find((queued) => !queued.done) === item
              ? item.position
              : subscription.watermark,
          )
          const payload = item.event
            ? { ...eventOccurrence(item.event), cursor }
            : { type: 'gap', cursor }
          try {
            if (Buffer.byteLength(JSON.stringify(payload)) > 256 * 1024)
              return { item, error: 'http_4xx' as const, abandon: true }
            const response = await this.post(subscription, item.id, payload)
            const error = responseFailure(response.status)
            return {
              item,
              error,
              abandon: response.status === 410 || response.status === 413,
            }
          } catch (error) {
            return {
              item,
              error:
                error instanceof CallbackFailure
                  ? error.reason
                  : ('connection_refused' as const),
              abandon: false,
            }
          }
        }),
      )
      let delivered = 0,
        failed = 0
      for (const { item, error, abandon } of outcomes) {
        if (!error) {
          item.done = true
          subscription.lastDeliveryAt = new Date(this.now()).toISOString()
          delivered++
        } else {
          subscription.lastError = error
          subscription.failedSince ??= new Date(this.now()).toISOString()
          item.done =
            abandon ||
            item.attempts >= 5 ||
            this.now() - item.firstAttemptAt! >= MAX_RETRY_AGE
          item.nextAttemptAt =
            this.now() + Math.min(240000, 30000 * 2 ** (item.attempts - 1))
          failed++
        }
      }
      if (
        delivered &&
        !failed &&
        !subscription.queue.some((item) => !item.done && item.attempts > 0)
      ) {
        delete subscription.lastError
        delete subscription.failedSince
      }
      advance()
      // TTL may lapse during the callback; do not recreate an expired grant.
      if (subscription.expiresAt > this.now()) await lease.save(subscription)
      else await lease.remove()
      return { delivered, failed }
    })
  }
}
