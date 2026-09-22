# Managing the current chores board

The only chores product is `https://mxstbr.com/chores`. Use `pnpm chores`, authenticated `chores_*` MCP tools and `/api/chores/*`. The legacy board, legacy tools and importer have been removed. The existing `chores:mxstbr:v2` Redis namespace and saved data remain in place; `v2` identifies the storage schema, not another application. Refresh an already-open iPad once after the rename to load the new API paths. Existing site-password and invitation sessions remain valid.

Run commands from `/Users/mxstbr/projects/mxstbr/mxstbr.com`. Prefer the current MCP tools when available: `chores_catalog`, `chores_inspect_day`, `chores_pending_approvals`, and `chores_command`. If a connected tool catalog still shows retired names, refresh that connection or use the CLI:

```sh
pnpm chores help
pnpm chores catalog
pnpm chores day YYYY-MM-DD
pnpm chores approvals
pnpm chores command /private/tmp/chore-command.json UNIQUE_REQUEST_ID
```

Read the catalog to resolve child/chore/reward IDs. Read the applicable Pacific day or approvals to resolve exact occurrence/submission IDs. Commands use the strict schema in `app/lib/chores/commands.ts`. Use a unique, stable request ID for each logical mutation and reuse it after an uncertain result.

## Hide, resume, and schedule

- For a family mute, use `update_chore` with `snoozedUntil`. For one child, use `snoozedForKids`. Both dates are exclusive: September 22 means hidden September 21 and eligible again September 22. Merge the existing `snoozedForKids` map before sending it; a patch replaces that entire map.
- `pausedUntil` is inclusive: September 21 means paused through September 21. Clearing a field with `null` removes that restriction, subject to other scheduling restrictions.
- `pause_all` with `until` sets an exclusive reappear date for the current catalog. Passing `null` clears those global snoozes; separate pauses and child snoozes remain effective.
- Parent-hidden work stops counting toward period requirements immediately, even after opening. Existing submissions and their stars remain unless explicitly undone. Only completing the remaining nonempty period earns the +2 bonus; hiding is never a completion. Empty periods earn no bonus. There is no additional +10 daily bonus.
- Resuming before the window closes restores the requirement and recalculates its bonus. Resuming after the cutoff cannot reinstate expired requirements. An ordinary missed chore that was never muted remains missed.
- Use `archivedFrom` for the first inactive Pacific day and `scheduledFor` for the first active day. Preserve old definitions and history when replacing a routine. Preserve untimed Bonus work unless the request includes it. Use `set_order` for each child/time group to preserve Max's chosen sequence.

## Stars, approval, and verification

- To reverse an incorrect completion, use `undo` with its exact submission ID. This reverses its original stars and recalculates its period bonus. Do not also subtract stars manually for the same completion.
- `review` can approve an accepted on-time submission after its window or date, including when the chore was subsequently hidden. Its original star amount and submission time remain authoritative. Neither parents nor kids can create new late/past completions.
- Use `adjust_stars` with an explicit reason only for an independent manual adjustment. Do not reimport or resynchronize legacy balances, replace the dataset, or write Redis directly for routine management.
- Verify the saved catalog, the effective day, and the reappear day after scheduling changes. The authenticated live board confirms what the kids actually see. A successful command response alone is not sufficient verification.
- Parents manage chores through ChatGPT and tools. Telegram is outbound notification-only; there is no parent UI or Telegram conversation/action-button workflow.
