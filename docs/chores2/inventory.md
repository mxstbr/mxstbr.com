# Chores: the complete kid and parent feature inventory

This describes the implemented product for a rebuild. Every feature is expressed as a kid or parent capability, with the rules that change its outcome. It adapts the supplied product-description guide: outside-in behavior, state transitions, boundaries, evidence, and a separate defect list, without reproducing the guide’s documentation framework.

Scope: `/chores`, `/chores/rewards`, `/chores/packing`, `/chores/bedtime-approval`, approval and undo links, their shared business rules, audio, authentication, and notifications. Parent configuration capabilities are included; the admin page, its forms/PIN/chat, MCP tools, ChatGPT widgets, and `/chores-new` preview are excluded as interfaces. The CLI was read to identify additional stored-state behavior and discrepancies, not to turn command syntax or arbitrary database edits into product features.

**Kid and parent are perspectives, not separate account roles in this implementation.** The board uses a shared family password. Anyone using an unlocked board can select any kid, complete or undo their chores, spend their stars, and change their color. Parent management capabilities below are supported by shared actions or stored state; they do not imply that a dedicated parent interface must survive the rebuild.

Evidence: source commit `18910b2799e21b6fa5481d838e99cfea064013cd` in `/Users/mxstbr/projects/mxstbr/mxstbr.com`. All included product source was read. Thirty isolated behavior checks passed, including deliberate reproductions of defects. Live browser checks confirmed the password gates for chores, rewards, packing, and bedtime approval, and the approval link’s missing-kid screen. Authenticated interactions, real Telegram delivery, and audio playback were not verified live. See [source coverage](source-coverage.md), [verification](verification.md), and [rebuild decisions and defects](rebuild-decisions.md).

## Kid: get to my board

- **K01 — As a kid, I can use the chore board on a device my family has unlocked.** The shared password unlocks the OS area; the browser remembers it with a cookie lasting up to a year. A wrong stored password shows an error and another password form. There is no separate kid login. [Source][access]
- **K02 — As a kid, I can move between Chores, Rewards, and Packing.** A fixed bottom navigation bar names all three destinations and marks the current page. Switching views returns Chores to its default day and kid selection; the optional OS query parameter is retained. [Source][navigation]
- **K03 — As a kid, I can recognize my chores by my name and color.** Each kid has a separate column, balance, assignments, and progress. Desktop shows three columns together. [Source][columns]
- **K04 — As a kid, I can choose whose chores to view on a small screen.** The chore board shows one kid at a time with a selector, defaults to the first kid, and records the selection in the URL. Rewards and Packing instead stack all kids’ columns. [Source][mobile]
- **K05 — As a kid, I can open a link that selects my chore column on a small screen.** A valid `kid` parameter selects that kid; an unknown one falls back to the first column. Desktop still shows everyone. Date and bottom-navigation links do not preserve this selection. [Source][mobile]
- **K06 — As a kid, I can see which day I am viewing.** The toolbar shows weekday, month, and date; today gets a check mark, and other days use a different background. Chore dates and daily rules use Pacific time. [Source][board-page]
- **K07 — As a kid, I can look backward and forward one day at a time.** Previous/Next controls have no explicit browsing limit. Invalid date inputs fall back to today when the date helper cannot parse them. [Source][dates]
- **K08 — As a kid, I can jump back to today.** The Today button returns to the current Pacific date. A past-day completion prompt also offers Go to today. [Source][board-page]
- **K09 — As a kid, I can leave a past or future day idle and have the board return to today.** After 30 seconds without clicks, keys, pointer movement, or touches, it replaces the viewed date with today. This can also interrupt an open prompt. [Source][past-idle]
- **K10 — As a kid, I can refresh the chore board manually.** The refresh button reloads the whole page and disables itself as reload starts. Saved family data survives; unsaved dialogs and temporary expansion choices do not. [Source][refresh]
- **K11 — As a kid, I can see changes made elsewhere appear on the chore board without refreshing it myself.** The board requests fresh data every minute and at the next Pacific midnight; successful local actions also refresh it. This is periodic synchronization, not instant shared editing. An explicitly selected date remains selected during refresh. [Source][refresh-timers]

## Kid: understand what needs doing

- **K12 — As a kid, I can see the chores assigned to me that are available for the viewed day.** A chore’s assignments, starting date, recurrence, completion history, pauses, and snoozes determine whether it appears. A sibling’s completion normally does not complete my assignment. [Source][availability]
- **K13 — As a kid, I can recognize a chore by its title, emoji, and star value before acting.** The card shows the whole title and the number of stars it offers, with singular/plural wording. [Source][chore-card]
- **K14 — As a kid, I can spot recently added chores.** Chores created within approximately the last four hours receive an amber highlight. This is based on creation time, not whether I have seen them; no read/unread state is saved. [Source][freshness]
- **K15 — As a kid, I can find chores grouped by time of day.** The groups are Morning, Afternoon, Evening, Night, and Bonus. “Bonus” contains everything without a time-of-day assignment; that label does not itself mean the chore is optional or excluded from daily progress. [Source][groups]
- **K16 — As a kid, I can see the deadline for each timed group.** Morning ends at noon, Afternoon at 5pm, Evening at 7pm, and Night at 10pm, all Pacific. At the deadline itself, completion starts requiring parent approval and skipping is disabled. [Source][deadlines]
- **K17 — As a kid, I can have the board emphasize the relevant time of day automatically.** Before noon it opens Morning; noon–5pm Afternoon; 5–7pm Evening; 7–10pm both Evening and Night; after 10pm all groups collapse. Bonus starts collapsed. Past and future dates start with all open groups expanded. Time-based changes are checked once a minute. [Source][auto-groups]
- **K18 — As a kid, I can expand or collapse a group myself.** Collapsed timed groups show how many chores remain; the collapsed Bonus group does not show that count. A manually collapsed currently relevant group may reopen on the next time update. [Source][group-controls]
- **K19 — As a kid, I can leave extra groups open while I am interacting.** Groups that normally belong collapsed fold back after 45 seconds of inactivity. Manually expanded Evening stays expanded during that mounted session. The Done section also folds back after inactivity. These preferences are not durable across reloads. [Source][group-idle]
- **K20 — As a kid, I can see ordinary chores before repeat-anytime chores within a time group.** Sorting puts perpetual chores after other chores; within the same type priority and time group, newer chores appear first. There is no manual reordering. [Source][sorting]
- **K21 — As a kid, I can see my daily progress and the ten-star bonus target.** The progress bar shows resolved chores over expected chores and a `+10` star target. “Resolved” includes both completed and skipped chores. With no expected chores, it says No chores today. [Source][progress-ui]
- **K22 — As a kid, I can see an all-clear message when my open chore list is empty.** It invites me to return when something new appears. Empty open chores and zero expected chores are different states; completed or skipped chores can empty the list. [Source][empty-board]
- **K23 — As a kid, I can see daily chores return on their next scheduled day.** Repeated chores are complete once per kid per Pacific day. Daily normally means every day; stored daily schedules with selected weekdays are also honored by the board. [Source][availability]
- **K24 — As a kid, I can see weekly chores on the weekdays selected for them.** Each selected weekday is its own due opportunity. A missed weekly chore does not stay open on an unselected day. An empty weekday list is treated as every day, despite the “weekly” label. [Source][availability]
- **K25 — As a kid, I can keep seeing an unfinished one-off chore after its scheduled day.** Its date is an earliest appearance date, not an expiry date. It remains due until I complete it, it is hidden, or it is removed. [Source][availability]

## Kid: complete chores, earn stars, and correct mistakes

- **K26 — As a kid, I can open a chore to choose what to do.** Tapping the card opens a dialog with Complete task or Request parent approval, Skip for today, and Read title. Opening the card alone does not complete it. Close or tapping the dialog backdrop dismisses it. [Source][chore-details]
- **K27 — As a kid, I can complete an eligible chore today and receive its stars.** For a chore that does not need approval, choosing Complete task records a completion and updates my balance. The amount is captured when completion is recorded. Zero-star chores can still be completed. Server rejection does not award stars. [Source][complete]
- **K28 — As a kid, I can celebrate a successful chore completion with animation and sound.** A local completion awarding more than zero stars triggers emoji/confetti and a randomly chosen completion sound. Zero-star completion skips that ordinary celebration; a daily bonus can still trigger its own celebration. Sound depends on browser playback and available audio files. [Source][celebration]
- **K29 — As a kid, I can complete a perpetual chore repeatedly.** It briefly disappears after completion and is eligible to return after five seconds; the client schedules another refresh at about 5.2 seconds. Its time-of-day approval rules still apply. The server does not enforce this cooldown, which is a defect to resolve. [Source][perpetual]
- **K30 — As a kid, I can earn ten extra stars when I resolve my final expected chore for a day.** Completion or skipping can trigger the bonus, at most once per kid per day while the bonus record exists. There must be at least one expected chore. Untimed perpetual chores are excluded; other untimed chores can count. [Source][daily-bonus]
- **K31 — As a kid, I can see and dismiss a daily-bonus celebration.** A local action that earns the bonus opens a named congratulatory dialog and larger confetti burst; Close or Awesome dismisses it. A remotely awarded bonus appears through refreshed data without this local callback-driven dialog. [Source][bonus-dialog]
- **K32 — As a kid, I can review completed chores for the viewed day.** Done today is initially collapsed, shows a count, and expands to crossed-out cards with the current title, emoji, and configured star value. On a past date the heading still says Done today. Manual star changes, spending, and bonus entries are not shown as chore cards. [Source][done]
- **K33 — As a kid, I can undo a displayed completion.** Tapping its card or Undo immediately removes that completion’s recorded stars and refreshes the board, with no confirmation or extra parent approval. This also works on past/future views. A one-off chore can reopen. [Source][undo]
- **K34 — As a kid, I can have my balance reflect losing a daily bonus when I undo a required chore.** If the undo leaves expected work unfinished, its daily bonus is removed too. The deducted total may therefore exceed the chore’s own stars. If all expected work remains resolved, the bonus stays. [Source][bonus-revoke]
- **K35 — As a kid, I can carry my unspent star balance from day to day.** The balance sums all recorded earnings, bonuses, parent adjustments, and reward spending. It is not a daily score and does not reset at midnight; it remains the current all-time balance even while browsing another day. [Source][balance]

## Kid: ask for parent approval

- **K36 — As a kid, I can recognize when completing a chore needs a parent.** A Parent OK badge appears when the chore explicitly requires approval, its deadline has passed, or I am viewing another day. The details dialog changes its completion action accordingly. [Source][approval-reason]
- **K37 — As a kid, I can ask a parent to approve a chore.** Choosing the approval action sends the kid, chore, and target date to the parents’ Telegram chat with an Approve link. It does not award stars or add a server-side pending completion. [Source][request-approval]
- **K38 — As a kid, I can request credit for a past day after an extra confirmation.** The first attempt explains that I am editing a past day and offers Go to today, Request approval, or Cancel. Only Request approval proceeds to sending the request. Future dates go directly to the approval flow. [Source][past-prompt]
- **K39 — As a kid, I can see whether an approval request is sending, sent, or failed.** A failure displays a reason and Try again; a successful request shows confirmation. Closing the prompt after sending does not withdraw the request. [Source][approval-status]
- **K40 — As a kid, I can see that I already requested approval for a chore on this device.** A waiting badge is remembered by kid, chore, and day in this browser. Another completion request is disabled for that combination. The marker is local, has no expiry/clear flow, and can remain after an approved completion is undone. [Source][approval-memory]
- **K41 — As a kid, I can receive approved stars when my parent acts remotely.** A successful parent approval records the completion for the requested day, including an eligible daily bonus. The chore board’s periodic refresh then reflects the result. There is no explicit rejection or “needs more work” state. [Source][parent-complete]

## Kid: skip for today

- **K42 — As a kid, I can skip my assignment for the rest of today before its deadline.** From chore details, Skip for today opens a confirmation. Confirming hides it for me until the next Pacific date, without awarding the chore’s stars. Untimed chores have no time deadline; skipping on another viewed day is disabled. [Source][skip]
- **K43 — As a kid, I can change my mind before confirming a skip.** Cancel or Close leaves the chore untouched. After confirming, there is no kid-facing unskip control. A parent must change the stored snooze or wait for its return. [Source][skip-dialog]
- **K44 — As a kid, I can skip my part without hiding the chore from my siblings.** The snooze belongs to my assignment. It ends on the stored return date; the chore only reappears then if its other schedule and completion rules also permit it. [Source][skip]
- **K45 — As a kid, I can have a skipped chore count toward finishing my day.** It increases resolved daily progress, can unlock the ten-star daily bonus, and sends the parents a skip notification when Telegram is configured. This is implemented behavior requiring an explicit product decision for the rebuild. [Source][skip]

## Kid: spend stars on rewards

- **K46 — As a kid, I can browse rewards assigned to me alongside my current balance.** The Rewards page shows each kid’s catalog, emoji, title, and price. Archived rewards are omitted. A kid with no listed rewards gets a No rewards yet message. [Source][rewards-page]
- **K47 — As a kid, I can find cheaper rewards first.** My rewards sort by ascending star cost, then alphabetically by title for ties. [Source][reward-sort]
- **K48 — As a kid, I can see which rewards I can afford and how many more stars I need.** Available cards say Redeem or show the exact shortfall. An unaffordable reward can still be opened to inspect its details. [Source][reward-card]
- **K49 — As a kid, I can inspect a reward before spending stars.** Opening it shows the reward, cost, current balance, and Redeem reward action. Closing or clicking the backdrop before redeeming spends nothing. [Source][reward-dialog]
- **K50 — As a kid, I can redeem an available reward when I have enough stars.** Confirmation immediately deducts the current stored price and records redemption. There is no parent-approval step, reservation, or later fulfillment state. The server rechecks assignment, availability, and balance. [Source][redeem]
- **K51 — As a kid, I can celebrate a successful redemption.** The browser plays a random reward sound, runs emoji/confetti, updates my balance, and refreshes. The dialog closes after the attempt, including unsuccessful attempts; a detailed redemption failure message is not provided. [Source][redeem-ui]
- **K52 — As a kid, I can recognize a one-off reward I have already taken.** It remains in my catalog as Taken with a disabled card. Each assigned kid can take that reward once independently. [Source][reward-availability]
- **K53 — As a kid, I can redeem a repeatable reward again while I can afford it.** Perpetual rewards have no daily cap or cooldown. A zero-cost perpetual reward can be redeemed without reducing my balance. [Source][redeem]
- **K54 — As a kid, I can leave Rewards idle and return automatically to Chores.** Two minutes without mouse movement, keys, clicks, touches, or wheel activity navigates back to today’s board, even if a reward dialog was open. [Source][reward-idle]

## Kid: personalize the board and get help

- **K55 — As a kid, I can choose the color of my column.** Tapping my name opens a picker with eight preset colors and a custom color input. This is available directly on the chore board without a parent PIN, including when viewing another date. [Source][color]
- **K56 — As a kid, I can save or cancel my color choice.** Save color writes it to the family record and refreshes; Cancel or Close discards the unsaved choice. The saved color also appears on Rewards and Packing. A failed save has no dedicated explanatory message. [Source][color-save]
- **K57 — As a kid, I can have an open chore’s title read aloud.** Read title generates and plays English speech. Only the first 140 characters are spoken; the control is unavailable while that speech attempt is active. There is no stop, speed, or voice control. [Source][speech]
- **K58 — As a kid, I can hear the title of a completed chore without undoing it.** The speaker button on its completed card plays the title separately from the Undo action. Audio failures are logged but have no visible error explanation. [Source][done-speech]
- **K59 — As a kid, I can use the board in my device’s light or dark appearance.** Shared styles and component variants follow the system preference. There is no chores-specific appearance toggle, and some page backgrounds do not have matching dark variants. [Source][styles]
- **K60 — As a kid, I can wake the darkened chore display by interacting with it.** After one idle minute, a black overlay appears when no kid has open chores today or during 8pm–7am Pacific. Pointer/key/touch activity resets it. Hiding the tab stops the timer; returning restarts it. This is an overlay, not an operating-system sleep command. [Source][screen-saver]
- **K61 — As a kid, I can try reloading a failed board section.** The main board, toolbar, navigation, and screen saver have section error boundaries with a refresh action; Packing also has section boundaries. This does not provide an offline queue or reliably explain failed event-handler requests. The route-level fallback is suspect. [Source][errors]

## Kid: pack for a camping trip

- **K62 — As a kid, I can open a camping packing checklist with my own progress.** Packing uses the same three kids and colors, separate from chore completions and stars. Each kid receives the same fourteen fixed items. [Source][packing]
- **K63 — As a kid, I can see exactly what the packing list asks me to bring.** Pillow; electric heating blanket; Kindle; headphones; six pairs of underwear; six long-sleeved shirts; long pants; six socks; Crocs; sneakers; bike helmet; hat; sweater; jacket. Quantities are text, not individual counters. [Source][packing-items]
- **K64 — As a kid, I can check an item as I pack it and uncheck it if needed.** Each toggle immediately changes its checkmark, crossed-out title, and my packed count. It changes only the selected kid’s item. No chore stars are awarded. [Source][packing-toggle]
- **K65 — As a kid, I can see my packing count and progress bar.** The column shows packed items out of fourteen and a bar; the page also totals packed items across the family, normally out of forty-two. [Source][packing-progress]
- **K66 — As a kid, I can mark my entire packing list packed at once.** All packed checks all fourteen items for the selected kid, without a confirmation step. [Source][packing-bulk]
- **K67 — As a kid, I can clear my packing list and start again.** Clear unchecks that kid’s entire list immediately. There is no separate undo history. [Source][packing-bulk]
- **K68 — As a kid, I can reset everyone’s packing lists for a new trip.** Reset trip clears the whole family checklist immediately. This control is available to everyone on the unlocked page and has no parent gate or confirmation. [Source][packing-reset]
- **K69 — As a kid, I can return to my packing progress in the same browser.** Checks persist in local browser storage across visits. They do not synchronize across devices or update live in other tabs, attach to a named trip, or expire by date. A storage failure may leave the on-screen checklist usable without saving it. [Source][packing-storage]

## Parent: understand the family’s work and balances

- **P01 — As a parent, I can unlock a shared family device for the chores product.** The same family password protects the board, rewards, packing, and bedtime page. This is a shared-device access model, not independent parent and kid accounts. The standalone approval/undo endpoints have different access behavior; see the defect list. [Source][access]
- **P02 — As a parent, I can see each kid’s open chores, completed chores, daily progress, and current stars.** Desktop shows the three kids together; the small-screen chore board provides a selector. Parents use the same read surfaces as kids. [Source][columns]
- **P03 — As a parent, I can inspect previous days and preview future scheduled work.** Date navigation recomputes a board from the current definitions and completion records. It is not an immutable historical report: later edits, assignment changes, removal, and snoozing can change what an old day shows. [Source][board-page]
- **P04 — As a parent, I can distinguish the daily work target from each kid’s spendable balance.** The progress bar is for the viewed day; the balance includes earnings and spending across all dates, including any already-recorded future completion. [Source][balance]
- **P05 — As a parent, I can rename each of the three kid columns.** Names change while the kid’s identity, assignments, and balance remain tied to the same kid record. Empty names are ignored. The current product normalizes to exactly three kids and provides no add/remove-kid action. [Source][kid-management]
- **P06 — As a parent, I can set a kid’s identifying color.** Preset/custom colors can be set on the board; shared actions accept valid three- or six-digit hex colors. This changes the saved family color, not just one device’s preference. [Source][color-save]

## Parent: define and change chores

- **P07 — As a parent, I can create a chore with a title, emoji, and star value.** A nonblank title and at least one valid kid are required. Values are rounded to whole nonnegative stars; zero is permitted. The shared action defaults to one star and a star emoji when omitted. [Source][create-chore]
- **P08 — As a parent, I can assign one chore to one kid or several kids.** Each kid has their own completion and stars. At least one valid kid must remain assigned. A shared chore is not a race for one family-wide reward. [Source][assign-chore]
- **P09 — As a parent, I can create a one-off chore.** It appears from its scheduled day onward and stays open for each assignee until completed. The shared record becomes fully complete only when all assigned kids have a completion. [Source][create-chore]
- **P10 — As a parent, I can schedule or reschedule a one-off chore for a particular date.** The dedicated date action defaults to today when no valid-looking date is supplied. Rescheduling does not erase existing completion records or refund/reaward stars. [Source][one-off-date]
- **P11 — As a parent, I can create a routine that repeats daily.** The shared creation/schedule actions make daily chores eligible every day from their starting date. Each kid can ordinarily earn its stars once per day. [Source][create-chore]
- **P12 — As a parent, I can create a routine for selected weekdays.** Weekly cadence accepts one or more weekday numbers. Every selected weekday is a separate due day; there is no “once in any seven-day window” interpretation or automatic carryover onto other days. Creation without selected days defaults to the server’s current UTC weekday. [Source][schedule-change]
- **P13 — As a parent, I can create a chore that can be earned repeatedly.** A perpetual chore becomes available again after the board’s short cooldown. Leaving it untimed excludes it from the daily bonus target; giving it a time group can include it and also subjects it to that group’s deadline. [Source][availability]
- **P14 — As a parent, I can place a chore in Morning, Afternoon, Evening, Night, or the untimed Bonus group.** This changes where kids find it and, for timed chores, when completion needs approval and skipping stops. There are no custom per-chore clock times. [Source][time-change]
- **P15 — As a parent, I can require my approval whenever a chore is completed.** The approval flag applies even before the deadline. Removing it restores ordinary self-completion only when no date/deadline rule still requires approval. [Source][update-chore]
- **P16 — As a parent, I can edit a chore’s title, emoji, and future star value.** New completions use the updated value; old earned stars remain the amounts recorded originally. Completed cards nonetheless display the latest configured value, which can misrepresent historical earnings. [Source][update-chore]
- **P17 — As a parent, I can change a chore’s type and repeat schedule.** Shared actions can update one-off/repeated/perpetual type and daily/weekly cadence. Existing completion and fully-completed flags are retained; changing type is not a clean reset and can leave stale state. [Source][update-chore]
- **P18 — As a parent, I can change which kids a chore is assigned to.** New assignments affect the visible board and old-day cards immediately. Existing completion records and earned stars remain. A previously fully completed one-off may fail to reopen correctly for a newly added kid. [Source][assign-chore]
- **P19 — As a parent, I can remove a chore from the active catalog.** The action called Archive actually deletes the definition. Earned stars stay, but the associated completed cards disappear and ordinary chore Undo no longer finds the definition. There is no archive browser or restore action in the included product. [Source][archive-chore]

## Parent: pause routines and make exceptions

- **P20 — As a parent, I can pause a repeated chore through a chosen day.** That day is inclusive: a pause through June 21 can reopen June 22, subject to the weekday schedule. The single-chore pause action only applies to repeated chores. [Source][pause]
- **P21 — As a parent, I can resume a paused repeated chore.** Clearing its pause removes that restriction. Other snoozes, dates, and completion rules can still keep it hidden. [Source][pause]
- **P22 — As a parent, I can pause all current chores through a chosen day.** The shared action hides repeated, one-off, and perpetual chores and uses the following day as the snooze return date. It edits the existing chores; it is not a global setting inherited by new chores created later. [Source][pause-all]
- **P23 — As a parent, I can resume all chores affected by the global pause.** This clears global pause/snooze values across the current catalog but leaves kid-specific snoozes in place. It does not restore each chore’s earlier individual pause settings. [Source][pause-all]
- **P24 — As a parent, I can arrange for a chore to disappear until a chosen return date for one kid or everyone assigned.** The data supports per-kid and whole-chore snoozes; current arbitrary-date management requires editing those fields through the replaceable management tooling. These dates are exclusive return dates: the chore may reappear on the date itself. [Source][snoozes]
- **P25 — As a parent, I can excuse a kid’s chore today using the board’s skip flow.** The same confirmation, per-kid effect, deadline restriction, no chore-star award, and daily-bonus eligibility apply. The board does not offer a parent override for a late skip. [Source][skip]

## Parent: approve work and correct credit

- **P26 — As a parent, I can receive a request when a kid needs chore approval.** Telegram names the kid, chore, and target day and supplies an Approve link. There is no parent inbox or queue in the included app itself. [Source][request-approval]
- **P27 — As a parent, I can open an approval link without awarding stars just by opening it.** The GET page shows identifiers, the target date, and an explicit Approve this chore button. Completion happens on form submission; simply opening a message preview or link does not commit it. [Source][approval-link]
- **P28 — As a parent, I can see when an approval link targets a day other than today.** The page labels today/yesterday/tomorrow or a day offset, includes the date, and adds a warning marker for a different day. The pre-submit page shows IDs rather than resolving the chore title and kid name. [Source][approval-link]
- **P29 — As a parent, I can approve the chore and award its stars for the requested day.** Submission bypasses the kid’s approval restriction, records the completion, and may award that day’s bonus. The result names the kid, chore, and award. Past and future dates are supported. [Source][parent-complete]
- **P30 — As a parent, I can see when an approval made no change or could not find the target.** Repeated same-day approvals and fully completed one-offs report Already completed; missing chore/kid combinations report failure. Duplicate prevention is incomplete for shared one-offs and perpetual chores. [Source][approval-link]
- **P31 — As a parent, I can directly record a kid’s completion with parent authority.** A shared parent action supports a specified day and bypasses the normal approval requirement. This is a domain capability for a replacement parent interface, not a distinct control on the kid board. [Source][parent-complete]
- **P32 — As a parent, I can undo a completion from its notification.** The completion message includes an Undo link. Opening it shows a confirmation with the target date; only Undo this completion removes credit. Missing link information and nothing-to-undo cases have explicit results. [Source][undo-link]
- **P33 — As a parent, I can undo a completion directly from the board.** The selected completion’s original stars are removed, and any now-unearned daily bonus can also be removed. The balance can become negative if stars were already spent. No automatic reward refund or cancellation follows. [Source][undo]
- **P34 — As a parent, I can give or take away stars independently of a chore.** A manual adjustment adds a dated positive or negative whole-star entry. Zero has no effect; removals are not capped at the current balance. These entries change the balance but do not appear in the kid’s completed-chore list or earn the daily bonus. [Source][star-adjustment]

## Parent: define rewards

- **P35 — As a parent, I can create a reward with a title, emoji, and star cost.** It requires a nonblank title and at least one valid kid. Costs are rounded to nonnegative whole stars; zero-cost rewards are allowed. The shared action defaults to a gift emoji, cost one, and perpetual availability. [Source][create-reward]
- **P36 — As a parent, I can make a reward available to one kid or several kids.** Each kid spends their own stars and gets their own redemption record. There is no family-wide inventory quantity. [Source][assign-reward]
- **P37 — As a parent, I can choose whether a reward is once per kid or repeatable.** One-off rewards become Taken separately for each kid; perpetual rewards remain redeemable whenever affordable. Neither type has a parent-approval step in the kid flow. [Source][reward-availability]
- **P38 — As a parent, I can change a reward’s title, emoji, price, type, or assignments.** Changes affect future availability and purchases. Existing deductions/redemption costs remain recorded as they were; switching a perpetual reward to one-off makes any kid with a previous redemption ineligible. [Source][update-reward]
- **P39 — As a parent, I can remove a reward from the catalog.** The Archive action deletes the reward and its redemption records, while retaining its negative star entries. This removes redemption history and does not refund anyone. There is no restore or redemption-cancellation action in the shared product actions. [Source][archive-reward]
- **P40 — As a parent, I can redeem a reward for a kid using the same rules as the kid board.** The shared action validates eligibility and balance, records a redemption, and deducts stars immediately. It does not track whether the real-world reward has been delivered. [Source][redeem]

## Parent: recognize last night’s bedtime behavior

- **P41 — As a parent, I can record which kids were ready and in bed before Alexa’s bedtime announcement.** The bedtime page offers a fixed one-star option for being changed, brushed, and peed before that announcement the previous night. This is a manual parental judgment; there is no Alexa integration checking it. [Source][bedtime-templates]
- **P42 — As a parent, I can record which kids had a delightful bedtime through waking up.** A second fixed option is worth two stars. I can choose it independently of the first option and select different kids for each. [Source][bedtime-templates]
- **P43 — As a parent, I can turn the selected bedtime achievements into today’s morning chores.** Submission creates a separate one-off morning chore per selected kid and achievement. It does not award stars immediately; the kid claims them through the ordinary chore flow, with late-morning approval rules still applying. [Source][bedtime-create]
- **P44 — As a parent, I can see which bedtime achievements already have chores for today.** Matching existing chores preselect the corresponding boxes. An ordinary repeat submission skips exact matching kid/title/value/date/morning chores instead of creating duplicates. Unchecking an existing choice does not remove its chore. [Source][bedtime-page]
- **P45 — As a parent, I can see the outcome of a bedtime submission.** While saving, the submit button is disabled. Success reports the number created and already present, grouped by kid and achievement. No selection, unmatched kids, and failed saves produce explanatory messages. [Source][bedtime-form]
- **P46 — As a parent, I can receive a morning reminder to record bedtime stars when the reminder endpoint is scheduled externally.** The handler only sends during 5:00–5:59am Pacific and includes both options plus a bedtime-page link. Telegram must be configured. The repository’s Vercel cron list is empty, so an active daily schedule is not established by this code; repeated calls in the window can send duplicates. [Source][bedtime-reminder]

## Parent: stay informed and use the shared display

- **P47 — As a parent, I can receive Telegram updates when kids complete or undo chores.** Completion messages include the kid, title, earned stars, running balance, and an Undo link when available. Undo messages include the removed amount and resulting balance. The ordinary completion message’s balance is computed before a newly awarded daily bonus; that bonus gets a separate message. [Source][notifications]
- **P48 — As a parent, I can receive separate Telegram updates for skips, daily bonuses, and reward redemptions.** Skips name the chore and return date; bonuses name the award and updated balance; redemption messages name the reward and cost. There are no per-parent or per-event notification preferences in the product. [Source][skip]
- **P49 — As a parent, I can have recorded chores and star changes survive a notification delivery failure.** Ordinary completion, undo, skip, and redemption notifications are best effort. Approval requests instead report sending failure because delivery is their purpose. There is no delivery history or retry queue in the product. [Source][notifications]
- **P50 — As a parent, I can leave the main board on a shared display that refreshes and darkens when idle.** It polls every minute, refreshes at Pacific midnight, and enables the one-minute black-overlay timer when everyone is clear or at night. This behavior is automatic, with no settings UI. [Source][screen-saver]
- **P51 — As a parent, I can see the same saved chores, stars, rewards, and colors on another unlocked device.** These live in shared storage. Packing checkmarks and sent-approval badges are browser-local exceptions. Concurrent edits can overwrite one another in the current persistence design. [Source][storage]

## Parent: help the family pack

- **P52 — As a parent, I can review each kid’s camping packing progress and the family total.** Every kid gets the same fourteen-item template, with individual checks and progress. Packing contributes no stars and does not automatically complete a packing-related chore. [Source][packing]
- **P53 — As a parent, I can help pack by toggling items, marking a kid all packed, or clearing their list.** These controls are shared with kids and take effect immediately on the current browser. There is no parent sign-off or protection against a sibling changing another list. [Source][packing-bulk]
- **P54 — As a parent, I can reset all packing checklists for another trip.** Reset trip clears the current browser’s entire packing state. There is one fixed template and no trip names, saved past trips, custom list editor, or cross-device packing sync. [Source][packing-reset]

## The interaction states to carry into a rebuild

These summarize the stories above; they are not additional features.

| Interaction    | Start                          | Before committing                             | Commit                                     | Afterwards                                               | Cancel/failure                                                                      |
| -------------- | ------------------------------ | --------------------------------------------- | ------------------------------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Ordinary chore | Available card                 | Open details                                  | Complete task records earned stars         | Completed card, balance/progress refresh, possible bonus | Close details discards no work; request failure has limited UI                      |
| Approval chore | Available, approval required   | Past date first warns; otherwise send request | Parent separately submits approval link    | Completion and stars appear on refresh                   | Closing request dialog does not retract Telegram; sending failure can retry         |
| Skip           | Available today before cutoff  | Explicit confirmation                         | Save per-kid return date                   | Hidden, resolved progress, possible bonus                | Cancel before confirm; no kid unskip                                                |
| Undo           | Completed card or notification | Board has no confirm; link has confirm        | Remove completion and possibly bonus       | Chore can reopen, balance falls                          | Closing link before submit changes nothing; stale-ID fallback is unsafe             |
| Reward         | Listed card                    | Review price, balance, eligibility            | Redeem deducts stars and records purchase  | Celebration, Taken or available again                    | Close before submit changes nothing; closing after submit does not cancel it        |
| Color          | Tap kid name                   | Select preset/custom                          | Save color                                 | Shared color updates                                     | Cancel discards selection; closing during an in-flight save does not abort the save |
| Bedtime        | Today’s achievement choices    | Select kids for each achievement              | Create matching one-off chores             | Created/already-present summary                          | Leaving before submit saves nothing; unchecking is not deletion                     |
| Packing        | Checklist                      | No staged draft                               | Each toggle/bulk/reset applies immediately | Local counts and storage update                          | No transaction undo; storage failure has no visible warning                         |

## Boundaries that are not additional implemented features

| Area             | Current boundary                                                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Family model     | Exactly three normalized kids, one shared family board, no family switching or independent role accounts                                                                         |
| Parent decisions | Approve exists; reject, comment, request a redo, delegated approval, and an approval queue do not                                                                                |
| Chore model      | Title and emoji, no description/subtasks/attachments/photos; fixed time groups; no custom deadlines, interval recurrence, alternating assignees, or chore dependencies           |
| History          | Completion entries exist, but no kid-facing transaction ledger, immutable historical board, streaks, reward-spending history, or archived-item recovery in the included surfaces |
| Skips            | A return-date field, not a dated skip-history event; no kid-facing unskip                                                                                                        |
| Rewards          | Immediate star exchange; no fulfillment, reservation, refund/cancel flow, inventory stock, expiration, shopping basket, or approval                                              |
| Packing          | Fixed template; no template editor, trip model, stars, attachments, approval, or cloud sync                                                                                      |
| Reliability      | No offline queue, conflict detection, cross-device pending-request state, or delivery retry system                                                                               |
| Preferences      | No mute, voice choice, reduced-animation setting, timezone setting, deadline editor, screen-saver setting, or notification preference controls                                   |

## Source references

[access]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/components/password-form.tsx:23
[navigation]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/chores-nav.tsx:10
[columns]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:472
[mobile]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:460
[board-page]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/page.tsx:39
[dates]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/utils.ts:60
[past-idle]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:291
[refresh]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/refresh-button.tsx:5
[refresh-timers]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:220
[availability]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/utils.ts:228
[chore-card]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:1533
[freshness]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/page.tsx:56
[groups]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:755
[deadlines]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/utils.ts:14
[auto-groups]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:102
[group-controls]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:1019
[group-idle]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:814
[sorting]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/utils.ts:485
[progress-ui]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:982
[empty-board]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:1012
[chore-details]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:1388
[complete]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:239
[celebration]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:1270
[perpetual]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/utils.ts:252
[daily-bonus]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:154
[bonus-dialog]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:660
[done]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:1099
[undo]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:540
[bonus-revoke]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:191
[balance]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/utils.ts:416
[approval-reason]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:125
[request-approval]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:505
[past-prompt]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:533
[approval-status]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:589
[approval-memory]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:266
[parent-complete]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:478
[skip]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:706
[skip-dialog]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:1486
[rewards-page]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/rewards/page.tsx:25
[reward-sort]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/reward-board.tsx:153
[reward-card]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/reward-board.tsx:205
[reward-dialog]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/reward-board.tsx:277
[redeem]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:1190
[redeem-ui]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/reward-board.tsx:77
[reward-availability]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/utils.ts:508
[reward-idle]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/rewards/inactivity-redirect.tsx:11
[color]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:1157
[color-save]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:902
[speech]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/api/chores/tts/route.ts:9
[done-speech]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/kid-board.tsx:1665
[styles]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/os-global.css:33
[screen-saver]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/screen-saver.tsx:9
[errors]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/error-boundary.tsx:15
[packing]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/packing/page.tsx:25
[packing-items]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/packing-checklist.tsx:17
[packing-toggle]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/packing-checklist.tsx:271
[packing-progress]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/packing-checklist.tsx:187
[packing-bulk]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/packing-checklist.tsx:249
[packing-reset]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/packing-checklist.tsx:133
[packing-storage]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/packing-checklist.tsx:85
[kid-management]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:881
[create-chore]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:392
[assign-chore]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:1008
[one-off-date]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:1042
[schedule-change]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:771
[time-change]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:948
[update-chore]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:795
[archive-chore]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:924
[pause]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:659
[pause-all]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:674
[snoozes]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/data.ts:17

[approval-link]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/approve/[choreId]/route.ts:98
[undo-link]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/undo/[completionId]/route.ts:96
[star-adjustment]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:962
[create-reward]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:1057
[assign-reward]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:1127
[update-reward]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:1148
[archive-reward]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:1102
[bedtime-templates]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/bedtime-approval/constants.ts:1
[bedtime-create]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:1264
[bedtime-page]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/bedtime-approval/page.tsx:64
[bedtime-form]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/bedtime-approval/form.tsx:17
[bedtime-reminder]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/api/cron/bedtime-approval/route.ts:25
[notifications]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/actions.ts:330
[storage]: /Users/mxstbr/projects/mxstbr/mxstbr.com/app/(os)/chores2/data.ts:207

Source reviewed at commit `18910b2799e21b6fa5481d838e99cfea064013cd`; unrelated working-tree changes were present and left untouched. Inventory prepared September 8, 2026 Pacific.
