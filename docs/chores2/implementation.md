# Chores2 implementation

Status: implemented; production release verification in progress. The goal covers every retained/revised/lower-priority requirement in rebuild-features.json plus K70/P55 and the approved playful iPad concept. Removed capabilities are explicitly excluded from /chores2.

## Testing setup confirmed by Max

Use a completely separate setup in the existing Upstash database. Copy the current kids, chore and reward definitions, history, entitlements, and exact balances once. After initialization /chores2 is independent; it does not spend or award stars in /chores. Keep the legacy application and writers untouched during this trial. No new infrastructure or account.

Use versioned Redis keys with a small core catalog and balances, separate daily occurrence/submission/ledger records, command deduplication, and a durable notification outbox. A family revision coordinates atomic commits. Preserve the original snapshot with provenance and reconcile legacy reward debits exactly once. Packing was browser-local and can be imported once from the shared iPad.

Parent commands for the trial are explicitly named chores2 tools on the existing MCP endpoint. They reuse the existing authenticated MCP connection; a kid device session cannot invoke them. No Clippy credential is needed. Telegram is outbound notification-only for this product. Existing unrelated and legacy tools remain available.

Morning begins at 7am Pacific, retaining the existing baseline. Other boundaries: noon, 5pm, 8:15pm, 10pm. Between 10pm and 7am only eligible untimed Bonus work is available. Exact iPad/Safari hardware verification remains Max's acceptance step after deployment.

## Delivery checklist

- [x] Domain rules, occurrence snapshots, atomic ledger and idempotency
- [x] Migration and reconciliation against current live catalog/history
- [x] Kid sessions and parent-only MCP commands
- [ ] Durable Telegram delivery and retry drain using existing infrastructure
- [x] Playful three-column iPad board and all secondary kid capabilities
- [x] Timing, concurrency, money, approval, migration and browser checks
- [x] Per-requirement implementation/verification mapping
- [ ] Build, ship to master, verify mxstbr.com/chores2

## Verification and operational details

The source import completed on September 9, 2026 (Pacific), with 41 chores, 12 rewards, 971 legacy ledger records, 10 redemptions, and 108 history days. Opening balances reconciled exactly. The original raw snapshot is retained separately. One old credit had no ID/time and remains explicitly marked as undated; no chore or original timestamp was invented. Existing neutral white kid colors received the approved blue/orange/purple starting palette; the kid picker still supports white.

Commands:

- `pnpm test:chores2`: deterministic domain and migration tests.
- `CHORES2_REDIS_TEST=1 pnpm exec tsm --test app/lib/chores2/repository.integration.test.ts`: real Redis concurrency and outbox failure/retry checks, confined to disposable verification keys.
- `CHORES2_HTTP_TEST=1 pnpm exec tsm --test app/lib/chores2/mcp.integration.test.ts`: real local MCP transport with existing parent credentials and denied unauthenticated access.
- `pnpm exec playwright test --config playwright.chores2.config.ts`: isolated development fixture and 1024×680 browser flow. Start with a fresh fixture server for repeatable balances.
- `pnpm build`: passed in a clean checkout without unrelated workspace edits; existing essay sync reported no changes.

Live speech-provider verification was rejected by automatic approval review because it sends a household chore title to OpenAI. The browser speech test intercepts the request and serves a local audio fixture; no external speech request is sent. The existing speech integration is retained, and physical iPad playback remains an acceptance check.

Catalog changes retain opened obligations and accepted submission snapshots. Future opportunities are amended; previously paused future work can resume while its window is still open. A scheduling change cannot turn missed work into completed credit. Parent historical undo and explicit manual adjustments remain available through exact IDs.

The new ledger and notification outbox commit atomically. Delivery is at least once: Telegram has no idempotent send API, so a crash after delivery but before its receipt is saved can repeat a notification, never a star award or redemption. One QStash schedule in the existing account drains retries every minute. Notifications use the existing chores group and are prefixed `[Chores2 test]` with no action buttons.

Use `pnpm chores2 help` for import/status/agent commands, device invitation and notification setup. Import refuses to overwrite existing Chores2 keys. Device invitation URLs expire after 24 hours and are consumed once; sessions last 90 days and can be revoked through MCP. Invite URLs must remain private and must not be committed.
