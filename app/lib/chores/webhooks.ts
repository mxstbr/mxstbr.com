// Compatibility exports keep existing chores consumers on the same contract.
export {
  EventWebhooks as ChoreWebhooks,
  subscribeParams,
  unsubscribeParams,
  subscriptionId,
} from '../mcp/event-webhooks'
