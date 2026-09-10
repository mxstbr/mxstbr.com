# Proposed kid experience: the next thing to do

Parent management now happens in ChatGPT through MCP. Telegram delivers notifications only; there is no Clippy or Telegram approval/undo interaction. That channel correction is confirmed. The exact routine order from Kids chores and two-star bonuses for nonempty periods are confirmed additions. Other interface choices below remain proposals for discussion, not yet an instruction to implement the application.

The main screen should answer three questions immediately: what can I do now, how do I say it is done, and when can I leave? Give each child one large suggested next-action card. On the shared family display, repeat that component in each child's column, with a persistent name/color. Keep each child's next action visible without entering a separate mode. The confirmed target is the existing old iPad in landscape only. See the [full-screen iPad proposal](ipad-landscape-ui.md); the single-child concept is a component study. Phone, portrait, and desktop layouts are outside scope.

## The active card

Max's latest feedback accepts the information architecture for a trial and specifically asks for a more fun appearance. Every chore already has an assigned emoji: show it prominently as the visual reminder, and preserve that identity across the active card and secondary lists. The shared iPad concept now uses playful colored columns, rounded lettering, chunky buttons, and short completion celebrations. These are prototype design choices to evaluate with the children, not production changes.

Show the current period, a quiet cutoff such as “Until 12:00,” one clear verb-led task title with its recognizable emoji, its stars, and one primary action. Prefer “I did it!” for ordinary completion and “Ask for approval” when that check is required. Keep open-title read-aloud immediately available as a secondary accessible control. Avoid an extra task-detail dialog for ordinary completion. A task-specific checklist can open when needed, including packing.

Use the exact [routine order Max wrote in Kids chores](routine-order.md): common tasks first, then that child’s extras. Save ordered assignment IDs per child/period. The backend returns the first still-actionable eligible occurrence in that sequence. Weekend filtering preserves relative order. Titles, star values, chore types, completion history, and a model do not determine the order. A quiet “Choose another” opens only the other currently eligible chores; selecting one does not skip or mark anything complete. This avoids blocking a child whose suggested task needs unavailable help or equipment. No task from another named time window appears there.

After a confirmed completion, briefly acknowledge the earned stars and advance to the next action. Keep feedback short and honor reduced-motion preferences. Pending submissions advance the child to another actionable task without showing approval stars as earned. Repeated taps must not advance or award credit twice. If the action fails, preserve the task and offer a clear retry; do not celebrate a failed write.

## Separate the child's work from a parent's work

| State                                                   | Main treatment                                                                          |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Current work remains                                    | Suggested next action; small “2 to do” progress                                         |
| Some current submissions await approval                 | Keep actionable work prominent; show waiting count quietly                              |
| Everything submitted, approval outstanding              | “Your part is done.” / “1 waiting for a parent. You can go play.”                       |
| Current requirements completed                          | “All done for now. You can go play.”                                                    |
| No eligible timed work, including after a missed window | “Nothing to do right now.” No completion celebration or claim that missed work was done |
| Window changes                                          | Remove the old timed card and any old chooser/details; show only newly eligible work    |
| Server cannot confirm current eligibility               | Show a brief reconnecting state; keep expired submissions disabled                      |

“Your part is done” refers to submitted current work, not final approval or the daily bonus. Accepted pending requests remain visible to ChatGPT through MCP after their window closes; old timed details still leave the kid screen. A later approval updates balances without reopening those chores.

## Keep secondary capabilities reachable

Keep a quiet Bonus entry available in every state, even with required work remaining. Bonus chores are optional opportunities, never presented as the automatic next obligation after finishing the current routine. Do not gate them on completing timed work.

Show a compact count of current-window work, distinguishing completed and pending. The main progress display concerns the current window and prominently promises **+2 stars for completing every task in that nonempty period**. Use “Finish this morning · +2 stars,” “Bonus waiting for approval · +2 stars,” and “Morning bonus earned! · +2 stars.” Hide the offer for zero-task periods. The ten-star daily bonus additionally retains whole-day accounting. Make the daily target/status available in secondary progress details without showing the titles of hidden windows. Do not imply the daily bonus was earned because the current list became empty.

Keep the spendable star balance and Rewards available with lower visual emphasis than the next chore. Do not put a reward catalog, daily history, leaderboard, or future schedule next to the primary action. “Done & waiting” opens current-window/current-day-untimed records with the permitted undo controls. A title sound is available for open work only. The screenshot-sized interactive concept intentionally concentrates on the next-action card; it does not implement every retained secondary capability.

Use stable large touch targets, plain labels, readable text, and more than color to distinguish states. Show a quiet clock boundary rather than a constantly ticking urgency display. W3C's [clear-purpose guidance](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o1p01-clear-purpose/) is relevant supporting accessibility guidance; the particular next-action arrangement is a design proposal for this family.

## Evaluation

The prototype’s default is Devina’s two morning chores in the specified order; Afternoon and Night preview Dilan’s corresponding routines. Complete both to earn the two-star period bonus. Use the “Needs approval” preview state to see the last submission keep the bonus pending. Task-star amounts and approval configuration in this concept are illustrative; the order comes from the real routine. The approval scenario finishes with an honest pending state and no automatic Bonus assignment. The default scenario visibly awards the period bonus. Undoing a required task reverses both its task credit and the period reward; completing it again restores the same net total. Also try choosing another current chore, undoing a displayed completion, and opening Bonus before completing the routine. The host design controls expose afternoon, between-window, fully completed, and pending-only states; those preview controls are not part of the kid product.

Before shipping, observe whether each child can identify the next action without explanation, complete it without navigating a menu, understand the difference between done and waiting, and recognize that they can leave when their current work is finished. Those observations should guide the final ordering and amount of secondary context.

The local concept was checked for two-star awards on single-task and multi-task periods, zero-task exclusion, pending approval, undo/re-completion, untimed Bonus independence, and seven display states at 736px and 360px in light/dark. These checks concern the prototype, not the unimplemented production backend.
