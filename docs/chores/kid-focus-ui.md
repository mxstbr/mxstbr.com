# Current kid interaction: one chore at a time

This describes the implemented `/chores` interface as of September 21, 2026. Earlier mockups are historical design studies, not additional product requirements. The [current inventory](inventory.md) governs behavior and records every explicit exclusion.

## The next action

Each child has a permanent landscape-iPad column. Their assigned chore emoji is the main visual reminder, next to the full title and star amount. One actionable current chore is selected from the saved parent order. I did it! completes it directly; Ask for approval sends an on-time request when approval is required. Pending requests advance the next-action queue without pretending that stars or the period bonus are already earned.

A confirmed completion gives brief local star/sound feedback, then returns to the next eligible action. A failed write keeps its exact request for retry and does not celebrate. Another child’s selection, feedback, and secondary panel remain independent.

Tapping Finish this {timeframe} opens only the current chore picker. A temporary choice neither skips nor reorders anything. My progress is inside the picker, with a direct fallback when no period card is shown. **Not current behavior:** a dedicated Choose another button, another period’s chore list, an ordinary task-detail/skip dialog, or Hear it/read-aloud.

## Clear visual states

| Current state                                           | Main treatment                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Actionable work remains                                 | Colorful raised column, solid card, prominent emoji and completion button                              |
| All current requirements approved                       | Subdued column: All done for now. Go play.                                                             |
| All remaining work submitted, some awaiting approval    | Subdued column: Your part is done; waiting count and a clock; the pending bonus is not shown as earned |
| No eligible timed work                                  | Subdued column: Nothing to do right now. Go play.; no invented completion or upcoming routine          |
| Loading, offline, saving, or an unresolved failed write | Checking/error state; no false all-clear or Go play                                                    |
| Next period begins                                      | Previous timed card/selection closes; only the new period becomes actionable                           |

A muted parent-hidden chore no longer counts as required. An unmuted expired chore remains missed in history even though it no longer appears on the current screen. **Not current behavior:** using the same active-card styling for finished and empty columns, or interpreting a hidden/expired card as a completed chore.

## Secondary capabilities

- The period card combines progress stamps and +2 stars for a nonempty completed period, with waiting/earned states. There is no duplicate 0 of N done line underneath, +10 full-day reward, or empty-period payout.
- Bonus chores is always an explicit secondary choice. Bonus work is not automatically assigned after the routine and never adds a period target.
- The shared Chores/Rewards tabs open each child’s catalog; a child’s balance opens only their own rewards. Detail/confirmation checks price, affordability, and one-off entitlement before spending stars.
- Done & waiting contains only current-window/current-day untimed records and permitted exact undo actions. Older pending requests still exist for parent tool review without reopening their cards.
- Packing uses shared per-child state. My progress browses daily counts and ledger activity without exposing past/future chore titles or completion actions.
- Secondary panels return after 90 idle seconds; Refresh reloads the whole browser document. Short action effects remain; chore-title speech does not.

The overnight idle blackout is pure black only between 8:30pm and 6am San Francisco time, after five minutes without activity. It clears at 6am and still wakes on tap. **Not current behavior:** a daytime blackout, a visible moon/text, or hardware brightness control. See [the current landscape layout](ipad-landscape-ui.md) and [scope](rebuild-scope.md) for exact boundaries and access rules.
