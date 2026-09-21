# Managing the current chores board

The current product at `https://mxstbr.com/chores` uses `pnpm chores2`, authenticated `chores2_*` MCP tools, `/api/chores2/*`, and the independent `chores:mxstbr:v2` Redis keys. These names were retained when the new board replaced the old one. `pnpm chores` and unprefixed MCP chore tools manage only the legacy board at `/chores2`. Never use them for current requests.

Run commands from `/Users/mxstbr/projects/mxstbr/mxstbr.com`. Prefer the current MCP tools when available: `chores2_catalog`, `chores2_inspect_day`, `chores2_pending_approvals`, and `chores2_command`. If the connected Kids chores tools expose only legacy names, use the CLI:

```sh
pnpm chores2 help
pnpm chores2 catalog
pnpm chores2 day YYYY-MM-DD
pnpm chores2 approvals
pnpm chores2 command /private/tmp/chore-command.json UNIQUE_REQUEST_ID
```

Read the catalog to resolve child/chore/reward IDs. Read the applicable Pacific day or approvals to resolve exact occurrence/submission IDs. Commands use the strict schema in `app/lib/chores2/commands.ts`. Use a unique, stable request ID for each logical mutation and reuse it after an uncertain result.

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
