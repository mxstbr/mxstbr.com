import { RedisRepository } from './repository'
import type { Notification } from './types'

const CLAIM = `
local raw = redis.call('GET', KEYS[1])
if not raw then redis.call('ZREM', KEYS[2], ARGV[1]); return nil end
local n = cjson.decode(raw)
if n.status == 'delivered' then redis.call('ZREM', KEYS[2], ARGV[1]); return nil end
if n.nextAttemptAt > tonumber(ARGV[2]) or (n.leaseUntil and n.leaseUntil > tonumber(ARGV[2])) then return nil end
n.status = 'sending'; n.attempts = n.attempts + 1; n.leaseUntil = tonumber(ARGV[2]) + 60000
local updated = cjson.encode(n)
redis.call('SET', KEYS[1], updated)
return updated
`
const FINISH = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2])
if ARGV[3] == 'delivered' then
  redis.call('ZREM', KEYS[2], ARGV[4]); redis.call('EXPIRE', KEYS[1], 604800)
else redis.call('ZADD', KEYS[2], ARGV[5], ARGV[4]) end
return 1
`
async function telegram(text: string) {
  if (!process.env.TELEGRAM_BOT_TOKEN)
    throw new Error('Telegram is not configured')
  const { bot } = await import('../telegram')
  // Plain text only. There are no mutation URLs or action keyboards.
  await bot.telegram.sendMessage('-4904434425', text)
}
export async function drainNotifications(
  repository = new RedisRepository(),
  send: (text: string) => Promise<unknown> = telegram,
) {
  const core = await repository.readCore()
  if (!core.notificationsEnabled)
    return { delivered: 0, failed: 0, paused: true }
  const redis = repository.redis,
    due = `${repository.prefix}:outbox:due`
  const ids = await redis.zrange<string[]>(due, '-inf', Date.now(), {
    byScore: true,
    offset: 0,
    count: 12,
  })
  let delivered = 0,
    failed = 0
  await Promise.all(
    ids.map(async (id) => {
      const key = `${repository.prefix}:notification:${id}`
      const raw = (await redis.eval(CLAIM, [key, due], [id, Date.now()])) as
        | string
        | null
      if (!raw) return
      const n: Notification = typeof raw === 'string' ? JSON.parse(raw) : raw
      try {
        await send(n.text)
        n.status = 'delivered'
        n.deliveredAt = new Date().toISOString()
        delete n.lastError
        if (n.day && n.submissionId)
          await repository.transact([n.day], null, (tx) => {
            const s = tx.days[n.day!].submissions.find(
              (s) => s.id === n.submissionId,
            )
            if (s) {
              s.notifiedAt = n.deliveredAt
              s.notificationRetrying = false
            }
          })
        delivered++
      } catch {
        n.status = 'pending'
        n.lastError = 'Delivery failed; retry scheduled.'
        n.nextAttemptAt =
          Date.now() + Math.min(3600000, 30000 * 2 ** Math.min(n.attempts, 7))
        if (n.day && n.submissionId)
          await repository.transact([n.day], null, (tx) => {
            const s = tx.days[n.day!].submissions.find(
              (s) => s.id === n.submissionId,
            )
            if (s) s.notificationRetrying = true
          })
        failed++
      }
      delete n.leaseUntil
      await redis.eval(
        FINISH,
        [key, due],
        [
          typeof raw === 'string' ? raw : JSON.stringify(raw),
          JSON.stringify(n),
          n.status,
          id,
          n.nextAttemptAt,
        ],
      )
    }),
  )
  return { delivered, failed }
}
export async function notificationStatus(repository = new RedisRepository()) {
  const ids = await repository.redis.zrange<string[]>(
    `${repository.prefix}:outbox:due`,
    0,
    99,
  )
  const rows = await Promise.all(ids.map((id) => repository.notification(id)))
  return rows.filter(Boolean).map((n) => ({
    id: n!.id,
    status: n!.status,
    attempts: n!.attempts,
    createdAt: n!.createdAt,
    nextAttemptAt: n!.nextAttemptAt,
    lastError: n!.lastError,
    submissionId: n!.submissionId,
  }))
}
