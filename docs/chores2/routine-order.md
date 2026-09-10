# Authoritative routine order for the rebuild

Source: Max's September 8, 2026 instruction in **Kids chores**, task `019eec7d-5fa6-7d42-b242-520e62e89ef1`, message timestamp `2026-09-09T04:18:27.189Z` (9:18pm Pacific), followed by the instruction in this task that the written order is the desired order. The routine replacement begins September 9 Pacific. This document records rebuild requirements; it does not mutate the running board.

Preserve the common tasks in their written sequence, then append that child's listed extras in their written sequence. School-only tasks are filtered out on weekends without reordering the survivors. Each child's period has an explicit ordered list of assignment IDs; titles below are for matching those assignments during migration. Completion/approval pending state removes a task from the suggested next-action queue without changing its stored position. Do not sort by stars, title, type, creation timestamp, or a model-generated priority. “Choose another” is a temporary selection, not a reorder or skip.

## Dilan

**Morning**

1. Make your bed
2. Change into your school clothes including socks — weekdays only
3. Brush your teeth and your tongue
4. Do your inhaler
5. Put lotion on your face

**Afternoon — weekdays only**

1. Bring your lunch bag to the kitchen
2. Put your backpack in the white bin
3. Finish your homework for the day

**Evening**

1. Change into your pyjama
2. Brush your teeth and your tongue
3. Do your inhaler

**Night**

1. Put lotion on your whole body

## Darian

**Morning**

1. Make your bed
2. Change into your school clothes including socks — weekdays only
3. Brush your teeth and your tongue
4. Take your meds

**Afternoon — weekdays only**

1. Bring your lunch bag to the kitchen
2. Put your backpack in the white bin
3. Finish your homework for the day

**Evening**

1. Change into your pyjama
2. Brush your teeth and your tongue

**Night:** no required tasks specified.

## Devina

**Morning**

1. Make your bed
2. Brush your teeth and your tongue

**Afternoon:** no required tasks, including homework, as instructed for homeschooling.

**Evening**

1. Change into your pyjama
2. Brush your teeth and your tongue

**Night:** no required tasks specified.

The source instruction also moves the Evening cutoff to **8:15pm Pacific**. In the rebuild's non-overlapping windows, Night starts then. Morning's explicit opening time is still a design/configuration detail. Untimed Bonus chores retain their existing definitions and do not enter these period targets.

## Two-star period completion bonus

Each child earns **2 additional stars** when every distinct task occurrence in a nonempty named period is completed. One required task is sufficient to make a period eligible; zero is not. Timed repeatable chores require one valid completed submission toward that period's target, not endless repetitions. Untimed Bonus chores neither enlarge the target nor generate an extra “Bonus period.”

Pending approvals do not count as completed yet. On-time submissions approved later can settle the original period's bonus, even after the day ends. Missed/expired tasks remain unfulfilled; hiding a card, deleting a definition, pausing it, or removing it from the next-action queue must not manufacture completion or a bonus. Prospective scheduling changes affect only the appropriate future obligations.

Award once per child/Pacific day/period. Commit it with the triggering completion or approval, use a stable award identity, and reverse the bonus if an undo makes that period incomplete. A legitimate re-completion can restore it, but cannot create multiple net awards. This is additive to the existing ten-star daily bonus, consistent with the request to add a requirement.

| Schedule                 | Dilan                              | Darian                      | Devina           |
| ------------------------ | ---------------------------------- | --------------------------- | ---------------- |
| Weekday nonempty periods | Morning, Afternoon, Evening, Night | Morning, Afternoon, Evening | Morning, Evening |
| Weekend nonempty periods | Morning, Evening, Night            | Morning, Evening            | Morning, Evening |

## Added capability

- **K70 — As a kid, I can earn two extra stars by completing every task in a nonempty time period and see my progress toward that bonus.** The UI distinguishes available, awaiting approval, and earned states; empty periods show no bonus offer.
- **P55 — As a parent, I can set the order of each child's chores within a time period through ChatGPT and MCP.** The initial order follows the September 8 list above and remains stable across refreshes and weekday filtering.
