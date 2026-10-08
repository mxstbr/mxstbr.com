# Pebble Index recordings in ChatGPT

This is a personal integration for Max and Sue on the existing `https://mxstbr.com/api/mcp` server. There is no registration service or additional MCP deployment.

| Person | Pebble webhook URL                        | Event                          |
| ------ | ----------------------------------------- | ------------------------------ |
| Max    | `https://mxstbr.com/api/pebble-index/max` | `pebble.max.recording.created` |
| Sue    | `https://mxstbr.com/api/pebble-index/sue` | `pebble.sue.recording.created` |

## Setup

Run `pnpm pebble:setup` with the existing server environment loaded. It writes a private, gitignored `.env.pebble-index-setup.html` file containing each person's signing secret and scoped MCP bearer token. The command does not print credentials. The file must match the production environment; verify its tokens against production before handing it to either person. Do not commit or share it publicly.

In the Pebble phone app, open Index 01 → Webhook, select a recording gesture, enter that person's URL, choose **Both**, enable **Sign requests**, and paste their signing secret exactly. Save. Repeat for the other gesture, or use Copy from. No Authorization header is needed. Use Webhook only as the gesture action if you want to skip Pebble's assistant processing. Ring gestures routed to Nothing do not send. Typed notes have text only.

Refresh the existing family MCP plugin in ChatGPT to discover the new events. Alternatively, connect the same MCP URL using each person's scoped bearer token. Those tokens expose only the two Pebble read tools and that person's event; they cannot invoke family/calendar/finance/chores tools or access the other person's recordings. Existing family credentials remain administrative and can access both streams and the existing tools. Cookies do not authorize MCP events.

In a Work chat on ChatGPT web, or Work with Cloud selected on desktop, ask ChatGPT to subscribe to the appropriate event and specify the action to take for each recording. `events/subscribe` is the subscription mechanism; ordinary “subscribe” tools are unnecessary. Ask for individual-event handling with batching disabled if one task run per recording is important. ChatGPT's batching configuration controls whether several events share a task run.

Subscribe first, then press **Send test event** in Pebble. A test is forwarded with `isTest: true`. Confirm that ChatGPT receives it, then record a real note. A successful Pebble upload acknowledges durable storage, even when there is no ChatGPT subscription yet. Subscriptions without a saved cursor start from now. Stop monitoring in ChatGPT to unsubscribe.

## Audio and text

Pebble version 1 supplies its resampled mono, 16 kHz AAC-LC recording in an M4A file (`audio/mp4`), text, or both. The webhook receiver preserves those bytes. The event includes a private download URL, byte count, SHA-256, recording time, receive time and optional Pebble transcription. The event's timestamp is receipt/creation time; `data.recordedAt` preserves capture time, including delayed ring transfers. Transcription is explicitly labeled `pebble`; this server does not call an AI model or charge for transcription.

ChatGPT's Events documentation defines JSON event bodies, with a 256 KiB limit, and recommends read tools for larger records. It does not promise automatic transcription of linked M4A files. **Both** is the reliable setup: text is immediately available and the original audio is retrievable. Recording-only mode is accepted, but the consuming automation must be able to download/process audio. No OpenAI-transcription claim is made without testing that workflow in the actual ChatGPT account.

`pebble_get_recording(owner, recordingId)` returns the full text and a standard MCP resource link to the original audio. `pebble_list_recordings(owner, limit)` recovers recent notes after a gap or initial setup. Audio links are signed, expire with their recording, and cannot be reused for another owner or ID. Downloads are private/no-store. Anyone holding a link can use it until expiry, so avoid publishing it.

Audio, full text and replay history are retained for seven days, with a maximum of 1,000 journal entries per person. Individual metadata/audio also expire automatically. Uploads allow 4 MB of audio and 64 KiB of transcription; the total multipart cap remains below Vercel's function request limit. Event text is summarized to 4,000 Unicode characters and marked `transcriptionTruncated` when necessary. No audio is embedded into the webhook JSON.

## Protocol and delivery

Research checked October 8, 2026:

- [Pebble's developer webhook documentation](https://developer.repebble.com/index-01/webhooks/) — raw multipart HMAC prefix, version 1, per-gesture setup, timing, audio encoding and published signature fixture.
- [OpenAI's release announcement](https://learn.chatgpt.com/docs/whats-new/september-28-october-2-2026) and [ChatGPT MCP Events requirements](https://developers.openai.com/plugins/build/mcp-events).
- [Events and Triggers WG draft at commit 6682596](https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/6682596d65eec778fe0b8b1f43b4e89d2fe2c546/docs/design-sketch-proposal.md), still the merged main revision when checked.
- [MCP 2026-07-28 Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http) and [schema](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/schema/2026-07-28/schema.ts).
- [Connecting and refreshing private ChatGPT plugins](https://developers.openai.com/plugins/deploy/connect-chatgpt).

The existing SDK continues serving legacy initialization and tools. A stateless MCP 2.0 adapter adds `server/discover`, required request metadata/header validation, `resultType: complete`, server identity metadata, and tool/event calls without initialization. Tools execute through the existing SDK's public in-memory transport, keeping schema validation and business logic in one place. Modern clients receive proper HTTP 400 for header/version failures, 404 for unknown methods, and 401 for unauthenticated requests. Origins are checked. No session is minted for MCP 2.0.

The same authenticated endpoint implements event discovery, subscribe/refresh and unsubscribe. Subscriptions use stable IDs derived from principal, exact URL, event name and empty arguments, with a one-hour default grant clamped to one minute–one day. State, leases, pending retries, callback verification and signing secrets persist in Redis for the grant. Each owner has separate storage and authorization. Credential revision checks revoke old subscriptions.

Before delivering any recording, the server verifies the HTTPS callback with a signed single-use challenge and constant-time echo comparison. All callbacks use the existing DNS/IP pinning, public-address validation, TLS validation, redirect rejection and five-second deadline. Outbound events use Standard Webhooks headers and HMAC over the exact serialized body; the phone's incoming signature scheme is different and independently verified. Secret refresh dual-signs for five minutes. Event IDs remain stable across retries; each retry receives a new timestamp/signature.

Each recording retries independently, up to five attempts over fifteen minutes, with 30/60/120/240-second backoff rounded by the minute drain. 2xx acknowledges; 410 and 413 abandon that event. Cursors never skip earlier pending events. ChatGPT subscriptions suppress unsupported `gap` and `terminated` control notifications; gaps are retained as `truncated: true` on the next refresh. Modern unsubscribe is idempotent. Legacy chores clients keep the older draft controls and missing-subscription error. Polling/streaming Events are not exposed.

## Operations

Both new webhook routes authenticate raw version-1 multipart bytes with HMAC-SHA256, enforce a five-minute timestamp window, and deduplicate delivery IDs atomically with recording/journal storage. Duplicate uploads return success without creating another event. Dedupe receipts last 30 days. Failed writes are not acknowledged. Pebble does **not** automatically retry failed uploads; use its Recent runs and re-send/reprocess as supported by the app.

Successful uploads and subscriptions kick an immediate background drain. The existing signed QStash `chores-notification-drain` invokes `/api/chores/notifications` every minute and now also drains both Pebble streams, independently of chores notification pauses. No new cron or heartbeat is needed for this transport retry worker. Existing chores data keys and the legacy `/api/pebble-ir` and `/api/pebble-index/recordings` ingestion workflow are unchanged; configure the new URLs for MCP events.

No new secret is required on the existing deployment: server-only `PEBBLE_INDEX_SECRET`, when configured, is the root; otherwise the existing Redis credential is used as the HMAC root. Domain-separated derivation produces independent owner/purpose credentials and never exposes the root. Optional overrides are `PEBBLE_INDEX_MAX_WEBHOOK_SECRET`, `PEBBLE_INDEX_SUE_WEBHOOK_SECRET`, `PEBBLE_INDEX_MAX_MCP_SECRET`, `PEBBLE_INDEX_SUE_MCP_SECRET`, and per-owner `AUDIO_SECRET` counterparts. Root rotation revokes all derived credentials and links; per-purpose overrides permit independent rotation. Use at least 32 random bytes for newly configured secrets. Apply configuration changes to production and redeploy before regenerating setup instructions.

Verification commands:

```sh
pnpm test:pebble
pnpm test:chores
PEBBLE_REDIS_TEST=1 pnpm test:pebble
CHORES_REDIS_TEST=1 pnpm exec tsm --test app/lib/chores/repository.integration.test.ts app/lib/chores/webhooks.integration.test.ts
pnpm exec tsc --noEmit --incremental false
pnpm build
```

Redis checks use disposable namespaced data and clean it up. Deterministic tests cover the independent Pebble signature fixture, Unicode and original audio preservation, auth/replay/size failures, account isolation, exact signed event bytes through the official Standard Webhooks verifier, out-of-order retry watermarks, worker recreation, rotation, gaps and idempotent unsubscribe. HTTP checks cover modern discovery/tool calls and legacy chores transport. The actual phone → ChatGPT task boundary must be confirmed with Send test event after the two personal connections are configured.
