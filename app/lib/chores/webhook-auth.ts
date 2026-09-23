import { createHash, timingSafeEqual } from 'node:crypto'
import { McpError } from '@modelcontextprotocol/sdk/types.js'

// The credential revision is private revocation state, never part of the
// public subscription ID sent to a receiver.
const principalFor = (kind: string, credential: string) =>
  `${kind}:${createHash('sha256').update('chores-mcp-parent:').update(credential).digest('hex')}`
export const canonicalWebhookPrincipal = (principal: string) =>
  /^(site-password|automation-token):[a-f0-9]{64}$/.exec(principal)?.[1] ??
  principal
const matches = (
  candidate: string | null | undefined,
  expected: string | undefined,
) => {
  if (!candidate || !expected) return false
  const a = Buffer.from(candidate),
    b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
export function mcpEventPrincipal(request: Request) {
  const header = request.headers.get('authorization')
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  const password = process.env.CAL_PASSWORD
  const automation = process.env.CLIPPY_AUTOMATION_TOKEN
  if (
    password &&
    (matches(bearer, password) ||
      matches(new URL(request.url).searchParams.get('pwd'), password))
  )
    return principalFor('site-password', password)
  if (automation && matches(bearer, automation))
    return principalFor('automation-token', automation)
  throw new McpError(-32012, 'Forbidden')
}
export function webhookPrincipalAllowed(principal: string) {
  return [
    ['site-password', process.env.CAL_PASSWORD],
    ['automation-token', process.env.CLIPPY_AUTOMATION_TOKEN],
  ].some(
    ([kind, credential]) =>
      credential && principalFor(kind!, credential) === principal,
  )
}
