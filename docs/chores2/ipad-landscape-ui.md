# Main screen: the shared iPad in landscape

**Confirmed target:** Max's old iPad, in landscape. Other device layouts are outside the rebuild scope. Use three permanent columns—Dilan, Darian, Devina—in a stable order. No child picker or separate phone view is needed. The earlier single-child concept demonstrates a component, not the main product screen.

The visual is designed around a 1024px-wide 4:3 iPad and a roughly 680px usable browser height, reserving some of the 768px screen height for browser controls. These are design assumptions, not a claim that the exact iPad model, Safari version, or browser chrome has been inspected. Verify the final implementation on that actual iPad before shipping. No phone or desktop acceptance work is required.

## Layout

- A small shared header names the current period and its cutoff; today's date sits quietly at the right. There is no navigation to other periods.
- Each column has the child's name and a stable color. A small star balance opens that child's Rewards.
- The main area shows exactly one actionable chore from the parent's saved sequence. **Its existing assigned emoji is a large visual reminder**, paired with the full title, including the long school-clothes instruction. Reuse the same emoji in current choices and Done/Waiting; do not substitute randomly chosen artwork.
- The large completion button is always at the same vertical position across columns and successive tasks. Its label changes to “Ask for approval” when necessary.
- The “Finish this {timeframe}” card opens current eligible choices inside that child's column. It does not reorder or skip tasks. No other child's view changes.
- A compact period-bonus panel combines progress with the explicit two-star reward. It distinguishes completed, pending, and earned states. Empty periods show no offer.
- Bonus chores and current Done/Waiting records remain quiet secondary entries at the bottom of each column. The latter offers the allowed undo actions.

Use all three columns simultaneously. Each child owns their own next-action selection, open secondary panel, completion feedback, and bonus state. A child's Rewards, Bonus, or Done view stays within their column while the others keep working. Returning restores the authoritative next actionable chore. All such views are still subordinate to current-window eligibility; a boundary closes stale timed details.

When a child's work is done, that column says “All done for now. Go play.” On-time work awaiting approval instead says “Your part is done,” with the waiting count; the two-star reward is pending. No upcoming routine replaces finished work, and Bonus chores are never automatically assigned. At the next boundary the new current window appears for all children. With zero current tasks, the column says “Nothing to do right now. Go play.” and offers no period payout.

The whole column signals whether that child has something to do, even at a glance while running past. Outstanding chores keep their colorful, raised column, solid chore card, large emoji, and prominent completion button. Finished, empty, and awaiting-parent columns become flat, neutral gray-green, with a large muted check (or clock for pending approval), centered text, and no solid chore card. Their balance, progress stamps, and earned bonus are quiet too; the child's name keeps its identity color. An explicitly selected Bonus chore restores the active treatment. Loading, offline status, or an unconfirmed save must never show the quiet all-clear or “Go play.” Apply the distinction in both light and dark mode without dimming the entire column or making secondary controls unreadable.

## Implementation direction

Max accepted the information architecture as worth trying, including one chore at a time, and asked for a more fun visual treatment. The revised concept uses colorful child columns, rounded lettering, large chore-emoji stickers, tactile completion buttons, and small gold completion stamps toward the explicit +2-star period reward. Feedback is local to the child who finishes: a brief star burst after confirmed completion, with no celebration for pending approval or empty periods. Respect reduced motion. The emoji is the main picture; decoration must not compete with identifying the current chore.

Use the existing Next.js client components with plain CSS, system fonts, and restrained transitions. Avoid dependency-heavy effects or continuous animations on the old iPad. Keep the primary action about 56px high and other touch targets at least 44px. Budget the layout against usable Safari height, not only the physical screen aspect ratio. Long titles, transient messages, and secondary panels must fit without pushing another child's button down.

Chore-title read-aloud is removed: the kids can read their chores. Completion and reward sound effects remain.

After five idle minutes, the display becomes pure black with no moon, text, or visible controls. The page background and browser theme color also turn black while asleep to avoid bright edges; the original theme returns on waking. The full-screen black area remains an accessible “Tap to wake up” button and refreshes before revealing the board. This is a webpage blackout, not control over the iPad's hardware brightness or backlight.

Packing and counts-only daily progress remain available through secondary access; period bonuses replace the old daily bonus, and the main-screen concept concentrates on the current period. Keep them out of the primary next-action area. The visual uses illustrative star balances, task prices, approval configuration, and a sample reward. Task order, weekday exceptions, and which children have empty periods come from the confirmed routine specification.

The conversation preview may reflow if displayed in a narrow conversation pane. That is preview presentation, not an additional device target for the product.

The revised local concept measured 1024 × 672 CSS pixels in its active state. Its routine emojis were checked against the existing board through a read-only MCP lookup. The prototype retains the previously confirmed routine snapshot; it does not synchronize other subsequent board changes or mutate live data. Chromium checks covered the ordered chore titles, weekday filtering, independent child actions, empty/single/multi-task period rewards, pending approval, and undo/re-earning. Light and dark previews were inspected. These checks do not establish compatibility with the physical old iPad, including its installed emoji font; ensure the assigned glyphs render on that device before shipping.
