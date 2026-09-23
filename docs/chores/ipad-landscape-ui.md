# Main screen: the shared iPad in landscape

**Current implemented target:** Max's old iPad, in landscape. Other device layouts are outside the rebuild scope. Use three permanent columns—Dilan, Darian, Devina—in a stable order. No child picker or separate phone view is needed. The earlier single-child concept demonstrates a component, not the main product screen.

The visual is designed around a 1024px-wide 4:3 iPad and a roughly 680px usable browser height, reserving some of the 768px screen height for browser controls. The user reported iPadOS 17.7.10; the exact hardware model and browser chrome are not inferred. Automated checks use this viewport; they are not a claim of a new physical-device inspection. No phone or desktop layout is required.

## Layout

- A small shared header names the current period and its cutoff; today's date sits quietly at the right. At 6am, Morning opens and shows “Until 7:30 AM,” then switches to “Before lunch” with “Until 12:00 PM.” The remaining cutoffs are 5pm, 8:15pm and 10pm, all Pacific. There is no navigation to other periods.
- A visible Chores / Rewards switch opens each child's reward catalog in their own column. Children can see their balance, compare costs, and confirm a redemption; unaffordable rewards show the remaining stars needed. After 90 seconds without interaction, the board returns to Chores. The Refresh button performs a full browser reload, including loading new app code.
- Each column has the child's name and a stable color. A small star balance opens that child's Rewards.
- The main area shows exactly one actionable chore from the parent's saved sequence. **Its existing assigned emoji is a large visual reminder**, paired with the full title, including the long school-clothes instruction. Reuse the same emoji in current choices and Done/Waiting; do not substitute randomly chosen artwork.
- The large completion button is always at the same vertical position across columns and successive tasks. Its label changes to “Ask for approval” when necessary.
- The “Finish this {timeframe}” card opens current eligible choices inside that child's column. It does not reorder or skip tasks. No other child's view changes.
- A compact period-bonus panel combines progress with the explicit two-star reward. It distinguishes completed, pending, and earned states. Empty periods show no offer.
- Bonus chores and current Done/Waiting records remain quiet secondary entries at the bottom of each column. The latter offers the allowed undo actions.

Use all three columns simultaneously. Each child owns their own next-action selection, open secondary panel, completion feedback, and bonus state. A child's Rewards, Bonus, or Done view stays within their column while the others keep working. Returning restores the authoritative next actionable chore. All such views are still subordinate to current-window eligibility; a boundary closes stale timed details.

When a child's work is done, that column says “All done for now. Go play.” On-time work awaiting approval instead says “Your part is done,” with the waiting count; the two-star reward is pending. No upcoming routine replaces finished work, and Bonus chores are never automatically assigned. At the next boundary the new current window appears for all children. With zero current tasks, the column says “Nothing to do right now. Go play.” and offers no period payout.

The whole column signals whether that child has something to do, even at a glance while running past. Outstanding chores keep their colorful, raised column, solid chore card, large emoji, and prominent completion button. Finished, empty, and awaiting-parent columns become flat, neutral gray-green, with a large muted check (or clock for pending approval), centered text, and no solid chore card. Their balance, progress stamps, and earned bonus are quiet too; the child's name keeps its identity color. An explicitly selected Bonus chore restores the active treatment. Loading, offline status, or an unconfirmed save must never show the quiet all-clear or “Go play.” Apply the distinction in both light and dark mode without dimming the entire column or making secondary controls unreadable.

Weekly chores appear only on selected weekdays. A saved weekly chore without weekdays does not appear as daily work or count toward current requirements; correct its schedule through the parent tools. Daily chores keep their existing weekday filtering.

## Implemented visual behavior

Max accepted the information architecture as worth trying, including one chore at a time, and asked for a more fun visual treatment. The current interface uses colorful child columns, rounded lettering, large chore-emoji stickers, tactile completion buttons, and small gold completion stamps toward the explicit +2-star period reward. Feedback is local to the child who finishes: a brief star burst after confirmed completion, with no celebration for pending approval or empty periods. Respect reduced motion. The emoji is the main picture; decoration must not compete with identifying the current chore.

Use the existing Next.js client components with plain CSS, system fonts, and restrained transitions. Avoid dependency-heavy effects or continuous animations on the old iPad. Keep the primary action about 56px high and other touch targets at least 44px. Budget the layout against usable Safari height, not only the physical screen aspect ratio. Long titles, transient messages, and secondary panels must fit without pushing another child's button down.

Chore-title read-aloud is removed: the kids can read their chores. Completion and reward sound effects remain.

Parent MCP Events clients can receive the same completion/approval/bonus/redemption updates as Telegram in the background. The kid board keeps its existing save and approval feedback; the notification-retrying indicator refers to Telegram delivery, while MCP clients register verified HTTPS webhooks and inspect refresh responses for delivery health. There is no subscription control on the shared iPad, and its kid cookies do not grant parent event access.

After five idle minutes, the display can become pure black only from 8:30pm inclusive until 6am exclusive in America/Los_Angeles, with no visible moon or text. At 8:30pm an already-idle display can black out; at 6am it clears automatically. Daylight saving time and focus/visibility return are handled explicitly. Daytime blackout is **not current behavior**. The page background and browser theme color also turn black while asleep to avoid bright edges; the original theme returns on waking. The full-screen black area remains an accessible “Tap to wake up” button and refreshes before revealing the board. This is a webpage blackout, not control over the iPad's hardware brightness or backlight.

Packing and counts-only daily progress remain available through secondary access. Progress stamps stay inside the period card; a second duplicate count line and the old +10 daily reward are **not current behavior**. Parent-hidden work is excluded from the requirement even after the window opens. Ordinary expired unmuted work remains missed.

The [current inventory](inventory.md), [scope](rebuild-scope.md), and [coverage](coverage.md) describe shipped behavior and verification. The earlier narrow conversation mockups and their illustrative balances/routine snapshot are historical studies, not separate supported device layouts or a live catalog. Current chore definitions and saved order come from the running system; [routine-order.md](routine-order.md) records the initial seed and continuing ordering rules.

## Recovery after sleep and deployments

Visible boards poll every 15 seconds. Focus, visibility return, online and pageshow immediately replace any suspended read; a read times out after 10 seconds so it cannot hold the board indefinitely. A new deployment identity or a missing/non-JSON/malformed API response reloads the document automatically, at most once per five minutes per tab. Ordinary network failures show a friendly reconnecting message and continue retrying. A busy or uncertain save blocks automatic reload until resolved, preserving its exact request ID for Retry saving. Checking/offline states never show an all-clear. Manual Refresh still reloads the whole document.
