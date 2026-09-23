# Current chores scope and acceptance rules

Updated September 23, 2026 for MCP Events, following the legacy-removal and canonical-name implementation `97b3f32`. The [current inventory](inventory.md) and its [structured records](rebuild-features.json) enumerate all 123 original IDs and three added requirements. The [legacy audit](legacy-inventory.md) is historical evidence, not the current contract. Explicit exclusions are labeled **Not current behavior** in every current index.

## Product and access

The current product is `/chores`, displayed on the existing old iPad in landscape, with Dilan, Darian, and Devina in persistent columns. The user reported iPadOS 17.7.10; no exact hardware model is assumed. Verification uses a 1024×680 browser viewport. A separate phone layout, portrait layout, or child-selector deep link is **not current behavior**.

Already-unlocked iPads reuse the existing site-password cookie; otherwise enter the same password. Invitation links remain optional. Requiring a transferred setup link or introducing a parent setup portal is **not current behavior**. A shared unlocked board grants kid actions for the authorized children; parent mutations require authenticated tools.

Parents talk to ChatGPT using `chores_*` MCP tools or `pnpm chores`. Telegram delivers notifications. Dedicated parent screens, PIN/admin workflows, Clippy, conversational Telegram commands, and Telegram approval/undo buttons are **not current behavior**. These exclusions apply even where a parent capability (such as editing a chore) is retained through tools.

Authenticated MCP clients receive the same new notifications as Telegram through webhook-only draft events/list, events/subscribe and events/unsubscribe under chores.notification. Verified HTTPS receivers use client-supplied Standard Webhooks secrets. Subscriptions are isolated by authenticated principal and URL, expire after a negotiated one-minute to one-day grant, and retain signed independent retries in Redis. Payloads preserve the exact notification text and stable ID. The journal is committed atomically with the domain change, independent of Telegram, with up to 5,000 events from seven days for replay. Clients refresh before expiry, retain safe cursors, deduplicate eventId and inspect authoritative state after truncated or gap. Public polling and SSE Events delivery are not current behavior; kid cookies never grant event access. See [the draft contract and receiver requirements](mcp-events.md). Receiving an event never approves a chore.

There is one implementation at `/chores`, with `/api/chores/*` and `app/lib/chores`. The retired board, prototype, legacy MCP tools and CLI, importer, and balance-cutover code are deleted. The existing `chores:mxstbr:v2` Redis namespace is a storage schema version; it stays in place with all live balances, history, catalogs and pending approvals. Compatibility for stored submission sources, device cookies and CLI receipt identity preserves existing operations. Reimporting, resetting data, continuing legacy synchronization, or restoring the retired implementation is **not current behavior**.

## What kids can do now

- **As a kid, I can focus on one actionable chore in my column**, recognize its assigned emoji/title/stars, and complete it directly or request its explicitly required approval.
- **As a kid, I can choose another current chore by tapping the Finish this {timeframe} card.** This is a temporary selection, not a skip or reorder. A dedicated Choose another button and a second repeated completion-count line beneath the card are **not current behavior**.
- **As a kid, I can reach untimed Bonus chores anytime**, subject to assignment/date/recurrence rules. Completing the required routine never automatically assigns Bonus work.
- **As a kid, I can tell at a glance whether I have outstanding work.** Active columns are colorful and raised. Finished, empty, and awaiting-parent states are subdued and distinct; errors, loading, and unconfirmed saves never claim an all-clear.
- **As a kid, I can browse and redeem my rewards** through the shared Chores/Rewards tabs or my own star balance. Packing and counts-only daily history remain available as secondary panels.
- **As a kid, I can refresh the entire document** with Refresh, and have secondary panels return to current chores after 90 idle seconds. An API-only manual refresh is **not current behavior**. The board also detects changed deployments and incompatible API responses and reloads automatically when no save is busy or uncertain, limited to once per five minutes per tab. Reads time out after 10 seconds; wake/reconnect/pageshow replaces suspended reads, and ordinary network failures keep retrying data without a document reload.

Chore-title read-aloud, Hear it controls, and the speech endpoint are **not current behavior**. Short completion/redemption sound effects and celebrations remain. The accepted one-chore interface is implemented; it is no longer merely a design proposal.

## Authoritative time and order

| Pacific period | Opens (inclusive) | Closes (exclusive) |
| -------------- | ----------------- | ------------------ |
| Morning        | 7am               | noon               |
| Afternoon      | noon              | 5pm                |
| Evening        | 5pm               | 8:15pm             |
| Night          | 8:15pm            | 10pm               |

Between 10pm and 7am only eligible untimed Bonus work is available. Other named time groups, previews, expansion controls, persistent-open groups, and the old Evening/Night overlap are **not current behavior**. A boundary removes previous timed cards and resets stale selections. The service enforces current eligibility independently of URLs, client clocks, or stale screens.

Use the saved per-child/per-group order. The [September 8 list](routine-order.md) was the initial sequence; subsequent explicit parent edits are authoritative. Weekday/availability filtering preserves relative order. Sorting by stars, title, type, newest-first creation time, or model priority is **not current behavior**.

Weekly routines require one or more selected weekdays. A stored weekly routine with no weekdays is ineligible, not an everyday routine. Daily routines retain their existing behavior: omitted or empty weekdays mean every day; nonempty weekdays filter eligibility.

## Completion, muting, and stars

New early, past-day, or elapsed-window completions/approval requests are **not current behavior**, for either kids or parents. An unfinished one-off does not automatically carry overdue work forward. A request actually accepted on time remains approvable later, including after midnight. Later approval uses the original occurrence, timestamp, and star amount without reopening its kid card.

Exactly **+2 stars per child/Pacific day/nonempty named period** are awarded when all remaining required occurrences are approved. Untimed Bonus work does not enter this target. A +10 daily award, daily-bonus dialog, payout for an empty period, skip credit, or a separate Bonus-period award is **not current behavior**. Daily summaries remain counts-only; recorded historical daily credits are preserved.

A parent mute/availability edit excludes the affected work from the requirement immediately, even after opening and even with pending/undone history. Keeping parent-hidden work required is **not current behavior**. Hiding gives no chore credit; completing the remaining nonempty period can earn its +2. Hiding every requirement makes the period empty and removes any now-unearned period award. Ordinary missed work that was never parent-hidden remains missed, even though its expired card is absent.

Resuming before cutoff can restore a requirement and reconcile the period bonus; resuming after cutoff cannot reinstate expired work. Snoozes use an exclusive reappear date; `pausedUntil` is inclusive. Preserve accepted submissions and original ledger facts. Exact undo reverses the recorded credit and affected bonus, with at most one net award after legitimate re-completion. A second manual deduction for the same undo is **not current behavior**.

Kids can review/undo only displayed current-window and current-day untimed completions. Parents can inspect historical records and perform exact undo or explicit independent star adjustments through tools. Skip, skip confirmation/unskip, and skipped progress/bonus/notification flows are **not current behavior**.

## Shared display and notifications

Five minutes of inactivity can black out the screen only **8:30pm inclusive–6am exclusive, America/Los_Angeles**, including DST. An already-idle display can black out at 8:30pm and automatically clears at 6am. Tap to wake still works. Daytime blackout, visible moon/text on the black screen, and claimed control of the iPad hardware backlight are **not current behavior**.

Current Telegram completion messages show the chore, +stars, and total without `[Chores]` or a trailing completion label/ID. Bonus messages show `+2 bonus stars` and the total, without the occurrence date. Approval requests retain identifying information needed to resolve them; agents use day/approval tools for exact IDs. Delivery retries do not repeat the domain operation, but Telegram delivery itself is at least once, not a guarantee of exactly-once messages.

The special last-night bedtime recognition templates, selections, generated morning chores, status pages, and dedicated reminders are **not current behavior**. Generic evening/night chores remain configurable. Shared packing remains supported across devices and parent agents; browser-only packing is no longer the authoritative store.

## Priority and maintenance

K07–K09 daily summary navigation/Today/idle return and K59 system light/dark appearance remain implemented at lower priority. They are not removed. The exhaustive [not-current-behavior register](inventory.md#explicitly-not-current-behavior) covers removals and rejected parts of otherwise retained capabilities.

Update `rebuild-features.json` first, then run `node scripts/render-chores-behaviors.mjs` to refresh the inventory, disposition index, and coverage. Keep these scope rules and the current UI notes consistent with those records. Commit behavior-document updates alongside each chores behavior change, preserving explicit exclusions. The cleanup changes names and removes retired surfaces without migrating live chores or stars.
