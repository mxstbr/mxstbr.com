import { McpError } from '@modelcontextprotocol/sdk/types.js'
import z from 'zod/v3'
import {
  CHORE_EVENT,
  choreEventDescriptor,
  invalidParams,
  parseEventParams,
} from '../chores/events'
import { choreWebhooks } from '../chores/webhook-runtime'
import { eventDescriptor } from '../pebble/events'
import { eventName, type Owner } from '../pebble/config'
import { pebbleWebhooks } from '../pebble/runtime'
import type { McpAccess } from './access'

export type EventManager = {
  subscribe(
    principal: string,
    params: unknown,
    controls?: boolean,
  ): Promise<unknown>
  unsubscribe(
    principal: string,
    params: unknown,
    idempotent?: boolean,
  ): Promise<unknown>
  drain(): Promise<unknown>
}
export type EventOptions = {
  chores?: () => EventManager
  pebble?: (owner: Owner) => EventManager
  afterSubscribe?: (manager: EventManager) => void
}
export async function eventMethod(
  method: string,
  params: unknown,
  access: McpAccess | null,
  modern: boolean,
  options: EventOptions = {},
) {
  if (!access) throw new McpError(-32012, 'Forbidden')
  if (method === 'events/list') {
    const list = parseEventParams(
      z.object({ cursor: z.string().optional() }).optional(),
      params,
    )
    if (list?.cursor !== undefined) throw invalidParams()
    return {
      events: [
        ...(access.family ? [choreEventDescriptor] : []),
        ...access.owners.map(eventDescriptor),
      ],
    }
  }
  if (method === 'events/poll' || method === 'events/stream')
    throw new McpError(-32014, 'Unsupported', {
      feature: 'deliveryMode',
      value: method === 'events/poll' ? 'poll' : 'push',
    })
  if (method !== 'events/subscribe' && method !== 'events/unsubscribe')
    throw new McpError(-32601, 'Method not found')
  const { name } = parseEventParams(z.object({ name: z.string() }), params)
  const owner = access.owners.find((owner) => eventName(owner) === name)
  let manager: EventManager
  if (name === CHORE_EVENT && access.family)
    manager = (options.chores ?? choreWebhooks)()
  else if (owner) manager = (options.pebble ?? pebbleWebhooks)(owner)
  else throw new McpError(-32011, 'NotFound', { kind: 'event' })
  if (method === 'events/unsubscribe')
    return manager.unsubscribe(access.principal, params, modern)
  const result = await manager.subscribe(
    access.principal,
    params,
    !modern && !owner,
  )
  options.afterSubscribe?.(manager)
  return result
}
