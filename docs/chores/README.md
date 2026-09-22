# Chores behavior reference

Start with [inventory.md](inventory.md): the current kid/parent capabilities and explicit **Not current behavior** rules. It covers all 123 original IDs and K70/P55, including later decisions about hidden requirements, +2 bonuses, the period-card picker, rewards, refresh, no speech, quiet all-clear states, overnight blackout, and concise Telegram logs.

- [rebuild-features.json](rebuild-features.json) is the structured source. Every record has `isCurrentBehavior`; removed records also have an explicit negative statement. `notCurrentBehaviors` records rejected parts of otherwise retained capabilities.
- [rebuild-features.md](rebuild-features.md) is the disposition index; [coverage.md](coverage.md) maps the same records to source and verification evidence.
- [rebuild-scope.md](rebuild-scope.md), [kid-focus-ui.md](kid-focus-ui.md), and [ipad-landscape-ui.md](ipad-landscape-ui.md) describe current rules and presentation.
- [managing.md](managing.md) explains current agent operations. `/chores` uses `pnpm chores`, `chores_*` MCP tools, and `/api/chores/*`. The legacy implementation has been deleted.
- [legacy-inventory.md](legacy-inventory.md) is an annotated historical audit. [routine-order.md](routine-order.md) preserves the initial routine seed; later live catalog edits take precedence. [implementation.md](implementation.md) preserves dated delivery history.

For future changes, update the JSON and applicable scope/UI notes, then run:

```sh
node scripts/render-chores-behaviors.mjs
pnpm exec prettier --write docs/chores scripts/render-chores-behaviors.mjs
```

The renderer validates IDs, exclusions, and current implementation paths before regenerating the inventory, disposition index, and coverage. Do not change removed behaviors back to positive capabilities without a new explicit user decision. Lower priority is not the same as removed. Never use a historical source/prototype as evidence that a rejected behavior should return.
