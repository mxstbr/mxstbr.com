# Chores: current kid and parent behavior inventory

<!-- Generated from rebuild-features.json by node scripts/render-chores-behaviors.mjs. -->

Audited 2026-09-21 against application commit `97b3f32f1a02c09cc7062fb7060bcace0e841956`. Current product: **/chores**. The legacy implementation has been removed.

This is the current behavior reference for a rebuild. Positive capabilities describe the shipped system. **Not current behavior** explicitly rejects an old or superseded behavior; it must not be rebuilt merely because legacy code or an old prototype contains it. Lower-priority capabilities are still implemented unless marked removed.

123 original IDs + 3 added requirements = 126 records; 106 current capabilities, 20 removed capabilities, and 29 explicit not-current-behavior rules.

Use [scope and acceptance rules](rebuild-scope.md), [current iPad interface](ipad-landscape-ui.md), [coverage/evidence](coverage.md), and [agent operations](managing.md) for supporting detail. The [annotated legacy audit](legacy-inventory.md) preserves the historical source without presenting it as current behavior.

## Current decisions at a glance

- **deviceTarget:** The existing shared old iPad in landscape only; three persistent child columns. No phone, portrait, or desktop layout requirement.
- **routineOrder:** Use the saved per-child/per-group order. The September 8 message was the initial seed, not an immutable replacement for later parent edits. Filter weekday/ineligible/pending/completed work without reordering the remaining tasks; a picker selection does not change the saved sequence.
- **periodBonus:** Award exactly +2 per child/Pacific day/nonempty named period once all remaining required work is approved. Parent-hidden work is excluded, including after opening; hiding itself grants no chore stars. Ordinary missed work remains unfulfilled. Late approval of an on-time request can settle its original period. Undo or restored requirements reconcile the award without duplicate net credit. No extra daily bonus, empty-period payout, or Bonus-period award.
- **timedChores:** Only the active named window is kid-visible and accepts new submissions.
- **untimedBonusChores:** Remain available anytime, subject to date/assignment/recurrence eligibility.
- **approvalAfterCutoff:** An on-time accepted submission remains approvable later, including after its day ends.
- **pastCompletion:** No new backdated or elapsed-window submissions; later review of an on-time request is distinct.
- **skip:** Removed; no skip progress, bonus, or notification behavior.
- **parentSurface:** ChatGPT through MCP for parent management and approvals. Telegram only delivers notifications; no Clippy, Telegram conversation or action buttons, or dedicated parent UI.
- **bedtimeRecognition:** Dedicated last-night recognition/templates/generated chores/reminders removed.
- **dataIsolation:** There is one /chores implementation, using the existing chores:mxstbr:v2 storage schema and live data. The retired board, prototype, admin/approval pages, old MCP tools, import and balance-cutover scripts are deleted. The original import and promotion remain recorded history; no reimport, reset or balance synchronization occurs. No new infrastructure.
- **deviceAccess:** Reuse the existing site-password login; already-unlocked iPads open /chores directly. Otherwise enter the same password. Invitation links remain optional.
- **choreSwitcher:** Tap the Finish this {timeframe} card to choose a current chore. No separate Choose another button. My progress remains inside the picker.
- **choreSpeech:** Removed: the kids can read their chores; no Hear it control or speech endpoint.
- **namedWindows:** Pacific windows are Morning 7am–noon, Afternoon noon–5pm, Evening 5pm–8:15pm, and Night 8:15pm–10pm, with exclusive closing boundaries. Between 10pm and 7am only eligible untimed Bonus work is available. Old timed cards and secondary selections close at a boundary; accepted pending requests remain recorded.
- **hiddenRequirements:** Merge existing per-child snoozes when updating that map. Hidden work is waived from targets even with pending/undone submissions, without deleting history or awarding chore stars. An on-time accepted request can still be reviewed later.
- **blackout:** Five idle minutes can trigger pure black only from 8:30pm inclusive until 6am exclusive in America/Los_Angeles, automatically following DST. At 8:30pm an already-idle board can black out; at 6am it clears automatically. Tapping wakes and refreshes. Focus/visibility return rechecks the schedule. No visible moon or text appears; webpage blackout does not change the hardware backlight.
- **quietAllClear:** Outstanding chores keep colorful raised columns, a solid card, emoji, and action button. Finished, empty, or awaiting-parent columns are subdued and say All done for now, Nothing to do right now, or Your part is done, with Go play only when the current state is confirmed. Pending approval uses a clock; failures/loading do not show an all-clear. This concerns the current window, not the whole day.
- **refresh:** The shared Refresh button reloads the document and app code. Visible boards poll every 15 seconds and replace hung reads after 10 seconds. Focus, online, visibility return and pageshow restart the read. A deployment-version change or missing/non-JSON/malformed API response triggers a guarded document reload, at most once per five minutes per tab. Automatic reload waits for all busy or uncertain saves to resolve so their exact retry IDs survive. Network failures retry data and show a friendly reconnecting message.
- **rewardsNavigation:** The shared header has Chores and Rewards tabs and a Packing button. Rewards opens all three catalogs; a child’s star balance opens only that child’s catalog. Secondary panels remain inside the child’s column.
- **progressDisplay:** The period card contains progress stamps and the +2 offer or earned/pending state. No second “0 of 5 done” line appears below it. Daily history is counts-only. Parent-hidden occurrences are excluded from targets; pending approval is not completion. Empty periods offer no bonus.
- **telegramCompletion:** New completion messages show the child, chore emoji/title, +stars and total balance. They have no [Chores] prefix or trailing Completion label/ID. Undo updates remain supported; exact submission IDs are looked up through tools, not copied from completion messages.
- **telegramBonus:** A bonus message says the child earned +2 bonus stars for completing the period and includes the resulting total balance, without the occurrence date. Reward redemption updates include the cost and resulting balance. No daily-bonus, skip, or dedicated bedtime-recognition updates are generated.
- **packingPersistence:** Packing is shared in Redis across authorized devices and agents. A one-time import can carry over the old browser checklist; subsequent progress does not depend on that browser’s local storage.
- **featurePriority:** K07–K09 counts-only summaries and K59 system appearance remain implemented at lower priority. K04/K05 small-screen selection was superseded by the accepted landscape-only target and is excluded.
- **canonicalNames:** Use pnpm chores, `chores_*` MCP tools, `/api/chores/*`, app/lib/chores, app/(chores), and docs/chores. The old board and API routes no longer exist. Stored pre-rename submission sources, device cookies and CLI receipt identity remain compatible to preserve accepted requests, sessions and deduplication.
- **mcpEvents:** Authenticated MCP clients receive the same new notifications as Telegram through webhook-only draft events/list, events/subscribe and events/unsubscribe under chores.notification. Verified HTTPS receivers use client-supplied Standard Webhooks secrets. Subscriptions are isolated by authenticated principal and URL, expire after a negotiated one-minute to one-day grant, and retain signed independent retries in Redis. Payloads preserve the exact notification text and stable ID. The journal is committed atomically with the domain change, independent of Telegram, with up to 5,000 events from seven days for replay. Clients refresh before expiry, retain safe cursors, deduplicate eventId and inspect authoritative state after truncated or gap. Public polling and SSE Events delivery are not current behavior; kid cookies never grant event access. Missing subscriptions return NotFound; subscription/verification limits return ResourceExhausted. Every integer TTL suggestion clamps to the advertised grant range. Initial maxAgeMs applies across the full replay regardless of commit/timestamp ordering.

## Explicitly not current behavior

<a id="n01"></a>

### N01 — Small-screen child selection

**Not current behavior:** A phone/portrait layout, one-child selector, or deep link selecting a child is not current behavior or a rebuild requirement.

**Current behavior:** Use three persistent columns on the shared old iPad in landscape.

Applies to K03, K04, K05. Basis: explicit decision.

<a id="n02"></a>

### N02 — Other-day chore browsing

**Not current behavior:** Navigating dates must not display past/future chore lists or their completion controls.

**Current behavior:** Daily history is counts-only; the actionable board stays on today and the current period.

Applies to K06, K07, K08, K09, K12, K32. Basis: explicit decision.

<a id="n03"></a>

### N03 — Opening other time groups

**Not current behavior:** Expanding/collapsing other named groups, keeping them open manually, and group recollapse timers are not current behavior.

**Current behavior:** Only the current named period and eligible untimed Bonus chores are reachable.

Applies to K12, K15, K17, K18, K19. Basis: explicit decision.

<a id="n04"></a>

### N04 — Overlapping Evening and Night

**Not current behavior:** The old 7pm Night opening and simultaneous Evening/Night display are not current behavior.

**Current behavior:** Evening ends and Night begins at 8:15pm Pacific; all named windows are non-overlapping.

Applies to K16, K17, P14. Basis: explicit decision.

<a id="n05"></a>

### N05 — Late or backdated completions

**Not current behavior:** Neither kids nor parents can create an early, previous-day, or elapsed-window completion/request, including through an approval escape hatch.

**Current behavior:** An actually accepted on-time submission can be approved later without reopening its old chore.

Applies to K25, K27, K36, K37, K38, K41, P09, P10, P15, P29, P31. Basis: explicit decision.

<a id="n06"></a>

### N06 — Automatic overdue one-off carryover

**Not current behavior:** An unfinished one-off does not remain completable indefinitely after its scheduled date or window.

**Current behavior:** A parent can explicitly reschedule current/future work without inventing past credit.

Applies to K25, P09, P10. Basis: explicit decision.

<a id="n07"></a>

### N07 — Skipping and skip credit

**Not current behavior:** Skip, skip confirmation/cancellation, per-kid skip/unskip, skipped progress, skipped bonus credit, and skip notifications are not current behavior for kids or parents.

**Current behavior:** Parents may mute through scheduling; this excludes requirements without completing them or awarding chore stars.

Applies to K26, K30, K38, K42, K43, K44, K45, P20, P22, P24, P25, P48. Basis: explicit decision.

<a id="n08"></a>

### N08 — Automatic chore sorting

**Not current behavior:** Sorting chores by type, newest-first creation order, title, stars, or model priority is not current behavior.

**Current behavior:** Use the saved parent-specified sequence; filtering and temporary choice do not reorder it.

Applies to K20, P55. Basis: explicit decision.

<a id="n09"></a>

### N09 — Extra ten-star daily award

**Not current behavior:** The +10 full-day bonus, its target/progress offer, celebration dialog, and new notification are not current behavior.

**Current behavior:** Exactly +2 per completed nonempty named period replaces it. Preserve historical credits already recorded.

Applies to K21, K30, K31, K34, K70, P04, P48. Basis: explicit decision.

<a id="n10"></a>

### N10 — Empty-period or Bonus-period payout

**Not current behavior:** An empty period or untimed Bonus list does not earn a period-completion payout.

**Current behavior:** A named period must have at least one remaining required task; pending work must first be approved.

Applies to K21, K30, K70, P22. Basis: explicit decision.

<a id="n11"></a>

### N11 — Hidden work still required

**Not current behavior:** A parent-hidden chore must not remain in the period target just because its window opened or it has pending/undone history.

**Current behavior:** Exclude it immediately while preserving history. Completed remaining nonempty periods can earn +2. Unmuted missed work is still missed.

Applies to K21, K30, K34, K70, P19, P20, P21, P22, P23, P24. Basis: explicit decision.

<a id="n12"></a>

### N12 — Automatic Bonus assignment

**Not current behavior:** Finishing required chores must not automatically assign an untimed Bonus chore as the next obligation.

**Current behavior:** Bonus is an optional explicit choice available anytime.

Applies to K15, K22. Basis: accepted design.

<a id="n13"></a>

### N13 — Indistinguishable all-clear and active cards

**Not current behavior:** Finished/empty columns must not look like outstanding chore cards; pending approval, failure, or loading must not be presented as completed work.

**Current behavior:** Use subdued finished/empty/pending states and colorful outstanding cards. Only a confirmed current all-clear invites Go play.

Applies to K22, K28, K40. Basis: explicit decision.

<a id="n14"></a>

### N14 — Dedicated Choose another button

**Not current behavior:** A separate Choose another button is not current behavior.

**Current behavior:** Tap the Finish this {timeframe} period card to open the chore picker.

Applies to K15, K20, K26, K70. Basis: explicit decision.

<a id="n15"></a>

### N15 — Duplicate completion count

**Not current behavior:** A second 0 of N done line directly beneath the card repeating its progress is not current behavior.

**Current behavior:** Keep progress inside the period card.

Applies to K21. Basis: explicit decision.

<a id="n16"></a>

### N16 — Chore-title read-aloud

**Not current behavior:** Hear it, open/completed-title speech, and the chore speech endpoint are not current behavior.

**Current behavior:** The kids read their chores; completion and redemption sound effects remain.

Applies to K26, K57, K58. Basis: explicit decision.

<a id="n17"></a>

### N17 — Daytime blackout or visible sleep decoration

**Not current behavior:** All-day five-minute blackout and a visible moon/text on the black screen are not current behavior.

**Current behavior:** Only 8:30pm–6am San Francisco time permits the pure-black idle screen; it clears at 6am. This does not control iPad hardware brightness.

Applies to K60, P50. Basis: explicit decision.

<a id="n18"></a>

### N18 — Dedicated parent interface

**Not current behavior:** Parent dashboards, forms/settings pages, PIN gates, approval/undo pages, and a dedicated parent packing/setup portal are not current behavior.

**Current behavior:** Parents talk to ChatGPT using authenticated current MCP/CLI tools; they can still look at the shared kid display.

Applies to P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12, P13, P14, P15, P16, P17, P18, P19, P20, P21, P22, P23, P24, P25, P26, P27, P28, P29, P30, P31, P32, P33, P34, P35, P36, P37, P38, P39, P40, P41, P42, P43, P44, P45, P46, P47, P48, P49, P50, P51, P52, P53, P54, P55, P56. Basis: explicit decision.

<a id="n19"></a>

### N19 — Clippy or Telegram management

**Not current behavior:** Clippy, conversational Telegram commands, and approval/undo action buttons in Telegram are not the current management workflow.

**Current behavior:** ChatGPT is the parent interaction surface; Telegram delivers notifications only.

Applies to P01, P02, P26, P27, P29, P30, P32, P47, P48, P49, P50, P51, P56. Basis: explicit decision.

<a id="n20"></a>

### N20 — Last-night bedtime recognition

**Not current behavior:** Special in-bed/delightful-night templates, selections, generated morning chores, result screens, and dedicated recognition reminders/schedules are not current behavior.

**Current behavior:** Ordinary evening/night chores, including a manually defined bedtime chore, remain possible.

Applies to P41, P42, P43, P44, P45, P46. Basis: explicit decision.

<a id="n21"></a>

### N21 — Required transferred setup link

**Not current behavior:** A transferred invitation link is not required to unlock the family iPads.

**Current behavior:** Reuse the existing site-password login; invitations are optional compatibility support.

Applies to K01, P01. Basis: explicit decision.

<a id="n22"></a>

### N22 — Shared live legacy data or ongoing resync

**Not current behavior:** The current and legacy boards do not share mutable chore/reward/ledger state or continually resynchronize balances.

**Current behavior:** Use only the existing live chores dataset. Legacy records remain archived history, with no executable legacy board or writers and no ongoing synchronization.

Applies to K35, P51. Basis: explicit decision.

<a id="n23"></a>

### N23 — Verbose completion and bonus logs

**Not current behavior:** New notifications do not add [Chores], a trailing Completion label/ID, or the occurrence date in the bonus message.

**Current behavior:** Completions show +stars and total; period bonuses show +2 bonus stars and total. Approval-request identifying details remain available.

Applies to P47, P48. Basis: explicit decision.

<a id="n24"></a>

### N24 — Refresh that only refetches data

**Not current behavior:** The manual Refresh button must not merely refetch the board API.

**Current behavior:** It reloads the browser document with window.location.reload().

Applies to K10. Basis: explicit decision.

<a id="n25"></a>

### N25 — Browser-only packing

**Not current behavior:** A single browser’s local storage is not the authoritative current packing store.

**Current behavior:** Share packing through the current dataset; retain one-time legacy import.

Applies to K69, P52, P53, P54. Basis: implemented replacement.

<a id="n26"></a>

### N26 — Whole-list primary chore screen

**Not current behavior:** Showing every chore as the primary interface or requiring ordinary completion through a details dialog is not the accepted current interface.

**Current behavior:** One emoji-led next-action card per child, with a period-card picker.

Applies to K15, K26. Basis: accepted design.

<a id="n27"></a>

### N27 — No shared Rewards tab

**Not current behavior:** Leaving children without a shared Rewards tab is not current behavior.

**Current behavior:** The header has Chores/Rewards and each balance also opens that child’s rewards.

Applies to K02, K46. Basis: explicit decision.

<a id="n28"></a>

### N28 — Retired implementation and names

**Not current behavior:** The old board, prototype, dedicated admin/approval pages, old MCP tools, legacy CLI/importer, balance-cutover scripts, speech and bedtime-reminder endpoints are not supported or executable. The trial product names are not current routes or tool names.

**Current behavior:** There is one /chores board, `/api/chores/*` API, pnpm chores CLI and `chores_*` MCP tool set. Minimal compatibility for stored identifiers preserves existing sessions, accepted submissions and command receipts. Retain the existing Redis schema namespace and financial history.

Applies to K01, P01, P50. Basis: explicit decision.

<a id="n29"></a>

### N29 — MCP polling and push delivery

**Not current behavior:** Public events/poll, events/stream, SSE event notifications and heartbeat delivery are not current behavior.

**Current behavior:** MCP Events advertises only webhook delivery; authenticated clients subscribe verified HTTPS callbacks, refresh their finite grants and unsubscribe using the same scoped key.

Applies to P56. Basis: explicit September 23 webhook-only request.

## Kid: get to my board

<a id="k01"></a>

- **K01 — As a kid, I can use the chore board on a device my family has unlocked.** _Current behavior · retained._ Reuse the existing site-password cookie; an already-unlocked iPad opens /chores directly. Otherwise enter the same password, remembered for a year. This grants kid commands, not parent management. Optional scoped device invitations remain supported. **Not current behavior:** [N21: Required transferred setup link](inventory.md#n21); [N28: Retired implementation and names](inventory.md#n28).

<a id="k02"></a>

- **K02 — As a kid, I can move between Chores, Rewards, and Packing.** _Current behavior · retained._ The shared header has Chores and Rewards tabs and a Packing button. Rewards opens all three catalogs; a child’s star balance opens only that child’s catalog. Secondary panels remain inside the child’s column. **Not current behavior:** [N27: No shared Rewards tab](inventory.md#n27).

<a id="k03"></a>

- **K03 — As a kid, I can recognize my chores by my name and color.** _Current behavior · retained._ Dilan, Darian, and Devina have permanent landscape columns with independent balances, current chores, choices, and feedback. Their names retain the chosen identity colors even when their columns become subdued. **Not current behavior:** [N01: Small-screen child selection](inventory.md#n01).

<a id="k04"></a>

- **K04 — As a kid, I cannot choose whose chores to view on a small screen.** _Not current behavior · removed._ Small-screen kid selector is outside the explicitly requested iPad-landscape-only rebuild. All three children remain visible in permanent columns. **Not current behavior:** [N01: Small-screen child selection](inventory.md#n01).

<a id="k05"></a>

- **K05 — As a kid, I cannot open a link that selects my chore column on a small screen.** _Not current behavior · removed._ Small-screen links selecting one kid are outside the explicitly requested iPad-landscape-only rebuild. **Not current behavior:** [N01: Small-screen child selection](inventory.md#n01).

<a id="k06"></a>

- **K06 — As a kid, I can see today and the current time window.** _Current behavior · revised._ Default board context is the current Pacific date/window, not a freely selected day. **Not current behavior:** [N02: Other-day chore browsing](inventory.md#n02).

<a id="k07"></a>

- **K07 — As a kid, I can browse counts-only daily progress backward and forward one day at a time.** _Current behavior · lower priority._ My progress is a counts-only daily summary reached from the current chore picker (or the My progress fallback when no period card is shown). Previous/next days show counts, pending work, and applicable star activity, never other-day chore titles or completion controls. This lower-priority capability is implemented. **Not current behavior:** [N02: Other-day chore browsing](inventory.md#n02).

<a id="k08"></a>

- **K08 — As a kid, I can return my daily summary to today.** _Current behavior · lower priority._ Back to today changes the date of the counts-only summary. It does not select another date for the actionable chore board. This lower-priority capability is implemented. **Not current behavior:** [N02: Other-day chore browsing](inventory.md#n02).

<a id="k09"></a>

- **K09 — As a kid, I can leave a daily summary idle and return to the current chore view.** _Current behavior · lower priority._ After 90 seconds without interaction, a secondary panel closes back to the current view; a global Rewards view also returns to Chores. It does not restore the legacy past/future chore-list mode. This lower-priority capability is implemented. **Not current behavior:** [N02: Other-day chore browsing](inventory.md#n02).

<a id="k10"></a>

- **K10 — As a kid, I can refresh the chore board manually.** _Current behavior · retained._ The shared Refresh button reloads the full document. Reconnect retries the board request; deployment or incompatible-response detection can also recover the document automatically under the K11 safety rules. **Not current behavior:** [N24: Refresh that only refetches data](inventory.md#n24).

<a id="k11"></a>

- **K11 — As a kid, I can have my board reflect the current time window and changes made through ChatGPT and MCP.** _Current behavior · revised._ The shared Refresh button reloads the document and app code. Visible boards poll every 15 seconds and replace hung reads after 10 seconds. Focus, online, visibility return and pageshow restart the read. A deployment-version change or missing/non-JSON/malformed API response triggers a guarded document reload, at most once per five minutes per tab. Automatic reload waits for all busy or uncertain saves to resolve so their exact retry IDs survive. Network failures retry data and show a friendly reconnecting message. Server eligibility remains authoritative at Pacific boundaries, including overnight wake.

## Kid: understand what needs doing

<a id="k12"></a>

- **K12 — As a kid, I can see my current-window chores and untimed Bonus chores that are eligible now.** _Current behavior · revised._ Never expose another named window through a URL, group, preview, or stale state. Honor kid assignment and authoritative time. **Not current behavior:** [N02: Other-day chore browsing](inventory.md#n02); [N03: Opening other time groups](inventory.md#n03).

<a id="k13"></a>

- **K13 — As a kid, I can recognize a chore by its title, emoji, and star value before acting.** _Current behavior · retained._ Show the chore’s existing assigned emoji prominently on its main card, and reuse it in the picker and Done list. Show its full title and star amount before submission.

<a id="k14"></a>

- **K14 — As a kid, I can spot recently added chores.** _Current behavior · retained._ Eligible cards and picker rows display New for chores created within the last 24 hours.

<a id="k15"></a>

- **K15 — As a kid, I can focus on one current chore at a time and choose another through the period card.** _Current behavior · revised._ Each child sees one suggested actionable chore from the saved order. The Finish this {timeframe} card opens that child’s current chore picker; choosing a task changes only the temporary selection. Bonus chores has a separate always-reachable entry and is never automatically selected after required work. **Not current behavior:** [N03: Opening other time groups](inventory.md#n03); [N12: Automatic Bonus assignment](inventory.md#n12); [N14: Dedicated Choose another button](inventory.md#n14); [N26: Whole-list primary chore screen](inventory.md#n26).

<a id="k16"></a>

- **K16 — As a kid, I can see when my current chore window ends.** _Current behavior · revised._ New submissions stop at the cutoff. Untimed Bonus work has no time-group cutoff, but remains subject to its date/recurrence eligibility. **Not current behavior:** [N04: Overlapping Evening and Night](inventory.md#n04).

<a id="k17"></a>

- **K17 — As a kid, I can have the next time window’s chores replace the previous window’s chores automatically.** _Current behavior · revised._ Pacific windows are Morning 7am–noon, Afternoon noon–5pm, Evening 5pm–8:15pm, and Night 8:15pm–10pm, with exclusive closing boundaries. Between 10pm and 7am only eligible untimed Bonus work is available. Old timed cards and secondary selections close at a boundary; accepted pending requests remain recorded. **Not current behavior:** [N03: Opening other time groups](inventory.md#n03); [N04: Overlapping Evening and Night](inventory.md#n04).

<a id="k18"></a>

- **K18 — As a kid, I cannot expand or collapse a group myself.** _Not current behavior · removed._ Remove time-group expansion/collapse. Non-current windows are absent, not hidden behind controls. **Not current behavior:** [N03: Opening other time groups](inventory.md#n03).

<a id="k19"></a>

- **K19 — As a kid, I cannot leave extra groups open while I am interacting.** _Not current behavior · removed._ Remove persistent/manual group expansion and idle recollapse behavior, including Evening overlap. **Not current behavior:** [N03: Opening other time groups](inventory.md#n03).

<a id="k20"></a>

- **K20 — As a kid, I can follow my chores in the order my parent specified for the current time period.** _Current behavior · revised._ Use the saved per-child/per-group order. The September 8 message was the initial seed, not an immutable replacement for later parent edits. Filter weekday/ineligible/pending/completed work without reordering the remaining tasks; a picker selection does not change the saved sequence. **Not current behavior:** [N08: Automatic chore sorting](inventory.md#n08); [N14: Dedicated Choose another button](inventory.md#n14).

<a id="k21"></a>

- **K21 — As a kid, I can see my current-period progress and two-star bonus opportunity.** _Current behavior · revised._ The period card contains progress stamps and the +2 offer or earned/pending state. No second “0 of 5 done” line appears below it. Daily history is counts-only. Parent-hidden occurrences are excluded from targets; pending approval is not completion. Empty periods offer no bonus. **Not current behavior:** [N09: Extra ten-star daily award](inventory.md#n09); [N10: Empty-period or Bonus-period payout](inventory.md#n10); [N11: Hidden work still required](inventory.md#n11); [N15: Duplicate completion count](inventory.md#n15).

<a id="k22"></a>

- **K22 — As a kid, I can see when I have no open chores in the current window.** _Current behavior · revised._ Outstanding chores keep colorful raised columns, a solid card, emoji, and action button. Finished, empty, or awaiting-parent columns are subdued and say All done for now, Nothing to do right now, or Your part is done, with Go play only when the current state is confirmed. Pending approval uses a clock; failures/loading do not show an all-clear. This concerns the current window, not the whole day. **Not current behavior:** [N12: Automatic Bonus assignment](inventory.md#n12); [N13: Indistinguishable all-clear and active cards](inventory.md#n13).

<a id="k23"></a>

- **K23 — As a kid, I can see a daily chore when its next daily occurrence is eligible.** _Current behavior · revised._ The next occurrence is distinct from yesterday’s missed work. Named time windows and the untimed exception apply.

<a id="k24"></a>

- **K24 — As a kid, I can see a weekly chore when its next scheduled occurrence is eligible.** _Current behavior · revised._ Honor scheduled weekdays plus the current time window or untimed eligibility; no overdue catch-up path. Weekly schedules with no selected weekday are ineligible, including malformed saved definitions; they never fall back to daily work.

<a id="k25"></a>

- **K25 — As a kid, I cannot keep seeing an unfinished one-off chore after its scheduled day.** _Not current behavior · removed._ Remove automatic overdue one-off carryover. A parent may explicitly schedule a new eligible opportunity; this does not backdate the missed occurrence. **Not current behavior:** [N05: Late or backdated completions](inventory.md#n05); [N06: Automatic overdue one-off carryover](inventory.md#n06).

## Kid: complete chores, earn stars, and correct mistakes

<a id="k26"></a>

- **K26 — As a kid, I can open an eligible chore to complete it or request required approval.** _Current behavior · revised._ The main chore card completes directly or sends the explicitly required approval request. The period card opens the picker. There is no ordinary completion-detail dialog, skip action, or Hear it control; an expired occurrence is rejected by the service. **Not current behavior:** [N07: Skipping and skip credit](inventory.md#n07); [N14: Dedicated Choose another button](inventory.md#n14); [N16: Chore-title read-aloud](inventory.md#n16); [N26: Whole-list primary chore screen](inventory.md#n26).

<a id="k27"></a>

- **K27 — As a kid, I can complete an occurrence that is eligible now and receive its stars.** _Current behavior · revised._ No early, backdated, or elapsed-window submissions. Enforce on the server. On-time approval requests may be settled later. **Not current behavior:** [N05: Late or backdated completions](inventory.md#n05).

<a id="k28"></a>

- **K28 — As a kid, I can celebrate a successful chore completion with animation and sound.** _Current behavior · retained._ Confirmed completion gives local star feedback and a short sound/animation, then returns to the next eligible chore. Pending approval and failed writes do not celebrate. Reduced-motion styles suppress movement. **Not current behavior:** [N13: Indistinguishable all-clear and active cards](inventory.md#n13).

<a id="k29"></a>

- **K29 — As a kid, I can earn a repeatable chore again when it is eligible.** _Current behavior · revised._ Repeatable work can be performed again when eligible, subject to the service’s five-second cooldown and any approval requirement. Untimed work remains available anytime; timed work stays window-gated. One approved occurrence fulfills a timed period target, not endless repetitions.

<a id="k30"></a>

- **K30 — As a kid, I can earn two extra stars after completing every task in a nonempty time period.** _Current behavior · revised._ The +2 award belongs to each child/Pacific day/nonempty named period. This replaces the old +10 daily award. Complete the remaining unhidden requirements; timely pending submissions may settle their original period later. Empty periods and untimed Bonus work create no period payout. **Not current behavior:** [N07: Skipping and skip credit](inventory.md#n07); [N09: Extra ten-star daily award](inventory.md#n09); [N10: Empty-period or Bonus-period payout](inventory.md#n10); [N11: Hidden work still required](inventory.md#n11).

<a id="k31"></a>

- **K31 — As a kid, I cannot see and dismiss a daily-bonus celebration.** _Not current behavior · removed._ Remove the ten-star daily-bonus dialog. Period progress still shows its earned two-star award. **Not current behavior:** [N09: Extra ten-star daily award](inventory.md#n09).

<a id="k32"></a>

- **K32 — As a kid, I can review completions from the current time window and today’s untimed work.** _Current behavior · revised._ Do not reintroduce other named groups, historical completion actions, or group persistence timers. **Not current behavior:** [N02: Other-day chore browsing](inventory.md#n02).

<a id="k33"></a>

- **K33 — As a kid, I can undo one of my displayed completions.** _Current behavior · revised._ Only currently displayed current-window/untimed completions are kid-accessible. Undo must target that exact record; historical parent corrections use agents.

<a id="k34"></a>

- **K34 — As a kid, I can have my balance reflect losing a period bonus when I undo a required chore.** _Current behavior · revised._ Undo reverses the +2 award if it makes the remaining required period incomplete. A legitimate re-completion can restore one net bonus. Historical daily-bonus ledger entries remain; no new daily bonuses or daily-bonus dialog are created. **Not current behavior:** [N09: Extra ten-star daily award](inventory.md#n09); [N11: Hidden work still required](inventory.md#n11).

<a id="k35"></a>

- **K35 — As a kid, I can carry my unspent star balance from day to day.** _Current behavior · retained._ The independent current-system ledger keeps unspent stars across days, adds earned credits, and subtracts purchases/explicit reversals. Legacy balances were reconciled at promotion, not continuously synchronized afterward. **Not current behavior:** [N22: Shared live legacy data or ongoing resync](inventory.md#n22).

## Kid: ask for parent approval

<a id="k36"></a>

- **K36 — As a kid, I can recognize an eligible chore that explicitly needs parent approval.** _Current behavior · revised._ Deadline expiry no longer creates an approval opportunity; the expired timed chore leaves the kid view. **Not current behavior:** [N05: Late or backdated completions](inventory.md#n05).

<a id="k37"></a>

- **K37 — As a kid, I can submit an eligible chore for parent approval.** _Current behavior · revised._ Persist the occurrence and authoritative on-time submission before Telegram delivery. No new requests for earlier days or closed time groups. **Not current behavior:** [N05: Late or backdated completions](inventory.md#n05).

<a id="k38"></a>

- **K38 — As a kid, I cannot request credit for a past day after an extra confirmation.** _Not current behavior · removed._ Remove past-day and elapsed-time-group completion requests, their prompt, and any late-request approval escape hatch. **Not current behavior:** [N05: Late or backdated completions](inventory.md#n05); [N07: Skipping and skip credit](inventory.md#n07).

<a id="k39"></a>

- **K39 — As a kid, I can see whether my valid approval submission was accepted and whether sending its notification needs retrying.** _Current behavior · revised._ Separate durable request acceptance from Telegram delivery so notification failures do not lose an on-time submission. Closing a prompt does not retract it. The existing notification status refers to Telegram delivery; MCP clients track their own cursor independently.

<a id="k40"></a>

- **K40 — As a kid, I can see that my eligible chore is awaiting parent approval.** _Current behavior · revised._ Use durable per-occurrence request identity rather than a permanent browser-only marker. Old timed cards stay hidden after cutoff; their request still exists for parent review. **Not current behavior:** [N13: Indistinguishable all-clear and active cards](inventory.md#n13).

<a id="k41"></a>

- **K41 — As a kid, I can receive stars when my parent approves my on-time submission later.** _Current behavior · revised._ Later review may occur after the window or day ends. Credit belongs to the original occurrence. Update balance/progress without reopening the old timed chore. **Not current behavior:** [N05: Late or backdated completions](inventory.md#n05).

## Kid: skip for today

<a id="k42"></a>

- **K42 — As a kid, I cannot skip my assignment for the rest of today before its deadline.** _Not current behavior · removed._ Remove the skip entry action as well as the follow-on K43–K45 behaviors. **Not current behavior:** [N07: Skipping and skip credit](inventory.md#n07).

<a id="k43"></a>

- **K43 — As a kid, I cannot change my mind before confirming a skip.** _Not current behavior · removed._ Remove skip confirmation, cancellation, and unskip-related UX. **Not current behavior:** [N07: Skipping and skip credit](inventory.md#n07).

<a id="k44"></a>

- **K44 — As a kid, I cannot skip my part without hiding the chore from my siblings.** _Not current behavior · removed._ Remove kid-triggered per-assignment skipping. **Not current behavior:** [N07: Skipping and skip credit](inventory.md#n07).

<a id="k45"></a>

- **K45 — As a kid, I cannot have a skipped chore count toward finishing my day.** _Not current behavior · removed._ Remove skip-based progress, daily bonus eligibility, and notifications. **Not current behavior:** [N07: Skipping and skip credit](inventory.md#n07).

## Kid: spend stars on rewards

<a id="k46"></a>

- **K46 — As a kid, I can browse rewards assigned to me alongside my current balance.** _Current behavior · retained._ Open Rewards in the shared header for all three children or tap one child’s balance. Each catalog shows only rewards assigned to that child alongside their spendable balance. **Not current behavior:** [N27: No shared Rewards tab](inventory.md#n27).

<a id="k47"></a>

- **K47 — As a kid, I can find cheaper rewards first.** _Current behavior · retained._ Available assigned rewards are sorted by ascending cost.

<a id="k48"></a>

- **K48 — As a kid, I can see which rewards I can afford and how many more stars I need.** _Current behavior · retained._ Reward rows show You can get this, the remaining stars needed, or Already yours for a redeemed one-off. The detail view shows the resulting balance; unavailable purchases are disabled and also rejected by the service.

<a id="k49"></a>

- **K49 — As a kid, I can inspect a reward before spending stars.** _Current behavior · retained._ Open reward details to see its emoji, title, cost, and resulting balance, then choose Get this reward or Keep my stars/Back.

<a id="k50"></a>

- **K50 — As a kid, I can redeem an available reward when I have enough stars.** _Current behavior · retained._ The service checks assignment, availability, one-off entitlement, current balance, and the price shown before committing the debit and redemption together. Retries cannot duplicate spending.

<a id="k51"></a>

- **K51 — As a kid, I can celebrate a successful redemption.** _Current behavior · retained._ A confirmed redemption plays the reward effect and returns to the applicable child view. A failed purchase does not celebrate or spend stars.

<a id="k52"></a>

- **K52 — As a kid, I can recognize a one-off reward I have already taken.** _Current behavior · retained._ A redeemed one-off reward remains recognizable as Already yours and cannot be purchased again by that child.

<a id="k53"></a>

- **K53 — As a kid, I can redeem a repeatable reward again while I can afford it.** _Current behavior · retained._ A perpetual reward can be purchased repeatedly while the child remains assigned, it is available, and enough stars remain.

<a id="k54"></a>

- **K54 — As a kid, I can leave Rewards idle and return automatically to the current chore view.** _Current behavior · revised._ After 90 seconds without interaction, Rewards returns to current Chores. Opening/using reward details counts as interaction. A period/day change also resets stale secondary views.

## Kid: personalize the board and get help

<a id="k55"></a>

- **K55 — As a kid, I can choose the color of my column.** _Current behavior · retained._ Tap the child’s name to open the color picker, choose a preset or custom color, and save it to shared state.

<a id="k56"></a>

- **K56 — As a kid, I can save or cancel my color choice.** _Current behavior · retained._ Save my color persists the selection; Cancel leaves the saved color unchanged.

<a id="k57"></a>

- **K57 — As a kid, I cannot have an open chore’s title read aloud.** _Not current behavior · removed._ Remove chore-title read-aloud, its controls and its speech endpoint. The kids can read their chores. **Not current behavior:** [N16: Chore-title read-aloud](inventory.md#n16).

<a id="k58"></a>

- **K58 — As a kid, I cannot hear the title of a completed chore without undoing it.** _Not current behavior · removed._ Remove completed-chore title speech. Open-chore title speech (K57) is also removed. **Not current behavior:** [N16: Chore-title read-aloud](inventory.md#n16).

<a id="k59"></a>

- **K59 — As a kid, I can use the board in my device’s light or dark appearance.** _Current behavior · lower priority._ System light/dark appearance is implemented, including legible active and subdued states. It remains lower priority than the landscape current-chore flow.

<a id="k60"></a>

- **K60 — As a kid, I can wake the idle shared chore display and see the work eligible now.** _Current behavior · revised._ Five idle minutes can trigger pure black only from 8:30pm inclusive until 6am exclusive in America/Los_Angeles, automatically following DST. At 8:30pm an already-idle board can black out; at 6am it clears automatically. Tapping wakes and refreshes. Focus/visibility return rechecks the schedule. No visible moon or text appears; webpage blackout does not change the hardware backlight. **Not current behavior:** [N17: Daytime blackout or visible sleep decoration](inventory.md#n17).

<a id="k61"></a>

- **K61 — As a kid, I can try reloading a failed board section.** _Current behavior · retained._ A failed column offers Reload this column. Connection errors expose Reconnect; failed writes retain the exact request for Retry saving. The shared Refresh button reloads the whole page.

## Kid: pack for a camping trip

<a id="k62"></a>

- **K62 — As a kid, I can open a camping packing checklist with my own progress.** _Current behavior · retained._ Packing opens each child’s checklist inside their column, with progress stored in the current shared board.

<a id="k63"></a>

- **K63 — As a kid, I can see exactly what the packing list asks me to bring.** _Current behavior · retained._ Packing lists the defined item titles and emojis; the checklist is separate from chore-star and period-bonus targets.

<a id="k64"></a>

- **K64 — As a kid, I can check an item as I pack it and uncheck it if needed.** _Current behavior · retained._ Check or uncheck a packing item through a shared-state command; packing itself does not award chore stars.

<a id="k65"></a>

- **K65 — As a kid, I can see my packing count and progress bar.** _Current behavior · retained._ Show the packed item count and progress bar for that child.

<a id="k66"></a>

- **K66 — As a kid, I can mark my entire packing list packed at once.** _Current behavior · retained._ All packed marks every defined packing item for that child.

<a id="k67"></a>

- **K67 — As a kid, I can clear my packing list and start again.** _Current behavior · retained._ Clear mine clears that child’s packing list.

<a id="k68"></a>

- **K68 — As a kid, I can reset everyone’s packing lists for a new trip.** _Current behavior · retained._ New trip for everyone asks for confirmation before clearing all packing lists; cancelling preserves them.

<a id="k69"></a>

- **K69 — As a kid, I can return to my shared packing progress from another authorized device.** _Current behavior · revised._ Packing is shared in Redis across authorized devices and agents. A one-time import can carry over the old browser checklist; subsequent progress does not depend on that browser’s local storage. **Not current behavior:** [N25: Browser-only packing](inventory.md#n25).

## Parent: understand the family’s work and balances

<a id="p01"></a>

- **P01 — As a parent, I can make a shared family device ready for the kid board.** _Current behavior · revised._ Open /chores on an iPad already unlocked with the site password, or enter that same password. No dedicated parent setup page or transferred link is required. Optional invitations grant scoped kid sessions; parent MCP authorization remains separate. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N19: Clippy or Telegram management](inventory.md#n19); [N21: Required transferred setup link](inventory.md#n21); [N28: Retired implementation and names](inventory.md#n28).

<a id="p02"></a>

- **P02 — As a parent, I can ask an agent for each kid’s chores, completions, progress, and stars.** _Current behavior · revised._ Provide readable results in ChatGPT through MCP; Telegram only delivers notifications. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N19: Clippy or Telegram management](inventory.md#n19).

<a id="p03"></a>

- **P03 — As a parent, I can ask an agent to inspect past activity and future schedules.** _Current behavior · revised._ Parent read access to history is allowed. It does not enable late/future completion or expose old timed cards to kids. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

<a id="p04"></a>

- **P04 — As a parent, I can ask an agent to distinguish daily progress from spendable stars.** _Current behavior · revised._ Daily summaries distinguish task counts from ledger credits/debits and current spendable balances. Day/occurrence/submission/approval timestamps remain inspectable through tools; daily counts do not offer a +10 bonus. **Not current behavior:** [N09: Extra ten-star daily award](inventory.md#n09); [N18: Dedicated parent interface](inventory.md#n18).

<a id="p05"></a>

- **P05 — As a parent, I can rename kid columns through an agent.** _Current behavior · revised._ Keep identity and history stable when changing a display name. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

<a id="p06"></a>

- **P06 — As a parent, I can set a kid’s color through an agent.** _Current behavior · revised._ The kid-facing color picker remains; no parent settings screen. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

## Parent: define and change chores

<a id="p07"></a>

- **P07 — As a parent, I can create a chore with its title, emoji, and star value through an agent.** _Current behavior · revised._ Retain the underlying configuration capability. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

<a id="p08"></a>

- **P08 — As a parent, I can assign a chore to one or more kids through an agent.** _Current behavior · revised._ Each kid has independent occurrences and credit. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

<a id="p09"></a>

- **P09 — As a parent, I can create a one-off chore through an agent.** _Current behavior · revised._ Give it an eligible date/time or untimed occurrence; do not automatically carry a missed occurrence into later dates/windows. **Not current behavior:** [N05: Late or backdated completions](inventory.md#n05); [N06: Automatic overdue one-off carryover](inventory.md#n06); [N18: Dedicated parent interface](inventory.md#n18).

<a id="p10"></a>

- **P10 — As a parent, I can schedule or reschedule a one-off chore through an agent.** _Current behavior · revised._ Only create an eligible current/future opportunity. Rescheduling cannot manufacture completion credit for a missed past occurrence. **Not current behavior:** [N05: Late or backdated completions](inventory.md#n05); [N06: Automatic overdue one-off carryover](inventory.md#n06); [N18: Dedicated parent interface](inventory.md#n18).

<a id="p11"></a>

- **P11 — As a parent, I can create daily routines through an agent.** _Current behavior · revised._ Each scheduled day/window is a distinct opportunity. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

<a id="p12"></a>

- **P12 — As a parent, I can schedule routines for selected weekdays through an agent.** _Current behavior · revised._ Show the occurrence only when its current time/date eligibility permits it. Weekly cadence requires at least one weekday (0 = Sunday through 6 = Saturday). Daily schedules with omitted or empty weekdays remain everyday routines. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

<a id="p13"></a>

- **P13 — As a parent, I can create a repeatable chore through an agent.** _Current behavior · revised._ Untimed repeatable chores stay available anytime; timed ones remain window-gated. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

<a id="p14"></a>

- **P14 — As a parent, I can assign a chore to a named time window or make it an untimed Bonus chore through an agent.** _Current behavior · revised._ The untimed option is explicitly retained. Named windows do not overlap in the kid experience. **Not current behavior:** [N04: Overlapping Evening and Night](inventory.md#n04); [N18: Dedicated parent interface](inventory.md#n18).

<a id="p15"></a>

- **P15 — As a parent, I can require approval for a chore through an agent.** _Current behavior · revised._ Kids must submit during eligibility. On-time requests remain approvable later. **Not current behavior:** [N05: Late or backdated completions](inventory.md#n05); [N18: Dedicated parent interface](inventory.md#n18).

<a id="p16"></a>

- **P16 — As a parent, I can edit chore titles, emoji, and star values through an agent.** _Current behavior · revised._ Preserve recorded occurrence/submission facts and earned amounts; do not rewrite history accidentally. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

<a id="p17"></a>

- **P17 — As a parent, I can change chore types and repeat schedules through an agent.** _Current behavior · revised._ Reconcile future eligibility safely; no stale global completed flag trapping new assignees. Weekly schedule updates require selected weekdays; daily schedule semantics are unchanged. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

<a id="p18"></a>

- **P18 — As a parent, I can change chore assignments through an agent.** _Current behavior · revised._ Changes must not lose recorded credit or make an expired occurrence completable. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

<a id="p19"></a>

- **P19 — As a parent, I can remove a chore from availability through an agent.** _Current behavior · revised._ Archive/remove an assignment or change eligibility through an agent while retaining its occurrence, submission, and ledger history. If hidden for today, it stops counting toward the relevant requirement, even after opening. **Not current behavior:** [N11: Hidden work still required](inventory.md#n11); [N18: Dedicated parent interface](inventory.md#n18).

## Parent: pause routines and make exceptions

<a id="p20"></a>

- **P20 — As a parent, I can pause a repeated chore through an agent.** _Current behavior · revised._ Parent pauses hide the affected work and exclude it from completion targets immediately, even after opening or an undone submission. pausedUntil is inclusive; snoozedUntil and per-child snoozedForKids are exclusive reappear dates. This gives no chore credit; completed remaining nonempty periods may earn +2. **Not current behavior:** [N07: Skipping and skip credit](inventory.md#n07); [N11: Hidden work still required](inventory.md#n11); [N18: Dedicated parent interface](inventory.md#n18).

<a id="p21"></a>

- **P21 — As a parent, I can resume a repeated chore through an agent.** _Current behavior · revised._ Clear the relevant pause/snooze subject to remaining restrictions. Resume before cutoff restores the requirement and reconciles its period award; resume after cutoff cannot reinstate expired work. The next eligible day has its normal requirement again. **Not current behavior:** [N11: Hidden work still required](inventory.md#n11); [N18: Dedicated parent interface](inventory.md#n18).

<a id="p22"></a>

- **P22 — As a parent, I can pause the family’s chores through an agent.** _Current behavior · revised._ pause_all sets an exclusive reappear date on the current catalog. Hidden work is excluded from targets; an empty period earns no bonus. No chore is marked completed or skipped, and recorded submissions are preserved. **Not current behavior:** [N07: Skipping and skip credit](inventory.md#n07); [N10: Empty-period or Bonus-period payout](inventory.md#n10); [N11: Hidden work still required](inventory.md#n11); [N18: Dedicated parent interface](inventory.md#n18).

<a id="p23"></a>

- **P23 — As a parent, I can resume the family’s chores through an agent.** _Current behavior · revised._ Clearing pause_all removes the global snoozes it set. Separate inclusive pauses and child-specific snoozes still apply; only work that remains eligible before its cutoff returns. **Not current behavior:** [N11: Hidden work still required](inventory.md#n11); [N18: Dedicated parent interface](inventory.md#n18).

<a id="p24"></a>

- **P24 — As a parent, I can change a chore’s availability for one kid or all assignees through an agent.** _Current behavior · revised._ Merge existing per-child snoozes when updating that map. Hidden work is waived from targets even with pending/undone submissions, without deleting history or awarding chore stars. An on-time accepted request can still be reviewed later. **Not current behavior:** [N07: Skipping and skip credit](inventory.md#n07); [N11: Hidden work still required](inventory.md#n11); [N18: Dedicated parent interface](inventory.md#n18).

<a id="p25"></a>

- **P25 — As a parent, I cannot excuse a kid’s chore today using the board’s skip flow.** _Not current behavior · removed._ Remove the parent version of the board skip action. Agent scheduling/pauses remain separate from completion credit. **Not current behavior:** [N07: Skipping and skip credit](inventory.md#n07); [N18: Dedicated parent interface](inventory.md#n18).

## Parent: approve work and correct credit

<a id="p26"></a>

- **P26 — As a parent, I can receive on-time approval requests in Telegram.** _Current behavior · revised._ Identify the child, chore, occurrence, submission time, and expected award. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N19: Clippy or Telegram management](inventory.md#n19).

<a id="p27"></a>

- **P27 — As a parent, I can review a request in Telegram without approving it merely by reading it.** _Current behavior · revised._ Approval requires an explicit instruction to ChatGPT through MCP; Telegram is notification-only, with no action buttons or web approval page. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N19: Clippy or Telegram management](inventory.md#n19).

<a id="p28"></a>

- **P28 — As a parent, I can see which occurrence an approval request belongs to and when it was submitted.** _Current behavior · revised._ Differentiate a valid pending request from an attempted new late submission, including after midnight. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

<a id="p29"></a>

- **P29 — As a parent, I can approve an on-time submission later through ChatGPT and MCP.** _Current behavior · revised._ Approval can follow the window/day cutoff. Preserve the original occurrence and submission time; do not reopen its old kid card. **Not current behavior:** [N05: Late or backdated completions](inventory.md#n05); [N18: Dedicated parent interface](inventory.md#n18); [N19: Clippy or Telegram management](inventory.md#n19).

<a id="p30"></a>

- **P30 — As a parent, I can see whether an approval succeeded, was already handled, or failed.** _Current behavior · revised._ Report the authoritative result in ChatGPT and prevent duplicate credit; Telegram may receive a notification. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N19: Clippy or Telegram management](inventory.md#n19).

<a id="p31"></a>

- **P31 — As a parent, I can record an eligible current completion through an agent.** _Current behavior · revised._ No generic parent backdate/future-date bypass. Later review of an existing on-time request is allowed separately. **Not current behavior:** [N05: Late or backdated completions](inventory.md#n05); [N18: Dedicated parent interface](inventory.md#n18).

<a id="p32"></a>

- **P32 — As a parent, I can undo an exact completion through ChatGPT and MCP.** _Current behavior · revised._ Resolve the exact submission from the day/approval tools, then undo it once. The original amount and any affected +2 bonus are reversed atomically. Do not also make a manual star deduction for that same completion; no Telegram or parent-web undo buttons exist. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N19: Clippy or Telegram management](inventory.md#n19).

<a id="p33"></a>

- **P33 — As a parent, I can ask an agent to correct a recorded completion.** _Current behavior · revised._ Historical undo/correction is distinct from newly completing a past occurrence. No parent board controls. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

<a id="p34"></a>

- **P34 — As a parent, I can add or remove stars through an agent.** _Current behavior · revised._ Record manual adjustments explicitly; do not disguise them as completion of a missed chore. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

## Parent: define rewards

<a id="p35"></a>

- **P35 — As a parent, I can create and price rewards through an agent.** _Current behavior · revised._ The kid reward UI remains. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

<a id="p36"></a>

- **P36 — As a parent, I can assign rewards to kids through an agent.** _Current behavior · revised._ Retain independent eligibility and balances. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

<a id="p37"></a>

- **P37 — As a parent, I can choose once-per-kid or repeatable rewards through an agent.** _Current behavior · revised._ Retain the reward types; no parent reward-configuration UI. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

<a id="p38"></a>

- **P38 — As a parent, I can edit reward details, prices, types, and assignments through an agent.** _Current behavior · revised._ Preserve transaction history and authoritative purchase prices. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

<a id="p39"></a>

- **P39 — As a parent, I can remove a reward from availability through an agent.** _Current behavior · revised._ Removal must not silently destroy the history needed to explain spending. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

<a id="p40"></a>

- **P40 — As a parent, I can redeem an eligible reward for a kid through an agent.** _Current behavior · revised._ Use the same balance and eligibility rules as the kid action. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18).

## Parent: recognize last night’s bedtime behavior

<a id="p41"></a>

- **P41 — As a parent, I cannot record which kids were ready and in bed before Alexa’s bedtime announcement.** _Not current behavior · removed._ Remove the special last-night in-bed achievement template and workflow. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N20: Last-night bedtime recognition](inventory.md#n20).

<a id="p42"></a>

- **P42 — As a parent, I cannot record which kids had a delightful bedtime through waking up.** _Not current behavior · removed._ Remove the special delightful-night achievement template and workflow. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N20: Last-night bedtime recognition](inventory.md#n20).

<a id="p43"></a>

- **P43 — As a parent, I cannot turn the selected bedtime achievements into today’s morning chores.** _Not current behavior · removed._ Remove automatic creation of morning chores from last-night bedtime recognition. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N20: Last-night bedtime recognition](inventory.md#n20).

<a id="p44"></a>

- **P44 — As a parent, I cannot see which bedtime achievements already have chores for today.** _Not current behavior · removed._ Remove bedtime selections and duplicate-template discovery. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N20: Last-night bedtime recognition](inventory.md#n20).

<a id="p45"></a>

- **P45 — As a parent, I cannot see the outcome of a bedtime submission.** _Not current behavior · removed._ Remove bedtime submission/status/result UI and its specialized action. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N20: Last-night bedtime recognition](inventory.md#n20).

<a id="p46"></a>

- **P46 — As a parent, I cannot receive a morning reminder to record bedtime stars when the reminder endpoint is scheduled externally.** _Not current behavior · removed._ Remove dedicated bedtime reminder delivery, endpoint, and scheduling requirements. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N20: Last-night bedtime recognition](inventory.md#n20).

## Parent: stay informed and use the shared display

<a id="p47"></a>

- **P47 — As a parent, I can receive Telegram updates for completed and undone chores.** _Current behavior · revised._ New completion messages show the child, chore emoji/title, +stars and total balance. They have no [Chores] prefix or trailing Completion label/ID. Undo updates remain supported; exact submission IDs are looked up through tools, not copied from completion messages. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N19: Clippy or Telegram management](inventory.md#n19); [N23: Verbose completion and bonus logs](inventory.md#n23).

<a id="p48"></a>

- **P48 — As a parent, I can receive Telegram updates for period bonuses and reward redemptions.** _Current behavior · revised._ A bonus message says the child earned +2 bonus stars for completing the period and includes the resulting total balance, without the occurrence date. Reward redemption updates include the cost and resulting balance. No daily-bonus, skip, or dedicated bedtime-recognition updates are generated. **Not current behavior:** [N07: Skipping and skip credit](inventory.md#n07); [N09: Extra ten-star daily award](inventory.md#n09); [N18: Dedicated parent interface](inventory.md#n18); [N19: Clippy or Telegram management](inventory.md#n19); [N23: Verbose completion and bonus logs](inventory.md#n23).

<a id="p49"></a>

- **P49 — As a parent, I can have recorded changes survive Telegram delivery failures.** _Current behavior · revised._ Commit the domain change and durable notification outbox together. Delivery retries do not duplicate stars or redemptions. Telegram delivery is at least once, so a delivery/receipt crash can repeat a message; do not promise exactly-once messages. The same transaction also records an independent MCP event journal; Telegram retries and receipts cannot consume those events or repeat a domain change. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N19: Clippy or Telegram management](inventory.md#n19).

<a id="p50"></a>

- **P50 — As a parent, I can leave the kid board on a shared display that refreshes and handles inactivity.** _Current behavior · revised._ The shared kid board refreshes, returns idle secondary panels to current chores, and uses the five-minute pure-black idle screen only from 8:30pm to 6am Pacific. It wakes automatically at 6am and accepts tap-to-wake overnight. This is not a parent dashboard or hardware brightness control. **Not current behavior:** [N17: Daytime blackout or visible sleep decoration](inventory.md#n17); [N18: Dedicated parent interface](inventory.md#n18); [N19: Clippy or Telegram management](inventory.md#n19); [N28: Retired implementation and names](inventory.md#n28).

<a id="p51"></a>

- **P51 — As a parent, I can have changes made through agents appear on the family’s kid devices.** _Current behavior · revised._ Agents manage /chores via `chores_*` MCP or pnpm chores. The legacy board and its tools are deleted. The existing data, balances, history, pending approvals and receipt keys remain authoritative; no reimport or synchronization occurs. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N19: Clippy or Telegram management](inventory.md#n19); [N22: Shared live legacy data or ongoing resync](inventory.md#n22).

## Parent: help the family pack

<a id="p52"></a>

- **P52 — As a parent, I can ask an agent for individual and family packing progress.** _Current behavior · revised._ Requires agent-accessible packing state rather than relying solely on one browser’s local storage. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N25: Browser-only packing](inventory.md#n25).

<a id="p53"></a>

- **P53 — As a parent, I can ask an agent to update a kid’s packing checklist.** _Current behavior · revised._ Retain individual, all-packed, and clear operations without a dedicated parent checklist UI. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N25: Browser-only packing](inventory.md#n25).

<a id="p54"></a>

- **P54 — As a parent, I can reset packing for another trip through an agent.** _Current behavior · revised._ The kid packing UI remains. Remote operation needs access to its authoritative state. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N25: Browser-only packing](inventory.md#n25).

## Added rebuild capabilities

<a id="k70"></a>

- **K70 — As a kid, I can earn two extra stars by completing every task in a nonempty time period and see my progress toward that bonus.** _Current behavior · added._ Award exactly +2 per child/Pacific day/nonempty named period once all remaining required work is approved. Parent-hidden work is excluded, including after opening; hiding itself grants no chore stars. Ordinary missed work remains unfulfilled. Late approval of an on-time request can settle its original period. Undo or restored requirements reconcile the award without duplicate net credit. No extra daily bonus, empty-period payout, or Bonus-period award. **Not current behavior:** [N09: Extra ten-star daily award](inventory.md#n09); [N10: Empty-period or Bonus-period payout](inventory.md#n10); [N11: Hidden work still required](inventory.md#n11); [N14: Dedicated Choose another button](inventory.md#n14).

<a id="p55"></a>

- **P55 — As a parent, I can set the order of each child’s chores within a time period through ChatGPT and MCP.** _Current behavior · added._ Persist explicit order per child/time group; changes appear without rewriting occurrence/submission facts. The September 8 list in routine-order.md was the initial order. Later explicit parent order changes become authoritative; weekday filtering and temporary kid selections preserve that sequence. **Not current behavior:** [N08: Automatic chore sorting](inventory.md#n08); [N18: Dedicated parent interface](inventory.md#n18).

<a id="p56"></a>

- **P56 — As a parent, I can receive chore notifications in an MCP Events-capable client.** _Current behavior · added._ Authenticated MCP clients receive the same new notifications as Telegram through webhook-only draft events/list, events/subscribe and events/unsubscribe under chores.notification. Verified HTTPS receivers use client-supplied Standard Webhooks secrets. Subscriptions are isolated by authenticated principal and URL, expire after a negotiated one-minute to one-day grant, and retain signed independent retries in Redis. Payloads preserve the exact notification text and stable ID. The journal is committed atomically with the domain change, independent of Telegram, with up to 5,000 events from seven days for replay. Clients refresh before expiry, retain safe cursors, deduplicate eventId and inspect authoritative state after truncated or gap. Public polling and SSE Events delivery are not current behavior; kid cookies never grant event access. Missing subscriptions return NotFound; subscription/verification limits return ResourceExhausted. Every integer TTL suggestion clamps to the advertised grant range. Initial maxAgeMs applies across the full replay regardless of commit/timestamp ordering. **Not current behavior:** [N18: Dedicated parent interface](inventory.md#n18); [N19: Clippy or Telegram management](inventory.md#n19); [N29: MCP polling and push delivery](inventory.md#n29).
