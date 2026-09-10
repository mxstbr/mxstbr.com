# Chores rebuild scope

This is the target product direction, incorporating Max’s changes to the [source inventory](inventory.md). The source inventory remains a description of the existing implementation. This document takes precedence when deciding what to build; the old implementation’s quirks and defects are not requirements.

Every original capability has a disposition in [rebuild-features.md](rebuild-features.md) and [rebuild-features.json](rebuild-features.json). Original K/P identifiers remain stable for discussion.

## Supported display

Build for the existing **old iPad in landscape only**. The [full-screen iPad proposal](ipad-landscape-ui.md) uses three persistent child columns with stable button positions. Small-screen selection/deep-link capabilities K04/K05 are now outside scope. Other device layouts are not rebuild requirements. Exact iPad/Safari details need checking during implementation; a 1024px-wide 4:3 viewport is the design starting point.

## The main experience

**Kids see and act on the chores for the current time window, with untimed Bonus chores available anytime. Parents steer the system by talking to ChatGPT, which uses MCP. Telegram only delivers notifications; Clippy is not part of the rebuild.**

The kid board should answer “What do I need to do now?” It does not show other time windows as collapsed sections, tabs, previews, or expandable lists. A morning chore cannot be exposed or newly submitted in the afternoon; an afternoon chore cannot be exposed or newly submitted in the morning. Untimed Bonus chores are the explicit exception to time-group filtering, not a way to reveal other groups. Submission eligibility must be enforced by the service as well as by the screen.

The current window changes automatically. At a boundary, the previous window’s chore cards leave the kid view and the next window’s cards become eligible to appear. The child cannot keep the old window open. Refresh, navigation, a bookmarked date, a stale modal, a changed device clock, or a direct action request must not restore access to an expired occurrence. Use the authoritative family clock, retaining Pacific time unless separately changed.

Only current-window completed cards and the current day’s untimed completions are retained on the kid board. Parents may still inspect historical records through ChatGPT and MCP. Lower-priority date browsing does not authorize a kid-facing past/future chore list that defeats the current-window rule.

## Kid capabilities for the central flow

- **K12 — As a kid, I can see the chores assigned to me for the current time window, plus untimed Bonus chores available anytime.** Only assignments eligible now appear. Other kids’ assignments remain independent.
- **K15 — As a kid, I can focus on the current time window’s chores and reach untimed Bonus chores anytime.** Other windows’ cards, lists, and group controls are absent. The exact Bonus presentation can be designed without restoring time-group browsing.
- **K17 — As a kid, I can have my chore list change automatically when the current time window changes.** Windows do not overlap as the old Evening/Night display did. No manual expansion or persistent-open behavior survives.
- **K16 — As a kid, I can see when my current chore window ends.** The cutoff ends the ability to start a completion or approval request for that occurrence.
- **K26 — As a kid, I can open an eligible current or untimed chore to complete it, request required approval, or hear its title.** There is no Skip action. Reading an open chore’s title remains; completed-chore speech is removed.
- **K27 — As a kid, I can complete a chore while its occurrence is eligible now and receive its stars.** I cannot start completion early, late, for a previous day, or for a previous time group. The service rejects a stale new attempt after its window closes. An approval request accepted on time can still be reviewed later.
- **K36/K37 — As a kid, I can ask for parent approval of an eligible current chore that requires it.** Explicit approval requirements remain. Approval is no longer an escape hatch for a missed deadline or a different date.
- **K32/K33 — As a kid, I can review and undo my displayed completions from the current window and today’s untimed work.** This does not add a way to browse or complete old timed chores. Historical corrections are parent-agent operations, not historical kid controls.
- **K21/K30 — As a kid, I can track progress and earn the daily bonus by completing the required work.** Removing a chore from view when its window expires does not mark it done. Skips provide neither progress nor bonus eligibility because skipping is removed.
- **K22 — As a kid, I can see that I have no open chores for the current window.** This does not expose upcoming chores or claim that every chore for the day was completed.

Each child earns **two additional stars for completing all tasks in a nonempty named time period**. The existing ten-star **daily** bonus remains; this is an added period reward, not its replacement. Untimed Bonus chores are outside the period target. Pending approvals can settle the original period reward later, once all required work is approved. Empty periods have neither a bonus offer nor a payout. A missed required occurrence must not silently disappear from bonus accounting merely because its card is no longer shown. On-time submissions still awaiting approval remain pending, not missed or completed; a later approval may settle the original day’s progress and bonus. Pauses and schedule edits remain distinct parent scheduling operations; they do not manufacture a completion or award chore stars.

Untimed does not mean backdated: untimed daily work still belongs to its day, and a date-specific one-off does not become completable for an expired day. Perpetual untimed work can be performed again today as a new eligible occurrence. The existing distinction between untimed perpetual work excluded from the daily target and other eligible untimed work is unchanged unless separately revised.

Daily and weekly recurrence remain: a new scheduled occurrence can appear in a later window/day. An unfinished one-off does not automatically carry overdue work into another window or day. A parent may explicitly reschedule work as a current/future assignment through an agent; that is not backdating credit for the missed occurrence.

## Routine order and period reward

The [September 8 routine order](routine-order.md) is authoritative: preserve the shared steps first, then each child’s extras, in the exact written sequence. Filter weekday-only tasks without reordering the remaining tasks. Persist explicit per-child/per-period order; the next card is the first still-actionable eligible occurrence in that sequence. “Choose another” does not change the saved order.

- **K70 — As a kid, I can earn two extra stars by completing every task in a nonempty time period and see my progress toward that bonus.** Show “Finish this morning · +2 stars,” a pending-approval state when necessary, and “Morning bonus earned! · +2 stars” when awarded. Award once per child/day/period, regardless of completion order. No award for an empty period or missed/hidden work; a later approval of timely work may settle it. Undo reverses it if the period becomes incomplete, without permitting duplicate net awards on re-completion.
- **P55 — As a parent, I can set the order of each child’s chores within a time period through ChatGPT and MCP.** Initialize from the referenced Kids chores message, including per-child extras and weekday filtering.

## Removed

| Original IDs                   | Removed behavior                                                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| K04–K05                        | Small-screen child selection and deep links; the target is the shared landscape iPad only                                                                                      |
| K18–K19                        | Expanding/collapsing other chore groups, keeping groups manually open, recollapse timers, persistent Evening expansion                                                         |
| K25                            | Automatically carrying an overdue one-off into a later day/window as unfinished work that can still be completed                                                               |
| K38                            | Requesting completion credit for a past day; the same ban applies to elapsed time groups                                                                                       |
| K42–K45                        | The entire skip flow, including the entry action, confirmation, per-kid skip, progress credit, and bonus credit                                                                |
| K58                            | Reading a completed chore’s title aloud                                                                                                                                        |
| P25                            | The parent version of the board’s skip flow                                                                                                                                    |
| P41–P46                        | The complete dedicated last-night bedtime workflow: both achievement templates, selections, generated morning chores, result views, reminder endpoint, and reminder scheduling |
| Parent surfaces across P01–P54 | Parent web/app screens, dashboards, forms, PIN gates, approval pages, undo pages, and other dedicated parent UI                                                                |

The generic ability to create evening or night chores remains. Removing the bedtime feature removes its special workflow; it does not remove the Evening or Night time windows or prevent a parent from defining an ordinary chore about bedtime.

## Lower priority, not removed

| Original IDs | Capability                                                       | Constraint                                                                                                                             |
| ------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| K07–K09      | Date navigation, Today return, and idle return from another date | Secondary; cannot restore non-current chore lists or past/future completion. Any later history design must respect the visibility rule |
| K59          | Dark/light appearance                                            | Secondary; not a requirement to remove system appearance support                                                                       |

## Parents operate through ChatGPT and MCP

There is no dedicated parent UI in the rebuilt application. ChatGPT conversations backed by MCP are the parent interaction surface. Telegram is notification-only: no conversational bot or approval/undo buttons. Clippy is not needed. The MCP server or equivalent tool interface is part of the target product’s operating model; the old MCP implementation remains replaceable.

- **P02–P04 — As a parent, I can ask an agent for the family’s current chores, history, progress, and star balances.** The agent may inspect other dates/windows without exposing them on the kid board.
- **P05–P19 — As a parent, I can manage kids’ names/colors and chore definitions, assignments, schedules, star values, time windows, and approval requirements through ChatGPT and MCP.** Changes appear on the kid board when relevant to its current window.
- **P20–P24 — As a parent, I can manage pauses, resumption, and scheduling exceptions through an agent.** Scheduling is distinct from marking work completed or skipped. It cannot retroactively create completion credit for an expired occurrence.
- **P26–P30 — As a parent, I can review and explicitly approve an on-time child submission through ChatGPT and MCP, even after its window or day has ended.** A message identifies the child, chore, occurrence, submission time, and credit. Reading it makes no change. The explicit action returns success, already handled, or a meaningful failure. No link opens a parent web form. Later approval settles the original submitted occurrence; it does not reopen old chores to the kid.
- **P31 — As a parent, I can record an eligible current completion through an agent.** Parent authority does not provide a general backdated/future-completion bypass. Approving an already-recorded on-time request later is a separate supported action.
- **P32–P34 — As a parent, I can undo a recorded completion or adjust a star balance through ChatGPT and MCP.** Undo targets an exact record. A manual star correction is recorded as an adjustment, not disguised as completion of a missed chore.
- **P35–P40 — As a parent, I can create, price, assign, change, remove, and redeem rewards through an agent.** The kid’s existing reward-browsing and redemption experience remains.
- **P47–P49 — As a parent, I can receive chore, approval, undo, daily-bonus, and reward updates in Telegram.** Skip and dedicated bedtime notifications disappear. Notifications and mutations share an authoritative result so retries do not create duplicate credit.
- **P50–P51 — As a parent, I can use the shared kid display and have agent-made changes appear there.** This does not require a parent dashboard.
- **P52–P54 — As a parent, I can inspect and help manage packing through an agent.** There is no separate parent packing screen. These retained remote capabilities require packing state to be accessible to the agent; the old browser-local storage limitation is not sufficient for reliable remote management.

Kid-facing shared access/setup remains necessary, but no new parent setup portal is specified. The device authorization mechanism can be chosen during implementation. Parents can naturally look at the kid display; it does not become a parent management UI.

## Confirmed follow-up decisions

1. **On-time submissions remain approvable later.** A request accepted during its allowed window can be approved later through ChatGPT and MCP, including after the day rolls over. Preserve the occurrence and authoritative submission time separately from the approval time. A request merely opened on screen or sent by a stale client after cutoff is not an on-time submission. Durable request creation must precede notification delivery so a Telegram delivery delay does not destroy an otherwise accepted submission.
2. **Untimed Bonus chores remain available anytime.** They can coexist with the current timed list, including outside named time windows, subject to their own assignment, day/date, pause, recurrence, and completion eligibility. They do not grant access to any other named time group.
3. **Routine order follows the written September 8 list.** Shared tasks precede each child’s extras, preserving the written order within each period.
4. **Nonempty time periods award two additional stars.** The award is per child/day/period and is visible alongside current-period progress.

## Proposed kid interaction

The [current-focus UI proposal](kid-focus-ui.md) explores one suggested next action per child, current-window progress, quiet access to Bonus chores, and distinct done/pending/expired states. These are design recommendations, not newly confirmed product requirements.

## Remaining design detail

The original cutoffs were noon, 5pm, 7pm, and 10pm Pacific. The September 8 routine instruction changes the Evening cutoff to **8:15pm**; the rebuild’s non-overlapping Night period starts then. Keep noon, 5pm, and 10pm as the other baseline cutoffs. The rebuild still needs an explicit opening time for Morning. Outside named active windows, eligible untimed Bonus chores can remain available; do not reuse yesterday’s Night or expose tomorrow’s Morning.

## Acceptance examples

| Situation                                                                    | Required result                                                                                                                                                        |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Morning is active                                                            | Morning and eligible untimed Bonus chores are available; Afternoon, Evening, and Night chores cannot be opened through groups, links, or previews                      |
| Every task in a nonempty period is completed                                 | Award that child exactly two period-bonus stars and show the earned state                                                                                              |
| The period has no tasks for that child                                       | Show no period-bonus offer and award zero stars                                                                                                                        |
| The last timely submission awaits approval                                   | Show the bonus as waiting; later approval can settle the original period once                                                                                          |
| An undo makes a rewarded period incomplete                                   | Reverse its two-star bonus; legitimate re-completion can restore it without duplicate net credit                                                                       |
| A weekend omits school tasks                                                 | Keep the remaining chores in the original parent-specified relative order                                                                                              |
| The Morning cutoff arrives                                                   | Morning cards and their completion controls leave the kid view; the current-window list updates                                                                        |
| A morning details dialog was left open                                       | A late submit is rejected; it does not create an approval request or award stars                                                                                       |
| A kid changes a day/window URL or device clock                               | The service still uses its authoritative current eligibility; no early/late completion                                                                                 |
| A chore was missed in the earlier window with no accepted on-time submission | It is not carried into the current chore list, marked completed, marked skipped, or credited toward the bonus                                                          |
| A kid opens a current chore’s actions                                        | Complete/request approval and open-title audio may appear; Skip never appears                                                                                          |
| A parent acts later on an on-time Telegram request                           | An explicit instruction to ChatGPT, executed through MCP, approves the original submitted occurrence without a parent web page or reopening that time group to the kid |
| The day rolls over while a valid request awaits approval                     | It remains approvable for its original occurrence; approval time and submission time are kept distinct                                                                 |
| A kid reaches untimed Bonus chores                                           | Eligible untimed work is available anytime, without revealing non-current named time groups                                                                            |
| A parent makes a scheduling or reward change through an agent                | The authoritative state updates and the kid experience reflects it; no parent application UI is needed                                                                 |
| Bedtime recognition would previously have run                                | No special achievement form, generated bedtime-recognition chores, or dedicated reminder runs                                                                          |
| A current-window completion is shown                                         | Undo may be available; completed-title audio is absent                                                                                                                 |

## How to use the original audit

Use the source audit to understand existing capabilities and defects, not as the target acceptance suite. In particular, original fixtures for skip bonuses, overdue one-offs, past/future completion, and the bedtime generator describe behavior intentionally removed here. The baseline source and verification artifacts stay unchanged so that distinction remains explicit.

This document records the accepted specification. See implementation.md and coverage.md for the rebuild and verification status.

Baseline source: `/Users/mxstbr/projects/mxstbr/mxstbr.com`, commit `18910b2799e21b6fa5481d838e99cfea064013cd`. The target rules above come from Max’s subsequent rebuild instructions and answers, not a claim about that commit’s behavior.
