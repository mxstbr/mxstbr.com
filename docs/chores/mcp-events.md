# Chores MCP Events

The authenticated `/api/mcp` endpoint implements the [Events working-group draft at commit 6682596](https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/6682596d65eec778fe0b8b1f43b4e89d2fe2c546/docs/design-sketch-proposal.md), checked September 23, 2026. This is an experimental protocol surface; clients need support for that draft. Existing MCP tools and Telegram delivery continue to work.

Initialization advertises `capabilities.events: {"listChanged": false}`. `events/list` returns the single event type `chores.notification`, its input/payload schemas, and `delivery: ["poll", "push"]`. These are protocol methods, not additional LLM tools. Event arguments are an empty object. The fixed catalog has one page and emits no list-change notifications.

Every newly committed Telegram notification also enters the event journal in the same Redis transaction as its chore operation. This covers approval requests, completions, approval updates, undo, period bonuses and reward redemptions whenever the domain produces those messages. Telegram success/failure has no effect on the journal. No historical import is performed; collection begins with this deployment. Saved balances, history, pending approvals and the existing `chores:mxstbr:v2` keys are preserved.

An event has this shape:

```json
{
  "eventId": "the-stable-notification-uuid",
  "name": "chores.notification",
  "timestamp": "2026-09-23T15:00:00.000Z",
  "data": {
    "notificationId": "the-stable-notification-uuid",
    "text": "The exact same text as the Telegram notification.",
    "day": "2026-09-23",
    "submissionId": "present only when the source notification has one"
  }
}
```

`day` and `submissionId` are optional. In particular, ordinary completion messages do not acquire a submission ID merely by being sent through MCP; resolve exact submissions through the day/approval tools. Payloads are untrusted data, with the same treatment as tool results. Receiving an event does not approve a request or grant any new mutation authority.

## Poll

POST standard JSON-RPC to `/api/mcp` with the same bearer credential used for parent tools:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "events/poll",
  "params": {
    "name": "chores.notification",
    "arguments": {},
    "cursor": null,
    "maxEvents": 50,
    "maxAgeMs": 300000
  }
}
```

A null or omitted cursor starts from now: the first response contains no events and a fresh cursor. Persist that opaque cursor and supply it on subsequent polls. Results contain `events`, `cursor`, `truncated`, `hasMore`, and `nextPollMs`. Poll after 15 seconds, or immediately when `hasMore` is true. The default page size is 50, with a server cap of 1,000; a larger requested cap still returns pages without discarding events. Poll event occurrences do not carry individual cursors.

Each client owns its cursor and deduplicates by `eventId`. Polling does not consume events for another client. At most the newest 5,000 notifications from the last seven days can be replayed. `maxAgeMs` can shorten that window. If history has expired, the size limit has evicted entries, or an age limit skips events, `truncated: true` reports the gap and delivery resumes from retained history. Persist the returned cursor and use the chores inspection tools to recover authoritative state when needed. The global notification pause also pauses MCP delivery without advancing an existing subscriber past queued events.

## Push

Send `events/stream` with the same `name`, `arguments`, `cursor` and optional `maxAgeMs`, with `Accept: application/json, text/event-stream`. The POST response is an SSE stream scoped to this one subscription:

- `notifications/events/active` confirms the cursor and any initial gap before replay begins.
- `notifications/events/event` carries an occurrence and its cursor. The durable journal is checked every two seconds.
- `notifications/events/heartbeat` carries the last checked cursor during quiet periods, approximately every 15 seconds.
- `notifications/events/error` reports a temporary failure; the stream retries from its existing cursor. Storage reads time out after 10 seconds.
- Another `notifications/events/active` with `truncated: true` signals a gap detected while streaming.
- `notifications/events/terminated` ends delivery when authorization is revoked.

Every notification includes `params._meta["io.modelcontextprotocol/subscriptionId"]` equal to the parent request ID. Simultaneous clients may use the same JSON-RPC ID without sharing a stream. Abort the HTTP response to unsubscribe; cancellation releases the stream loop. Streams finish after 55 seconds with the draft's empty `StreamEventsResult` before the serverless request limit. Reopen `events/stream` with the last persisted cursor after closure or connection loss. Replayed events retain their IDs for deduplication.

Invalid subscriptions return JSON-RPC errors before SSE opens. Bad arguments/cursors use `-32602`; unknown event names use `-32011` with `data.kind: "event"`; unauthenticated event calls use `-32012` in development, while production's outer endpoint authentication rejects them with HTTP 401. Kid/site-login cookies never authorize event reads. The existing parent bearer credentials and password-query compatibility apply; prefer bearer authentication.

Webhook delivery is not advertised. `events/subscribe` and `events/unsubscribe` return `-32014` with `data: {"feature":"deliveryMode","value":"webhook"}`. A client must support polling or push to receive these events. No webhook endpoint, signing secret or subscription registry is needed.

## Operations and verification

`chores_notification_status` continues to inspect Telegram's outbox. MCP delivery is driven by each client's saved cursor, with no server-side subscription list. The existing QStash drain remains responsible for Telegram retries; MCP reads the independent journal directly. The journal uses `:events:log` and `:events:sequence` under the existing namespace. Its sequence survives journal expiry so stale clients get an explicit gap instead of silently restarting at zero.

`events.test.ts` covers notification parity, replay/pagination, pauses, age/retention gaps, authentication and protocol errors, SSE routing, heartbeats, cancellation, transient errors and revocation. The disposable Redis integration test checks atomic notification fan-out during concurrent/retried commands and after Telegram failure/success. The HTTP MCP test checks capability discovery, a real fixture kid command, SSE delivery, heartbeat and cursor replay after disconnect. All mutation tests use fixtures or disposable Redis keys and injected Telegram senders.
