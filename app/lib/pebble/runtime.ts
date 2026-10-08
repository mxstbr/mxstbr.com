import { EventWebhooks } from '../mcp/event-webhooks'
import { RedisWebhookStore } from '../chores/webhook-store'
import { developmentFixture } from '../chores/runtime'
import { PebbleEvents } from './events'
import { ownerAllowed, OWNERS, type Owner } from './config'
import { RedisRecordingStore, type PebbleRecord } from './repository'

export function recordingStore(owner: Owner) {
  if (developmentFixture()) throw new Error('Use an injected Pebble test store')
  return new RedisRecordingStore(owner)
}
export function pebbleWebhooks(owner: Owner) {
  const store = recordingStore(owner)
  return new EventWebhooks(
    new PebbleEvents(owner, store),
    new RedisWebhookStore<PebbleRecord>(store.redis, store.prefix),
    undefined,
    undefined,
    (principal) => ownerAllowed(principal, owner),
  )
}
export async function drainPebbleEvents() {
  const results = await Promise.allSettled(
    OWNERS.map((owner) => pebbleWebhooks(owner).drain()),
  )
  return Object.fromEntries(
    OWNERS.map((owner, i) => [
      owner,
      results[i].status === 'fulfilled' ? results[i].value : { failed: true },
    ]),
  )
}
