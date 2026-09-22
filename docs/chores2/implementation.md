# Chores2 implementation

Status: promoted to https://mxstbr.com/chores; the legacy board is at https://mxstbr.com/chores2. The original trial and its verification are recorded below. The goal covers every retained/revised/lower-priority requirement in rebuild-features.json plus K70/P55 and the approved playful iPad concept. Removed capabilities are explicitly excluded from the new product.

## Overnight blackout — September 21, 2026

The five-minute idle blackout is enabled only from 8:30pm (inclusive) to 6am (exclusive) in `America/Los_Angeles`, including daylight saving time. At 8:30pm an already-idle display can black out; at 6am it automatically returns to the board. Activity resets the idle delay, and tapping the black screen still wakes it. Focus and visibility changes recheck the schedule after a suspended browser resumes. Daytime inactivity continues to return secondary panels to the current chores without blacking out the display.

Verification covers the reported 6:52pm case, both exact boundaries, the five-minute delay after waking, a device set to Tokyo time, and winter/summer/DST date calculations. All five iPad browser checks and 34 deterministic checks passed.

## Period bonus correction and chore picker — September 19, 2026

The two-star award for each completed nonempty time period replaces the ten-star daily bonus. Completion, late approval, undo/re-completion, and lazy board reconciliation never create new daily awards. Historical credits and current balances remain recorded. The daily progress API keeps counts with zero bonus stars and no daily earned flag for existing clients. The daily reward offer and celebration dialog are removed.

The “Finish this {timeframe}” card now opens the current chore picker; the separate “Choose another” button is removed. “My progress” is available inside the picker. Bonus chores retain their return link to the main routine.

## Promotion to /chores — September 19, 2026

The page trees have traded places: the focused kid board is `/chores`; all legacy pages (including rewards, packing, admin, and approval links) live under `/chores2`. Existing site-password logins continue working. The new product retains its `chores2_*` MCP names, `/api/chores2/*` endpoints, and `chores:mxstbr:v2` storage keys so devices, agents, and notification delivery keep working. MCP instructions and repository guidance select the new product by default. New notifications use `[Chores]`.

Only balances are reconciled. Run `pnpm exec tsm scripts/promote-chores.ts initial` for a dry run, then append `--apply` immediately before deploying. After production is ready, run the same command with `final --apply` to carry any legacy star changes during deployment. Both phases use atomic checks against the source and destination and a permanent audit marker, making retries safe. Each difference is an explicit adjustment in the new ledger. No chore, reward, completion, entitlement, packing or historical record is copied or replaced. New-board activity during deployment is preserved by the final phase.

Verification includes the existing domain suite, real Redis cutover tests on disposable keys, the 1024×680 kid flow, inherited/password login, and old-board rewards/packing navigation under `/chores2`.

## Testing setup confirmed by Max

Use a completely separate setup in the existing Upstash database. Copy the current kids, chore and reward definitions, history, entitlements, and exact balances once. After initialization /chores2 is independent; it does not spend or award stars in /chores. Keep the legacy application and writers untouched during this trial. No new infrastructure or account.

Use versioned Redis keys with a small core catalog and balances, separate daily occurrence/submission/ledger records, command deduplication, and a durable notification outbox. A family revision coordinates atomic commits. Preserve the original snapshot with provenance and reconcile legacy reward debits exactly once. Packing was browser-local and can be imported once from the shared iPad.

Parent commands for the trial are explicitly named chores2 tools on the existing MCP endpoint. They reuse the existing authenticated MCP connection; a kid device session cannot invoke them. No Clippy credential is needed. Telegram is outbound notification-only for this product. Existing unrelated and legacy tools remain available.

Morning begins at 7am Pacific, retaining the existing baseline. Other boundaries: noon, 5pm, 8:15pm, 10pm. Between 10pm and 7am only eligible untimed Bonus work is available. Exact iPad/Safari hardware verification remains Max's acceptance step after deployment.

## Delivery checklist

- [x] Domain rules, occurrence snapshots, atomic ledger and idempotency
- [x] Migration and reconciliation against current live catalog/history
- [x] Kid sessions and parent-only MCP commands
- [x] Durable Telegram delivery and retry drain using existing infrastructure
- [x] Playful three-column iPad board and all secondary kid capabilities
- [x] Timing, concurrency, money, approval, migration and browser checks
- [x] Per-requirement implementation/verification mapping
- [x] Build, ship to master, verify mxstbr.com/chores2

## Verification and operational details

The source import completed on September 9, 2026 (Pacific), with 41 chores, 12 rewards, 971 legacy ledger records, 10 redemptions, and 108 history days. Opening balances reconciled exactly. The original raw snapshot is retained separately. One old credit had no ID/time and remains explicitly marked as undated; no chore or original timestamp was invented. Existing neutral white kid colors received the approved blue/orange/purple starting palette; the kid picker still supports white.

Commands:

- `pnpm test:chores2`: deterministic domain and migration tests.
- `CHORES2_REDIS_TEST=1 pnpm exec tsm --test app/lib/chores2/repository.integration.test.ts`: real Redis concurrency and outbox failure/retry checks, confined to disposable verification keys.
- `CHORES2_HTTP_TEST=1 pnpm exec tsm --test app/lib/chores2/mcp.integration.test.ts`: real local MCP transport with existing parent credentials and denied unauthenticated access.
- `pnpm exec playwright test --config playwright.chores2.config.ts`: isolated development fixture and 1024×680 browser flow. Start with a fresh fixture server for repeatable balances.
- `pnpm build`: passed in a clean checkout without unrelated workspace edits; existing essay sync reported no changes.

Chore-title speech was removed on September 19, 2026, at Max’s request: the kids can read their chores. The Hear it control, playback lifecycle, and `/api/chores2/speech` route are removed. Completion and reward sound effects remain.

As of September 21, parent-hidden chores are excluded from completion targets even after their window opens, including occurrences with undone or pending submissions. This applies to family/child snoozes, inclusive pauses, archival, removal of an assignment, and scheduling edits that hide the occurrence. The occurrence and accepted submission snapshots remain intact for history, late approval, and exact undo. Resuming restores a requirement while its window remains open; it cannot reinstate expired work. The exclusive reappear date creates normal requirements again on the following eligible day.

Catalog mutations and board reads reconcile the period bonus in the same atomic ledger transaction. Finishing all remaining tasks in a nonempty period earns exactly two bonus stars; an empty period earns none. Hiding grants no chore stars or completion credit. Existing saved plans are repaired on board read without repeating completion reversals or rewriting prior days. Ordinary expired, unmuted work still counts as missed. Current operating instructions are in [Managing chores](./managing.md).

Verification: 33 deterministic checks passed, along with the real Redis concurrency/outbox test on disposable keys and a production build in a clean checkout. A read-only preview of September 21's live plan waived only the three muted bed occurrences, preserved every submission and ledger entry, and left balances unchanged.

The new ledger and notification outbox commit atomically. Delivery is at least once: Telegram has no idempotent send API, so a crash after delivery but before its receipt is saved can repeat a notification, never a star award or redemption. One QStash schedule in the existing account drains retries every minute. Notifications use the existing chores group and are prefixed `[Chores2 test]` with no action buttons.

Use `pnpm chores2 help` for import/status/agent commands, device invitation and notification setup. Import refuses to overwrite existing Chores2 keys. Device invitation URLs expire after 24 hours and are consumed once; sessions last 90 days and can be revoked through MCP. Invite URLs must remain private and must not be committed.

## Production verification

Implementation commit `70bec91c6dee175103df26f15a3149615acb704a` passed the local build and Vercel production build, and was published through the existing master integration. Live verification confirmed all three columns at 1024×680, current-period-only payloads, counts-only summary, the six new MCP tools with existing parent authentication, and all 41/12 catalog definitions. A temporary invite was consumed once; its secure HttpOnly session could not adjust stars or call parent MCP tools. Replaying its invite failed, and revoking the test session immediately locked its board. No test chores were completed and no rewards purchased on the live copy.

The first board read settled the new period awards for already-completed work in the imported current day: Darian received four extra stars and Devina two. Those are explicit Chores2 bonus ledger entries after the exact opening-balance reconciliation; /chores received no changes.

The existing QStash account has schedule `chores2-notification-drain`, calling the signed production endpoint every minute. The browser verification used a temporary device session that was revoked; Max receives a separate fresh invitation for the iPad.

## Simplified iPad login

Chores2 accepts the same `password` cookie as the original chore board. An iPad already signed into the site opens /chores2 directly. An unsigned device can type the same existing site password on /chores2; the login is saved for a year with an HttpOnly cookie. The login grants kid-only commands against the separate Chores2 data. Parent MCP authentication remains explicit and separate from browser cookies.

Invitation links and scoped sessions remain optional for compatibility. Revoking an invitation session does not sign out an independently valid site-password login.

Run `CHORES2_LOGIN_TEST=1 pnpm exec playwright test --config playwright.chores2.config.ts` against a fresh local server without the fixture auth bypass to verify inherited login, password entry/persistence, invalid credentials, origin checks, and denial of parent commands. This suite only reads the separate board and makes rejected domain commands; it does not complete chores or purchase rewards. Credential tracing is disabled.
