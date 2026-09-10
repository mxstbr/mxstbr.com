import { AsyncLocalStorage } from 'node:async_hooks'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { PREFIX, redisClient } from './repository'
import { choresService, developmentFixture } from './runtime'
import { fail, type Actor } from './types'

const COOKIE = 'chores2-device'
const SESSION_SECONDS = 90 * 86400
type Session = {
  id: string
  kidIds: string[]
  label: string
  createdAt: string
}
const parentContext = new AsyncLocalStorage<boolean>()
export const tokenHash = (token: string) =>
  createHash('sha256').update(token).digest('hex')
export function automationAuthorized(request: Request) {
  const expected = process.env.CLIPPY_AUTOMATION_TOKEN
  const header = request.headers.get('authorization')
  const candidate = header?.startsWith('Bearer ') ? header.slice(7) : ''
  if (!expected || candidate.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected))
}
export function withParentContext<T>(
  authorized: boolean,
  operation: () => T,
): T {
  return parentContext.run(authorized, operation)
}
export function parentActor(): Actor {
  if (!parentContext.getStore())
    fail(
      'FORBIDDEN',
      'Chores2 parent tools require an authenticated MCP connection. A kid device session is not sufficient.',
    )
  return { kind: 'parent', id: 'chatgpt-mcp' }
}
export function sitePasswordMatches(candidate: string | undefined) {
  const expected = process.env.CAL_PASSWORD
  if (!expected || !candidate) return false
  const actualBytes = Buffer.from(candidate)
  const expectedBytes = Buffer.from(expected)
  return (
    actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes)
  )
}
export async function unlockWithSitePassword(password: string) {
  if (!sitePasswordMatches(password))
    fail(
      'FORBIDDEN',
      'That password isn’t right. Use the same password as the original chore board.',
    )
  ;(await cookies()).set('password', password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 365 * 86400,
  })
  return { ok: true }
}
export async function deviceActor(): Promise<Actor | null> {
  if (developmentFixture())
    return {
      kind: 'kid',
      id: 'local-fixture',
      kidIds: ['kid-1', 'kid-2', 'kid-3'],
    }
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    const raw = await redisClient().get<string>(
      `${PREFIX}:device:${tokenHash(token)}`,
    )
    if (raw) {
      const session: Session = typeof raw === 'string' ? JSON.parse(raw) : raw
      return { kind: 'kid', id: session.id, kidIds: session.kidIds }
    }
  }
  if (!sitePasswordMatches(cookieStore.get('password')?.value)) return null
  const core = await choresService().repository.readCore()
  // Reuse the OS login while retaining kid-only command permissions and v2 data.
  return {
    kind: 'kid',
    id: 'site-login',
    kidIds: core.kids.map((kid) => kid.id),
  }
}
export async function requireDevice() {
  return (
    (await deviceActor()) ??
    fail('UNAUTHORIZED', 'This board is locked. Ask your parent to open it.')
  )
}
export function verifySameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  // Next may normalize request.url to localhost behind its dev/proxy server.
  // Compare the browser's Origin with the actual HTTP Host, including its port.
  const host = request.headers.get('host') || new URL(request.url).host
  let valid = false
  try {
    const parsed = new URL(origin || '')
    valid =
      parsed.host === host &&
      (parsed.protocol === 'https:' ||
        (process.env.NODE_ENV !== 'production' && parsed.protocol === 'http:'))
  } catch {}
  if (!valid) fail('FORBIDDEN', 'Open this action from the chore board.')
}
export async function inviteDevice(
  actor: Actor,
  label: string,
  kidIds: string[],
) {
  if (actor.kind !== 'parent')
    fail('FORBIDDEN', 'Only a parent can authorize a device.')
  const code = randomBytes(32).toString('hex')
  await redisClient().set(
    `${PREFIX}:invite:${tokenHash(code)}`,
    JSON.stringify({ label, kidIds }),
    { ex: 86400 },
  )
  return {
    url: `https://mxstbr.com/chores2/activate#code=${code}`,
    expiresInHours: 24,
    message:
      'Open this one-use link on the shared iPad. It grants access only to the Chores2 kid board.',
  }
}
export async function activateDevice(code: string) {
  if (!/^[a-f0-9]{64}$/.test(code))
    fail('INVALID_INVITE', 'This device link is invalid or expired.')
  const redis = redisClient(),
    token = randomBytes(32).toString('hex'),
    deviceId = tokenHash(token)
  const result = await redis.eval(
    `
local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local invite = cjson.decode(raw)
local session = cjson.encode({id=ARGV[1], kidIds=invite.kidIds, label=invite.label, createdAt=ARGV[2]})
redis.call('SET', KEYS[2], session, 'EX', ARGV[3])
redis.call('DEL', KEYS[1])
return 1`,
    [`${PREFIX}:invite:${tokenHash(code)}`, `${PREFIX}:device:${deviceId}`],
    [deviceId, new Date().toISOString(), String(SESSION_SECONDS)],
  )
  if (Number(result) !== 1)
    fail(
      'INVALID_INVITE',
      'This device link is expired or already used. Ask ChatGPT for a new one.',
    )
  ;(await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_SECONDS,
  })
  return { ok: true }
}
export async function revokeDevice(actor: Actor, id: string) {
  if (actor.kind !== 'parent')
    fail('FORBIDDEN', 'Only a parent can revoke a device.')
  if (!/^[a-f0-9]{64}$/.test(id))
    fail('INVALID_INPUT', 'Use an exact device ID.')
  await redisClient().del(`${PREFIX}:device:${id}`)
  return { status: 'revoked', id }
}
export async function listDevices(actor: Actor) {
  if (actor.kind !== 'parent')
    fail('FORBIDDEN', 'Only a parent can inspect devices.')
  const redis = redisClient()
  const result: Session[] = []
  let cursor = 0
  do {
    const [next, keys] = await redis.scan(cursor, {
      match: `${PREFIX}:device:*`,
      count: 100,
    })
    cursor = Number(next)
    for (const key of keys) {
      const raw = await redis.get<string>(key)
      if (raw) result.push(typeof raw === 'string' ? JSON.parse(raw) : raw)
    }
  } while (cursor !== 0)
  return result
}
