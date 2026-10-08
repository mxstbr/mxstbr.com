import { AsyncLocalStorage } from 'node:async_hooks'
import { McpError } from '@modelcontextprotocol/sdk/types.js'
import { mcpEventPrincipal } from '../chores/webhook-auth'
import {
  equalSecret,
  OWNERS,
  pebblePrincipal,
  secret,
  type Owner,
} from '../pebble/config'

export type McpAccess = {
  principal: string
  family: boolean
  owners: readonly Owner[]
}
const context = new AsyncLocalStorage<McpAccess | null>()
export function resolveMcpAccess(request: Request): McpAccess | null {
  try {
    return {
      principal: mcpEventPrincipal(request),
      family: true,
      owners: OWNERS,
    }
  } catch {}
  const authorization = request.headers.get('authorization')
  const bearer = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : null
  if (!bearer) return null
  for (const owner of OWNERS) {
    try {
      if (equalSecret(bearer, secret(owner, 'mcp')))
        return {
          principal: pebblePrincipal(owner),
          family: false,
          owners: [owner],
        }
    } catch {}
  }
  return null
}
export function withMcpAccess<T>(
  access: McpAccess | null,
  operation: () => T,
): T {
  return context.run(access, operation)
}
export function requireOwner(owner: Owner) {
  if (!context.getStore()?.owners.includes(owner))
    throw new McpError(-32012, 'Forbidden')
}
