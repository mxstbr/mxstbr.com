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

The existing authenticated `/api/mcp` endpoint advertises Events and serves `events/list`, `events/poll` and request-scoped SSE `events/stream`. The single `chores.notification` event mirrors every newly committed Telegram notification's ID, text and available occurrence/submission metadata. Its bounded Redis journal is written atomically with the domain operation and Telegram outbox. Command retries cannot duplicate journal entries; Telegram delivery cannot consume another client's replay history. Storage remains in the existing namespace. See [the pinned draft and operating contract](mcp-events.md).

Verification adds deterministic protocol/cursor/stream tests, disposable Redis concurrency and failure checks, and actual HTTP MCP discovery plus kid-command-to-stream-to-replay tests. The fixture board also renders with its normal controls and no error overlay. These checks do not send Telegram messages or create live chore completions.

The 48 deterministic checks and disposable Redis check passed after integrating the current master scheduling fix. The two HTTP MCP checks also passed. The clean production build passed; read-only checks against that build confirmed Events discovery, all six canonical chores tools, three kids, valid polling cursors, rejected kid-cookie access, SSE confirmation and a heartbeat from the real Redis-backed path.

## Current verification commands

```sh
pnpm test:chores
CHORES_REDIS_TEST=1 pnpm exec tsm --test app/lib/chores/repository.integration.test.ts
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
