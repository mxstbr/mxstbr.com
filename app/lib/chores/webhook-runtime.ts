import { ChoreEvents } from './events'
import { RedisRepository, redisClient } from './repository'
import { ChoreWebhooks } from './webhooks'
import { RedisWebhookStore } from './webhook-store'
import { developmentFixture } from './runtime'

export function choreWebhooks() {
  // Development fixtures must never register callbacks against live storage.
  // Protocol/worker tests inject a disposable store and callback receiver.
  if (developmentFixture())
    throw new Error('Use an injected webhook test store')
  const repository = new RedisRepository(
    redisClient(() => AbortSignal.timeout(5000)),
  )
  return new ChoreWebhooks(
    new ChoreEvents(repository),
    new RedisWebhookStore(repository.redis, repository.prefix),
  )
}
