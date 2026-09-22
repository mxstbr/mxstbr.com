# Repository Guidelines

## Project Structure & Module Organization

- Next.js App Router lives in `app/`; route groups like `app/thoughts`, `app/notes`, `app/oss`, and `app/stats` map to site sections, with API handlers in `app/api`.
- Shared UI and utilities sit in `app/components` and `app/lib`; global styles are in `app/global.css` with Tailwind configured via `tailwind.config.js` and `postcss.config.js`.
- Static assets (icons, social images, favicons) belong in `public/`; MDX-to-React mappings live in `mdx-components.tsx`.

## Build, Test, and Development Commands

```bash
pnpm install           # install dependencies
pnpm dev               # run Next.js in dev mode with hot reload
pnpm build             # production build and sync essays to GitHub
pnpm start             # serve the production build locally
pnpm update-essay-views# refresh Upstash-backed essay view counts
pnpm chores help       # manage the current kids chores/rewards
pnpm test:chores       # run deterministic chores checks
```

Run commands from the repo root. Prefer `pnpm dev` for iterative changes; use `pnpm build` before shipping to ensure MDX and dynamic routes compile.

## Kids Chores

- **One chores system:** `/chores` uses `pnpm chores`, authenticated `chores_*` MCP tools, and `/api/chores/*`. The legacy implementation and tools are deleted. If a connector lists retired tools, refresh it or use the CLI. Keep the existing `chores:mxstbr:v2` storage keys and saved data; the suffix is a schema version, not another product.
- **Read before changing:** `pnpm chores catalog`, `day YYYY-MM-DD`, and `approvals` resolve exact IDs. Apply JSON with `pnpm chores command /private/tmp/command.json REQUEST_ID`; see `app/lib/chores/commands.ts` for the schema. Reuse the same request ID after an uncertain response. Telegram is notification-only; look up completion IDs in the day record.
- **Mute/resume:** `update_chore` fields `snoozedUntil`/`snoozedForKids[kidId]` and `pause_all.until` are exclusive reappear dates; `pausedUntil` is inclusive. To hide September 21 and return September 22, use `2026-09-22`. Clear with `null`; merge existing per-child snoozes before replacing that map. Hidden chores are not required, even after opening. Only nonempty completed periods earn +2; there is no +10 daily bonus.
- **Stars/history:** use `undo` with the exact submission ID to reverse an incorrect completion, never an additional manual deduction for the same event. `review` can approve an on-time submission later; new late completions are forbidden. Keep history and balances; do not reimport, resync legacy balances, or write Redis directly.
- **Routines:** `archivedFrom` is the first inactive Pacific day; `scheduledFor` is the first active day. Preserve old records and untimed Bonus chores when replacing routines. Use `schedule.daysOfWeek: [1,2,3,4,5]` for weekdays and `set_order` for each child's time group.
- **Verify:** inspect the affected day and reappear day; for routine replacements also check the prior day and weekend. Confirm the live board when relevant. More details: [Managing chores](docs/chores/managing.md).

- **Keep behaviors current:** whenever chores behavior changes, update [the behavior inventory](docs/chores/inventory.md) in the same commit. Edit `docs/chores/rebuild-features.json`, run `node scripts/render-chores-behaviors.mjs`, and update the affected scope, UI and management docs. Preserve stable IDs and explicitly mark rejected/removed behavior as **Not current behavior**; do not silently restore it.

## Coding Style & Naming Conventions

- TypeScript + React functional components; prefer server components unless client hooks/events require `"use client"`.
- Prettier governs formatting (2-space indent, semicolons off); keep Tailwind classes readable and grouped by role (layout → spacing → color → state).
- Components and hooks use `PascalCase` and `useCamelCase`; route segments and files are kebab-case to mirror URLs.

## Testing Guidelines

- Chores has domain, Redis concurrency, MCP and iPad browser checks; see [verification commands](docs/chores/implementation.md). Use `pnpm test:chores` for deterministic checks. Verify other site flows as appropriate, especially routes, forms and RSS/sitemap generation.
- For data-related changes, confirm `pnpm build` succeeds and inspect generated output where relevant (e.g., Open Graph images in `app/og`).
- If adding tests, colocate them near the feature and align names with the route or component (e.g., `component-name.test.tsx`).

## Commit & Pull Request Guidelines

- Follow the existing concise, imperative commit style (`Add feature`, `Fix bug`); keep scope small.
- PRs should describe intent, major UX changes, and risks; link issues when applicable and add screenshots for visual tweaks.
- Ensure builds pass locally and note any manual verification steps performed.
- Husky runs Prettier on pre-commit; keep changes formatted or run `pnpm format` before committing.

## Security & Configuration Tips

- Required env vars are documented in README (`GITHUB_ACCESS_TOKEN`, `UPSTASH_REDIS_REST_URL`, etc.); use a local `.env` and avoid committing secrets.
- When handling workflows that call external services (Upstash, Resend, Twilio), gate new code paths behind environment checks and fail gracefully in development.

## MCP servers

If the context7 MCP server is present, always use it when I need setup or configuration steps, or
library/API documentation. This means you should automatically use the Context7 MCP
tools to resolve library id and get library docs without me having to explicitly ask.
