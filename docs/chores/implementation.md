# Chores implementation and delivery history

The only supported product is [mxstbr.com/chores](https://mxstbr.com/chores). The [inventory](inventory.md), [scope](rebuild-scope.md), [coverage](coverage.md) and [management guide](managing.md) describe current behavior.

## September 22: recover always-open boards after deployment

The September 21 rename removed `/api/chores2/board` while already-open iPads continued to call it. Its HTML 404 response reached `response.json()`, producing Safari's “The string did not match the expected pattern” error. Retrying the same obsolete path could never update the document, leaving the previous Night header and loading columns until manual Refresh.

The page and API now carry the same build identity, generated in next.config.ts and compiled into both server bundles. The first live check found that this older Vercel project does not expose deployment environment variables, so version detection deliberately does not depend on them. A version mismatch, missing endpoint, non-JSON response or malformed JSON triggers a document reload when no busy or uncertain save remains. A session-storage guard limits automatic reloads to once per five minutes; if storage is unavailable, the board asks for manual Refresh rather than risking a reload loop. Failed writes retain the exact request ID until retried or dismissed when definitively rejected. Reads time out after 10 seconds, and focus/visibility/online/pageshow replace suspended reads. Ordinary network failures continue data retries with a friendly error. The legacy routes remain removed, and no data migration occurs. Pre-fix tabs require one Refresh to load recovery support.

Verification: all 33 deterministic checks and the five existing Chromium iPad flows passed. Seven new recovery cases passed in both Chromium and WebKit at 1024×680. The clean production build passed; the essay sync found no changes. These are automated browser checks, not a new physical-iPad test.

## September 21: remove the legacy implementation and canonicalize names

The live board uses `app/(chores)/chores`, `app/lib/chores`, `/api/chores/*`, `pnpm chores`, and six authenticated `chores_*` MCP tools. Tests use `pnpm test:chores` and `playwright.chores.config.ts`; development switches use `CHORES_*`. The behavior collection lives in `docs/chores`; AGENTS.md requires updating it in the same commit whenever behavior changes.

Removed: the old board and prototype, old parent/admin/reward/packing and approval-link pages, legacy ChatGPT pages/MCP tools/CLI, bedtime-recognition cron endpoint, speech/audio-list endpoints, unused sound assets and ChatGPT UI wrapper, importer and balance-cutover scripts. Fixtures now construct current records directly. The unrelated finance PIN helper is owned by finance, and the remaining calendar assistant uses the current Pacific-date helper without legacy chore instructions.

This is not a data migration. `chores:mxstbr:v2` remains the live Redis storage namespace. Keep balances, catalog IDs, orders, daily records, awards, pending submissions, receipts, devices and the outbox. The archived source snapshot/history is retained; no old dataset is restored or synchronized. `compatibility.ts` documents the limited stored identifiers needed for pre-rename submissions, device cookies and CLI request deduplication. New submissions and session cookies use the canonical name.

Notification retries use the existing QStash account and a single `chores-notification-drain` schedule pointing to `/api/chores/notifications`. After deployment, `pnpm chores notifications-setup` creates/updates that schedule and removes the retired destination. No new infrastructure or Telegram conversation flow is introduced. Already-open iPads need one Refresh to load the renamed API paths.

Verification: 33 deterministic checks, five iPad browser flows, four real-authentication checks, one authenticated MCP transport check, and one disposable Redis concurrency/outbox check passed. The final clean production build passed after all legacy removals. Against that build, 11 retired URLs returned 404, the six canonical MCP tools and authenticated board worked, and the live catalog, orders, packing and balances matched the pre-cleanup snapshot. Production deployment `97b3f32` is READY. Read-only production checks confirmed all 11 retired URLs return 404, the canonical board/API and six MCP tools work, and catalog/order/packing/balances remain unchanged. The existing QStash account now has one active `chores-notification-drain` schedule at `/api/chores/notifications`; the former destination is removed. No test completions, redemptions or Telegram messages were sent. Browser tests use a 1024×680 viewport, not a new physical-iPad check.

## September 23: draft MCP Events

The existing authenticated `/api/mcp` endpoint advertises `chores.notification` with webhook delivery only, using `events/list`, `events/subscribe` and `events/unsubscribe`. The journal still commits the same notification ID/text/metadata atomically with domain changes and Telegram's outbox. Verified HTTPS callbacks receive Standard Webhooks signatures, finite TTL grants, secret rotation and independent durable retries. The existing QStash minute drain and command background work process both channels. No new infrastructure or live-data migration is required. See [the pinned draft and operating contract](mcp-events.md).

**Not current behavior:** public polling and SSE Events delivery. Removed methods return Unsupported; the normal MCP tool transport remains available. Kid cookies do not authorize subscription operations. Redis leases serialize subscribe/refresh/unsubscribe with workers, and callback DNS is validated and pinned on every request.

Verification covers deterministic fixture-command parity, webhook protocol/authentication, signed verification, retries and safe cursors, principal isolation, TTL/secret rotation, replay/gaps and SSRF restrictions. Disposable Redis tests exercise atomic fan-out, concurrent worker claims and fenced subscription writes. HTTP MCP checks cover capability discovery, existing parent tools and webhook-only delivery. Tests use injected receivers and disposable records, without live chore completions or Telegram test messages.

The webhook revision passed 56 deterministic checks, two disposable Redis integration checks, two HTTP MCP checks, and a clean production build. Read-only checks against that build confirmed webhook-only discovery, all six chores tools, parent authentication, input validation, and explicit rejection of polling/SSE. No callback subscriptions or live chore changes were created by those checks.

The subsequent [webhook conformance audit](mcp-events-conformance.md) checked the latest merged draft and the working group's draft requirement map. It corrected missing-subscription/quota errors, TTL clamping, unsupported-mode errors, production Forbidden responses and a `maxAgeMs` replay edge case. Sixty deterministic checks and two disposable Redis integration checks passed, including signature verification with the official Standard Webhooks library. The isolated `pnpm exec next build` passed compilation, TypeScript and all 67 static pages. Read-only HTTP checks against that production build passed discovery, existing tools, negative inputs, missing subscriptions, and HTTP 401 plus JSON-RPC Forbidden. No callback subscription or chore change was created. The build-only command deliberately omits this repository's separate essay-sync step.

## September 23: earlier Morning cutoff and Before lunch

Morning now opens at 7am and closes at 7:30am Pacific for every child. The new `before-lunch` period covers 7:30am–noon; Afternoon, Evening and Night keep their existing windows. Shared window/label definitions drive the board header, next-boundary refresh, command schemas, catalog metadata and period notifications. The current-period card says “Finish before lunch.” Existing Morning assignments remain in place; the new group starts empty until a parent assigns work.

Current/future saved day plans refresh their cutoffs through the existing transaction path. Before changing a saved occurrence, earlier submissions retain its original window as `acceptedWindow`; new submissions record that window on acceptance. Parent review uses it, keeping previously on-time requests approvable after a deadline change without reopening late submissions. Past days, saved completions, balances and ledger entries are preserved. Before lunch follows the existing nonempty +2 period-bonus rule.

Verification includes both DST seasons, exact 7:30am/noon boundaries, assignment/order/bonus behavior, rejection of stale Morning submissions, preservation of earlier acceptance windows/history, and the UI transition with both deadline labels.

All 63 deterministic checks, one disposable Redis integration check, two HTTP MCP checks and 13 Chromium browser flows passed. The new 7:30am transition also passed in WebKit at the iPad viewport. TypeScript and the isolated production build passed. Browser checks are automated, not a new physical-iPad test; fixture completions do not alter live chores or send Telegram messages.

## Current verification commands

```sh
pnpm test:chores
CHORES_REDIS_TEST=1 pnpm exec tsm --test app/lib/chores/repository.integration.test.ts app/lib/chores/webhooks.integration.test.ts
pnpm exec playwright test --config playwright.chores.config.ts
CHORES_HTTP_TEST=1 pnpm exec tsm --test app/lib/chores/mcp.integration.test.ts
CHORES_LOGIN_TEST=1 pnpm exec playwright test --config playwright.chores.config.ts
pnpm build
node scripts/render-chores-behaviors.mjs
```

Start a fresh fixture server for the kid flow and HTTP MCP test. The login suite uses a fresh Webpack server without fixture auth (the local Turbopack dev runtime loses cookie request scope in route handlers), existing site credentials, read-only production catalog/board access and temporary revocable test sessions. Redis concurrency tests use disposable verification keys and injected notification senders; they do not send test Telegram messages. Build from a clean checkout excluding unrelated local work. Verify removed routes return 404 against the production build; this repo’s existing top-level not-found page lacks a root layout in Webpack dev mode.

## September 21: hidden requirements, blackout and Telegram

Parent-hidden chores stop counting toward requirements even after opening, including pending or undone submissions. Hidden work earns no chore stars. Remaining nonempty completed periods earn +2, empty periods earn nothing, and ordinary missed unmuted work stays missed. Resuming before cutoff restores eligibility; after cutoff it cannot restore expired requirements. Exact undo and late review preserve accepted snapshots. Domain and disposable-Redis concurrency checks, live read-only plan inspection, and a clean production build verified the fix.

Five idle minutes can trigger pure black only from 8:30pm inclusive to 6am exclusive in America/Los_Angeles, following DST. The screen wakes at 6am or on tap. There is no moon/text or hardware brightness control.

New Telegram completion messages include child, emoji/title, +stars and total, without a chores prefix or trailing completion ID. Period bonus messages include +2 and the total without a date. IDs remain in the ledger and inspection tools. Notification delivery is at least once: a crash between Telegram delivery and saving its receipt can repeat a message, never a star award.

## September 19: promotion and focused kid flow

The current board was promoted to `/chores`; only current star balances were reconciled at that time. The old board temporarily moved to the now-deleted trial route. The period-card picker replaced Choose another; the repeated progress line and Hear it were removed. The +2 period bonus replaced the former +10 daily bonus; historical daily credits remain. Rewards returned to a shared tab. Finished/empty/pending columns became subdued, and Refresh reloads the full document.

## September 9: original independent trial — historical

The trial copied the catalog and recorded history once into independent keys in the existing Upstash service: 41 chores, 12 rewards, 971 legacy ledger records, 10 redemptions and 108 history days. Opening balances were reconciled exactly, with one undated credit explicitly identified. Original records and migration provenance remain archived. The importer and balance-cutover code are now deleted and must not be rerun.

Implementation commit `70bec91c6dee175103df26f15a3149615acb704a` passed its local/Vercel build and browser, timing, concurrency, balance, invitation and MCP checks. Later updates are authoritative; those historical checks do not establish current behavior by themselves. The existing site-password login subsequently replaced mandatory invitation transfer; invitations remain optional.
