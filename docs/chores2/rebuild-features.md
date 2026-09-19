# Rebuild feature dispositions

Target scope: [rebuild-scope.md](rebuild-scope.md). The original [inventory](inventory.md) remains the source audit. Every original ID appears exactly once below.

**Retained** means keep the capability, not its old implementation quirks. **Revised** means use the target statement and notes. **Lower priority** is not a removal. **Removed** statements are shown only for traceability and are not target requirements.

Untimed Bonus chores remain available anytime. On-time approval requests can be approved after their window/day closes. New late submissions cannot. Parents manage through ChatGPT and MCP. Telegram only delivers notifications. There is no Clippy or dedicated parent UI.

Coverage: 123 original IDs; 27 retained, 20 removed, 72 revised, 4 lower priority.

## Kid: get to my board

- **K01 — As a kid, I can use the chore board on a device my family has unlocked.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K02 — As a kid, I can move between Chores, Rewards, and Packing.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K03 — As a kid, I can recognize my chores by my name and color.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K04 — As a kid, I can choose whose chores to view on a small screen.** _Removed._ Small-screen kid selector is outside the explicitly requested iPad-landscape-only rebuild. All three children remain visible in permanent columns.

- **K05 — As a kid, I can open a link that selects my chore column on a small screen.** _Removed._ Small-screen links selecting one kid are outside the explicitly requested iPad-landscape-only rebuild.

- **K06 — As a kid, I can see today and the current time window.** _Revised · Core._ Default board context is the current Pacific date/window, not a freely selected day.

- **K07 — As a kid, I can look backward and forward one day at a time.** _Lower Priority._ Lower priority, not removed. Do not make this a dependency of the primary current-time kid experience. No other-day/time-group chore lists or completion are authorized. Any later date-view design must respect the strict visibility rule; do not copy the original date mode.

- **K08 — As a kid, I can jump back to today.** _Lower Priority._ Lower priority, not removed. Do not make this a dependency of the primary current-time kid experience. No other-day/time-group chore lists or completion are authorized. Any later date-view design must respect the strict visibility rule; do not copy the original date mode.

- **K09 — As a kid, I can leave a past or future day idle and have the board return to today.** _Lower Priority._ Lower priority, not removed. Do not make this a dependency of the primary current-time kid experience. No other-day/time-group chore lists or completion are authorized. Any later date-view design must respect the strict visibility rule; do not copy the original date mode.

- **K10 — As a kid, I can refresh the chore board manually.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K11 — As a kid, I can have my board reflect the current time window and changes made through ChatGPT and MCP.** _Revised · Core._ Current-window changes cannot depend on a full reload. Recheck eligibility after refresh, reconnect, tab return, and before writes. The original polling interval is not a target requirement.

## Kid: understand what needs doing

- **K12 — As a kid, I can see my current-window chores and untimed Bonus chores that are eligible now.** _Revised · Core._ Never expose another named window through a URL, group, preview, or stale state. Honor kid assignment and authoritative time.

- **K13 — As a kid, I can recognize a chore by its title, emoji, and star value before acting.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K14 — As a kid, I can spot recently added chores.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K15 — As a kid, I can focus on the current time window while still reaching untimed Bonus chores anytime.** _Revised · Core._ Other named time groups have no lists or navigation controls. Exact Bonus placement is a presentation choice.

- **K16 — As a kid, I can see when my current chore window ends.** _Revised · Core._ New submissions stop at the cutoff. Untimed Bonus work has no time-group cutoff, but remains subject to its date/recurrence eligibility.

- **K17 — As a kid, I can have the next time window’s chores replace the previous window’s chores automatically.** _Revised · Core._ No overlapping named windows and no persistent-open exception. Timely pending approval remains recorded even when the old cards leave the screen.

- **K18 — As a kid, I can expand or collapse a group myself.** _Removed._ Remove time-group expansion/collapse. Non-current windows are absent, not hidden behind controls.

- **K19 — As a kid, I can leave extra groups open while I am interacting.** _Removed._ Remove persistent/manual group expansion and idle recollapse behavior, including Evening overlap.

- **K20 — As a kid, I can follow my chores in the order my parent specified for the current time period.** _Revised · Core._ Initialize each child/period from routine-order.md. Shared tasks first, then that child’s extras in written order. Filter weekdays without reordering survivors. No sorting by stars, title, type, creation time, or model priority.

- **K21 — As a kid, I can see my current-period progress and two-star bonus opportunity.** _Revised._ Only nonempty named periods earn completion bonuses. Daily progress remains counts-only; no extra ten-star award. Untimed Bonus chores are outside period targets; pending approval is not completion.

- **K22 — As a kid, I can see when I have no open chores in the current window.** _Revised._ Do not claim the whole day is done or display upcoming timed work. Untimed Bonus availability can be shown separately.

- **K23 — As a kid, I can see a daily chore when its next daily occurrence is eligible.** _Revised._ The next occurrence is distinct from yesterday’s missed work. Named time windows and the untimed exception apply.

- **K24 — As a kid, I can see a weekly chore when its next scheduled occurrence is eligible.** _Revised._ Honor scheduled weekdays plus the current time window or untimed eligibility; no overdue catch-up path.

- **K25 — As a kid, I can keep seeing an unfinished one-off chore after its scheduled day.** _Removed._ Remove automatic overdue one-off carryover. A parent may explicitly schedule a new eligible opportunity; this does not backdate the missed occurrence.

## Kid: complete chores, earn stars, and correct mistakes

- **K26 — As a kid, I can open an eligible chore to complete it or request required approval.** _Revised · Core._ No Skip action. An expired timed modal must not remain actionable.

- **K27 — As a kid, I can complete an occurrence that is eligible now and receive its stars.** _Revised · Core._ No early, backdated, or elapsed-window submissions. Enforce on the server. On-time approval requests may be settled later.

- **K28 — As a kid, I can celebrate a successful chore completion with animation and sound.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K29 — As a kid, I can earn a repeatable chore again when it is eligible.** _Revised._ Untimed repeatable chores remain available anytime; timed ones only in their active window. Each attempt has its own identity and validated cooldown. Approval of an earlier attempt does not authorize a new late one.

- **K30 — As a kid, I can earn two extra stars after completing every task in a nonempty time period.** _Revised._ This replaces the ten-star daily bonus. An on-time pending request can settle its original period bonus after later approval. No skip credit.

- **K31 — As a kid, I can see and dismiss a daily-bonus celebration.** _Removed._ Remove the ten-star daily-bonus dialog. Period progress still shows its earned two-star award.

- **K32 — As a kid, I can review completions from the current time window and today’s untimed work.** _Revised._ Do not reintroduce other named groups, historical completion actions, or group persistence timers.

- **K33 — As a kid, I can undo one of my displayed completions.** _Revised._ Only currently displayed current-window/untimed completions are kid-accessible. Undo must target that exact record; historical parent corrections use agents.

- **K34 — As a kid, I can have my balance reflect losing a period bonus when I undo a required chore.** _Revised._ Undo reverses the two-star award if its period becomes incomplete; re-completion restores at most one net award. Historical daily credits remain in the ledger.

- **K35 — As a kid, I can carry my unspent star balance from day to day.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

## Kid: ask for parent approval

- **K36 — As a kid, I can recognize an eligible chore that explicitly needs parent approval.** _Revised._ Deadline expiry no longer creates an approval opportunity; the expired timed chore leaves the kid view.

- **K37 — As a kid, I can submit an eligible chore for parent approval.** _Revised · Core._ Persist the occurrence and authoritative on-time submission before Telegram delivery. No new requests for earlier days or closed time groups.

- **K38 — As a kid, I can request credit for a past day after an extra confirmation.** _Removed._ Remove past-day and elapsed-time-group completion requests, their prompt, and any late-request approval escape hatch.

- **K39 — As a kid, I can see whether my valid approval submission was accepted and whether sending its notification needs retrying.** _Revised._ Separate durable request acceptance from Telegram delivery so notification failures do not lose an on-time submission. Closing a prompt does not retract it.

- **K40 — As a kid, I can see that my eligible chore is awaiting parent approval.** _Revised._ Use durable per-occurrence request identity rather than a permanent browser-only marker. Old timed cards stay hidden after cutoff; their request still exists for parent review.

- **K41 — As a kid, I can receive stars when my parent approves my on-time submission later.** _Revised · Core._ Later review may occur after the window or day ends. Credit belongs to the original occurrence. Update balance/progress without reopening the old timed chore.

## Kid: skip for today

- **K42 — As a kid, I can skip my assignment for the rest of today before its deadline.** _Removed._ Remove the skip entry action as well as the follow-on K43–K45 behaviors.

- **K43 — As a kid, I can change my mind before confirming a skip.** _Removed._ Remove skip confirmation, cancellation, and unskip-related UX.

- **K44 — As a kid, I can skip my part without hiding the chore from my siblings.** _Removed._ Remove kid-triggered per-assignment skipping.

- **K45 — As a kid, I can have a skipped chore count toward finishing my day.** _Removed._ Remove skip-based progress, daily bonus eligibility, and notifications.

## Kid: spend stars on rewards

- **K46 — As a kid, I can browse rewards assigned to me alongside my current balance.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K47 — As a kid, I can find cheaper rewards first.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K48 — As a kid, I can see which rewards I can afford and how many more stars I need.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K49 — As a kid, I can inspect a reward before spending stars.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K50 — As a kid, I can redeem an available reward when I have enough stars.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K51 — As a kid, I can celebrate a successful redemption.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K52 — As a kid, I can recognize a one-off reward I have already taken.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K53 — As a kid, I can redeem a repeatable reward again while I can afford it.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K54 — As a kid, I can leave Rewards idle and return automatically to the current chore view.** _Revised._ Return to the current window and eligible untimed work, not a stale selected day.

## Kid: personalize the board and get help

- **K55 — As a kid, I can choose the color of my column.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K56 — As a kid, I can save or cancel my color choice.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K57 — As a kid, I can have an open chore’s title read aloud.** _Removed._ Remove chore-title read-aloud, its controls and its speech endpoint. The kids can read their chores.

- **K58 — As a kid, I can hear the title of a completed chore without undoing it.** _Removed._ Remove completed-chore title speech. Open-chore title speech (K57) is also removed.

- **K59 — As a kid, I can use the board in my device’s light or dark appearance.** _Lower Priority._ Lower priority, not removed. Do not make this a dependency of the primary current-time kid experience.

- **K60 — As a kid, I can wake the idle shared chore display and see the work eligible now.** _Revised._ Re-evaluate the current window on wake. Preserve the shared-display capability; choose screen-saver eligibility without needing to expose upcoming chores.

- **K61 — As a kid, I can try reloading a failed board section.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

## Kid: pack for a camping trip

- **K62 — As a kid, I can open a camping packing checklist with my own progress.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K63 — As a kid, I can see exactly what the packing list asks me to bring.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K64 — As a kid, I can check an item as I pack it and uncheck it if needed.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K65 — As a kid, I can see my packing count and progress bar.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K66 — As a kid, I can mark my entire packing list packed at once.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K67 — As a kid, I can clear my packing list and start again.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K68 — As a kid, I can reset everyone’s packing lists for a new trip.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

- **K69 — As a kid, I can return to my packing progress in the same browser.** _Retained._ Retain this capability subject to rebuild-scope.md. Current implementation details and known defects are not automatically requirements.

## Parent: understand the family’s work and balances

- **P01 — As a parent, I can make a shared family device ready for the kid board.** _Revised._ Keep device access/setup as a capability; no dedicated parent setup portal. The authorization mechanism is not specified yet.

- **P02 — As a parent, I can ask an agent for each kid’s chores, completions, progress, and stars.** _Revised._ Provide readable results in ChatGPT through MCP; Telegram only delivers notifications.

- **P03 — As a parent, I can ask an agent to inspect past activity and future schedules.** _Revised._ Parent read access to history is allowed. It does not enable late/future completion or expose old timed cards to kids.

- **P04 — As a parent, I can ask an agent to distinguish daily progress from spendable stars.** _Revised._ Keep occurrence date, submission time, approval time, and resulting balance unambiguous.

- **P05 — As a parent, I can rename kid columns through an agent.** _Revised._ Keep identity and history stable when changing a display name.

- **P06 — As a parent, I can set a kid’s color through an agent.** _Revised._ The kid-facing color picker remains; no parent settings screen.

## Parent: define and change chores

- **P07 — As a parent, I can create a chore with its title, emoji, and star value through an agent.** _Revised._ Retain the underlying configuration capability.

- **P08 — As a parent, I can assign a chore to one or more kids through an agent.** _Revised._ Each kid has independent occurrences and credit.

- **P09 — As a parent, I can create a one-off chore through an agent.** _Revised._ Give it an eligible date/time or untimed occurrence; do not automatically carry a missed occurrence into later dates/windows.

- **P10 — As a parent, I can schedule or reschedule a one-off chore through an agent.** _Revised._ Only create an eligible current/future opportunity. Rescheduling cannot manufacture completion credit for a missed past occurrence.

- **P11 — As a parent, I can create daily routines through an agent.** _Revised._ Each scheduled day/window is a distinct opportunity.

- **P12 — As a parent, I can schedule routines for selected weekdays through an agent.** _Revised._ Show the occurrence only when its current time/date eligibility permits it.

- **P13 — As a parent, I can create a repeatable chore through an agent.** _Revised._ Untimed repeatable chores stay available anytime; timed ones remain window-gated.

- **P14 — As a parent, I can assign a chore to a named time window or make it an untimed Bonus chore through an agent.** _Revised._ The untimed option is explicitly retained. Named windows do not overlap in the kid experience.

- **P15 — As a parent, I can require approval for a chore through an agent.** _Revised._ Kids must submit during eligibility. On-time requests remain approvable later.

- **P16 — As a parent, I can edit chore titles, emoji, and star values through an agent.** _Revised._ Preserve recorded occurrence/submission facts and earned amounts; do not rewrite history accidentally.

- **P17 — As a parent, I can change chore types and repeat schedules through an agent.** _Revised._ Reconcile future eligibility safely; no stale global completed flag trapping new assignees.

- **P18 — As a parent, I can change chore assignments through an agent.** _Revised._ Changes must not lose recorded credit or make an expired occurrence completable.

- **P19 — As a parent, I can remove a chore from availability through an agent.** _Revised._ Preserve sufficient records to explain past credit; do not inherit destructive archive semantics by default.

## Parent: pause routines and make exceptions

- **P20 — As a parent, I can pause a repeated chore through an agent.** _Revised._ Scheduling changes do not award chore stars or count an occurrence as skipped/completed.

- **P21 — As a parent, I can resume a repeated chore through an agent.** _Revised._ Apply ordinary current/future eligibility; no backdated completion.

- **P22 — As a parent, I can pause the family’s chores through an agent.** _Revised._ Retain the scheduling capability without a parent UI or skip-credit side effect.

- **P23 — As a parent, I can resume the family’s chores through an agent.** _Revised._ Keep scheduling and completion records separate.

- **P24 — As a parent, I can change a chore’s availability for one kid or all assignees through an agent.** _Revised._ Parent scheduling exceptions remain. They are not a kid skip action and do not create skipped/completed credit or retroactive completion.

- **P25 — As a parent, I can excuse a kid’s chore today using the board’s skip flow.** _Removed._ Remove the parent version of the board skip action. Agent scheduling/pauses remain separate from completion credit.

## Parent: approve work and correct credit

- **P26 — As a parent, I can receive on-time approval requests in Telegram.** _Revised._ Identify the child, chore, occurrence, submission time, and expected award.

- **P27 — As a parent, I can review a request in Telegram without approving it merely by reading it.** _Revised._ Approval requires an explicit instruction to ChatGPT through MCP; Telegram is notification-only, with no action buttons or web approval page.

- **P28 — As a parent, I can see which occurrence an approval request belongs to and when it was submitted.** _Revised._ Differentiate a valid pending request from an attempted new late submission, including after midnight.

- **P29 — As a parent, I can approve an on-time submission later through ChatGPT and MCP.** _Revised._ Approval can follow the window/day cutoff. Preserve the original occurrence and submission time; do not reopen its old kid card.

- **P30 — As a parent, I can see whether an approval succeeded, was already handled, or failed.** _Revised._ Report the authoritative result in ChatGPT and prevent duplicate credit; Telegram may receive a notification.

- **P31 — As a parent, I can record an eligible current completion through an agent.** _Revised._ No generic parent backdate/future-date bypass. Later review of an existing on-time request is allowed separately.

- **P32 — As a parent, I can undo an exact completion through ChatGPT and MCP.** _Revised._ Resolve the exact completion through MCP. Telegram notifications have no mutation buttons. No parent undo web page; a stale command must not undo another record.

- **P33 — As a parent, I can ask an agent to correct a recorded completion.** _Revised._ Historical undo/correction is distinct from newly completing a past occurrence. No parent board controls.

- **P34 — As a parent, I can add or remove stars through an agent.** _Revised._ Record manual adjustments explicitly; do not disguise them as completion of a missed chore.

## Parent: define rewards

- **P35 — As a parent, I can create and price rewards through an agent.** _Revised._ The kid reward UI remains.

- **P36 — As a parent, I can assign rewards to kids through an agent.** _Revised._ Retain independent eligibility and balances.

- **P37 — As a parent, I can choose once-per-kid or repeatable rewards through an agent.** _Revised._ Retain the reward types; no parent reward-configuration UI.

- **P38 — As a parent, I can edit reward details, prices, types, and assignments through an agent.** _Revised._ Preserve transaction history and authoritative purchase prices.

- **P39 — As a parent, I can remove a reward from availability through an agent.** _Revised._ Removal must not silently destroy the history needed to explain spending.

- **P40 — As a parent, I can redeem an eligible reward for a kid through an agent.** _Revised._ Use the same balance and eligibility rules as the kid action.

## Parent: recognize last night’s bedtime behavior

- **P41 — As a parent, I can record which kids were ready and in bed before Alexa’s bedtime announcement.** _Removed._ Remove the special last-night in-bed achievement template and workflow.

- **P42 — As a parent, I can record which kids had a delightful bedtime through waking up.** _Removed._ Remove the special delightful-night achievement template and workflow.

- **P43 — As a parent, I can turn the selected bedtime achievements into today’s morning chores.** _Removed._ Remove automatic creation of morning chores from last-night bedtime recognition.

- **P44 — As a parent, I can see which bedtime achievements already have chores for today.** _Removed._ Remove bedtime selections and duplicate-template discovery.

- **P45 — As a parent, I can see the outcome of a bedtime submission.** _Removed._ Remove bedtime submission/status/result UI and its specialized action.

- **P46 — As a parent, I can receive a morning reminder to record bedtime stars when the reminder endpoint is scheduled externally.** _Removed._ Remove dedicated bedtime reminder delivery, endpoint, and scheduling requirements.

## Parent: stay informed and use the shared display

- **P47 — As a parent, I can receive Telegram updates for completed and undone chores.** _Revised._ Parent actions take place in ChatGPT through MCP. Telegram delivers notifications only.

- **P48 — As a parent, I can receive Telegram updates for period bonuses and reward redemptions.** _Revised._ Two-star period bonuses replace daily bonuses. Skip updates and dedicated bedtime reminders are removed.

- **P49 — As a parent, I can have recorded changes survive Telegram delivery failures.** _Revised._ Persist accepted on-time requests before delivering their notification; retry delivery without duplicating the domain operation.

- **P50 — As a parent, I can leave the kid board on a shared display that refreshes and handles inactivity.** _Revised._ This is the kid display, not a parent dashboard. Show only current timed work and eligible untimed Bonus work.

- **P51 — As a parent, I can have changes made through agents appear on the family’s kid devices.** _Revised._ Use shared authoritative state and reliable writes; no parent application surface.

## Parent: help the family pack

- **P52 — As a parent, I can ask an agent for individual and family packing progress.** _Revised._ Requires agent-accessible packing state rather than relying solely on one browser’s local storage.

- **P53 — As a parent, I can ask an agent to update a kid’s packing checklist.** _Revised._ Retain individual, all-packed, and clear operations without a dedicated parent checklist UI.

- **P54 — As a parent, I can reset packing for another trip through an agent.** _Revised._ The kid packing UI remains. Remote operation needs access to its authoritative state.

## New rebuild capabilities

- **K70 — As a kid, I can earn two extra stars by completing every task in a nonempty time period and see my progress toward that bonus.** _Added · Core._ Award once per child/Pacific day/named period. Empty periods earn nothing. Untimed Bonus chores are excluded. On-time requests can settle the original reward after later approval. Undo reverses it if incomplete; re-completion restores at most one net award. Replaces the ten-star daily bonus. Tapping the period card opens the current chore picker.

- **P55 — As a parent, I can set the order of each child’s chores within a time period through ChatGPT and MCP.** _Added · Core._ Initial order is the September 8 Kids chores message, recorded in routine-order.md. Common tasks precede that child’s extras. Weekday filtering and temporary kid selection preserve saved order.

Specification only; no application or production state was modified. Baseline source commit `18910b2799e21b6fa5481d838e99cfea064013cd`.
