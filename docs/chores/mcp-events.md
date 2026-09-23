# Chores MCP Events

The authenticated `/api/mcp` endpoint implements the [Events working-group draft at commit 6682596](https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/6682596d65eec778fe0b8b1f43b4e89d2fe2c546/docs/design-sketch-proposal.md), checked September 23, 2026. Clients need support for that experimental draft. **Webhooks are the only MCP Events delivery method.** Existing MCP tools and Telegram notifications continue to work.

The working group calls this an experimental design sketch, not a ratified MCP specification. The [webhook conformance audit](mcp-events-conformance.md) records the requirements checked, regression fixes, and remaining verification limits. The unmerged capability-negotiation proposal is tracked there separately from the merged draft.

Initialization advertises `capabilities.events: {"listChanged": false}`. `events/list` returns `chores.notification`, its input/payload schemas, and `delivery: ["webhook"]`. The fixed catalog has one page. These are protocol methods, not additional LLM tools. Event arguments are an empty object.

Every newly committed Telegram notification also enters the event journal in the same Redis transaction as its chore operation. This covers approval requests, completions, approval updates, undo, period bonuses and reward redemptions whenever the domain produces those messages. Telegram success/failure cannot consume webhook events or affect callback retries. No historical import occurs; the journal began with the September 23 Events deployment. Existing balances, history, approvals and storage keys are preserved.

## Subscribe and refresh

POST JSON-RPC to `/api/mcp` using the same parent bearer credential used for chores tools. The receiver generates a random Standard Webhooks secret (`whsec_` plus base64 of 24–64 random bytes) and has it ready before subscribing. The server never generates or returns that secret.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "events/subscribe",
  "params": {
    "name": "chores.notification",
    "arguments": {},
    "delivery": {
      "mode": "webhook",
      "url": "https://receiver.example/hooks/chores",
      "secret": "whsec_<base64-of-32-random-bytes>"
    },
    "cursor": null,
    "ttlMs": 86400000
  }
}
```

Before activation, the server sends a signed `{"type":"verification","challenge":"..."}` POST. The receiver verifies its signature and echoes `{"challenge":"..."}` in a `2xx` response within five seconds. A reachable endpoint that fails the challenge produces `-32015 CallbackEndpointError` with `data.reason: "challenge_failed"`; network failures use a sanitized category. No chore data is delivered until verification succeeds. Verification is cached for up to one day per authenticated principal and exact callback URL; attempts are limited to one per destination host per ten seconds. No allowlist or well-known-document setup is needed: this implementation uses the challenge mechanism.

The subscribe result contains a deterministic `id`, `refreshBefore`, `cursor` and `truncated`. Repeat the request with the same credential, exact URL, event name and arguments before `refreshBefore`; pass the last cursor received. A live refresh continues pending delivery and cannot skip unacknowledged events, even if it supplies a newer cursor. It refreshes expiry and can replace the signing secret. Deliveries carry signatures for both old and new secrets for five minutes after rotation.

The default grant is one hour, with a one-minute minimum and one-day maximum. Every finite integer `ttlMs` suggestion is clamped into that range, including zero/negative or extremely large values; a fractional or non-number value is invalid. `ttlMs: null` receives the finite default; no-expiry subscriptions are not granted. Always follow the returned `refreshBefore`. Subscriptions and pending retries are retained in Redis for the grant, including across serverless workers and deployments. The server permits up to 64 active subscriptions. Site-password and automation credentials have separate subscription identities; knowing an ID does not authorize refreshing or deleting it. Rotating/removing the originating credential ends its subscriptions on the next drain.

Refresh responses also include `deliveryStatus` with `active`, `lastDeliveryAt`, and `lastError` (plus `failedSince` when applicable). Error values are categories such as `timeout` or `http_5xx`; callback response bodies, headers, URLs and secrets are never returned. This implementation does not suspend subscriptions after a handful of failures: it bounds each event's retries and keeps the subscription active until expiry, unsubscribe or revoked authorization.

## Receive deliveries

Each event is a plain JSON POST, not a JSON-RPC notification:

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
  },
  "cursor": "opaque-safe-replay-watermark"
}
```

`day` and `submissionId` are optional. Ordinary completion messages do not acquire a submission ID merely by being sent through MCP; resolve exact submissions through the day/approval tools. Payloads are untrusted data and do not approve requests or grant mutation authority.

Every POST includes `Content-Type: application/json`, `webhook-id`, `webhook-timestamp`, `webhook-signature`, and `X-MCP-Subscription-Id`. Signatures follow [Standard Webhooks](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md): HMAC-SHA256 over `webhook-id + "." + webhook-timestamp + "." + rawBody`, using the base64-decoded secret bytes and a `v1,` base64 signature. Verify the **raw bytes**, accept any valid signature during rotation, reject old timestamps, and deduplicate `webhook-id`/`eventId`. Control messages use IDs beginning with `msg_verification_`, `msg_gap_` or `msg_terminated_` and the same headers/signature scheme.

Durably accept or forward a delivery before returning `2xx`. Each event retries independently, so later notifications may arrive before an older failed delivery. Its cursor is a safe watermark that never skips an earlier unacknowledged event. Persist cursors from both deliveries and refresh results, and forward cursors/control messages to the consuming MCP client. Repeated delivery after a response/worker crash is possible; delivery is at least once with bounded retries, not exactly once.

A callback has five seconds to respond. Retry delays are 30, 60, 120 and 240 seconds, with at most five attempts and a fifteen-minute retry window. The existing minute drain may round these delays upward. `410 Gone` and `413 Payload Too Large` abandon only that delivery immediately. Exhausted deliveries are abandoned for cursor advancement; they can be recovered within journal retention by creating a fresh subscription with an earlier saved cursor. A quiet or paused system does not need an open MCP connection.

Callbacks must use HTTPS. Every verification and delivery resolves the hostname, rejects private/special-purpose addresses, and pins the connection to the validated IP while preserving TLS certificate checks and the original hostname. Redirects are never followed. Bodies are capped at 256 KiB. Receivers should use HMAC authentication rather than require a fixed Vercel egress IP.

## Replay, gaps and cleanup

A null or omitted cursor on a **new** subscription means start from now. To recover after expiry, re-subscribe with the saved cursor. Replay retains at most 5,000 notifications from seven days; `maxAgeMs` can shorten initial replay. Its time floor applies to the entire historical replay, including records whose timestamps differ from commit order, and survives worker changes. It does not age out future occurrences or move forward while a backlog is draining. `truncated: true` in the subscribe response signals skipped history. A gap discovered while the subscription is active sends a signed `{"type":"gap","cursor":"..."}` control message. Persist the cursor and inspect authoritative chores state after a gap. Global notification pause stops both Telegram and webhook delivery without advancing an existing subscriber past its queue; history still has its normal retention limit.

Explicit cleanup uses the same key; the returned subscription `id` is not an input:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "events/unsubscribe",
  "params": {
    "name": "chores.notification",
    "arguments": {},
    "delivery": { "url": "https://receiver.example/hooks/chores" }
  }
}
```

Unsubscribe returns `{}` for an existing subscription and `-32011 NotFound` with `data.kind: "subscription"` for a missing, expired or already removed subscription. Otherwise, stop refreshing and the grant expires. Revoked authorization removes the subscription and attempts a signed `terminated` control message containing a `Forbidden` error, without chore data.

**Not current behavior:** public `events/poll`, `events/stream`, SSE event notifications and heartbeats. Both removed methods and a subscribe request selecting poll/push return `-32014 Unsupported` with the requested delivery mode. Normal MCP tool transport is unaffected. Bad arguments/cursors use `-32602`; unknown event names use `-32011` with `data.kind: "event"`. Subscription and per-host verification limits return `-32013 ResourceExhausted`, with `data.limit` identifying the limit. Kid/site-login cookies do not authorize Events. Unauthenticated Events requests carry `-32012 Forbidden`; production also retains HTTP 401.

## Operations and verification

After each committed command, Telegram and webhooks drain independently in background work. Successful subscribe/refresh also kicks the webhook drain. The existing signed QStash `chores-notification-drain` runs every minute at `/api/chores/notifications` and retries both channels; there is no new schedule or infrastructure. The drain response reports each channel separately. `chores_notification_status` still reports Telegram's outbox; webhook clients inspect their own refresh responses. The draft intentionally has no subscription-list method.

The journal remains at `:events:log` and `:events:sequence` under `chores:mxstbr:v2`. Expiring subscription, retry, lease and verification records use `:events:webhooks:*` in the same namespace. Signing secrets live only in TTL-scoped subscription records, never in the event journal, API results or logs. Durable leases serialize worker delivery with refresh/unsubscribe and fence stale writers.

Deterministic checks cover real fixture-command notification parity, signed verification, independent retries and safe watermarks, principal isolation, TTL/secret rotation, pauses, revocation, replay/gaps, URL/DNS restrictions, and removal of poll/push. The official `standardwebhooks` receiver library independently verifies raw event/control bytes, rotation and retries, and rejects tampering and stale timestamps. Disposable Redis integration checks atomic journal/outbox fan-out, webhook concurrency, worker recreation, refreshes, lease fencing and atomic capacity errors. HTTP MCP tests check capability discovery, existing parent authentication and the webhook-only descriptor. Tests use fixture chores, disposable Redis keys and injected receivers; they do not send real Telegram notifications or complete live chores.
