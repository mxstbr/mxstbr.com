import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { webhookPrincipalAllowed } from '../chores/webhook-auth'

export const OWNERS = ['max', 'sue'] as const
export type Owner = (typeof OWNERS)[number]
export const isOwner = (value: string): value is Owner =>
  OWNERS.includes(value as Owner)
export const eventName = (owner: Owner) => `pebble.${owner}.recording.created`
export const RETENTION_SECONDS = 7 * 86400
export const MAX_AUDIO_BYTES = 4_000_000
export const MAX_TRANSCRIPT_BYTES = 64 * 1024
export const MAX_REQUEST_BYTES = MAX_AUDIO_BYTES + MAX_TRANSCRIPT_BYTES + 16384

export function secret(owner: Owner, purpose: 'webhook' | 'mcp' | 'audio') {
  const override =
    process.env[
      `PEBBLE_INDEX_${owner.toUpperCase()}_${purpose.toUpperCase()}_SECRET`
    ]
  if (override) return override
  // Domain-separated keys, derived server-side. Neither phone nor MCP client
  // receives the root credential or can derive the other person's key.
  const root =
    process.env.PEBBLE_INDEX_SECRET || process.env.UPSTASH_REDIS_REST_TOKEN
  if (!root) throw new Error('Pebble Index is not configured')
  return createHmac('sha256', root)
    .update(`mxstbr.com:pebble-index:v1:${owner}:${purpose}`)
    .digest('base64url')
}
export function equalSecret(actual: string | null, expected: string) {
  const a = Buffer.from(actual ?? ''),
    b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
export const pebblePrincipal = (owner: Owner) =>
  `pebble-${owner}:${createHash('sha256').update(secret(owner, 'mcp')).digest('hex')}`
export function ownerAllowed(principal: string, owner: Owner) {
  return (
    webhookPrincipalAllowed(principal) || principal === pebblePrincipal(owner)
  )
}
export function audioUrl(owner: Owner, id: string, expiresAt: number) {
  const expires = Math.floor(expiresAt / 1000)
  const token = createHmac('sha256', secret(owner, 'audio'))
    .update(`${owner}\n${id}\n${expires}`)
    .digest('base64url')
  return `https://mxstbr.com/api/pebble-index/${owner}/recordings/${id}/audio?expires=${expires}&token=${token}`
}
export function audioAuthorized(
  owner: Owner,
  id: string,
  request: Request,
  now = Date.now(),
) {
  const url = new URL(request.url)
  const expires = url.searchParams.get('expires') ?? ''
  if (!/^\d{1,12}$/.test(expires) || Number(expires) * 1000 <= now) return false
  const expected = new URL(audioUrl(owner, id, Number(expires) * 1000))
  return equalSecret(
    url.searchParams.get('token'),
    expected.searchParams.get('token')!,
  )
}
