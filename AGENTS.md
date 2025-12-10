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
```

Run commands from the repo root. Prefer `pnpm dev` for iterative changes; use `pnpm build` before shipping to ensure MDX and dynamic routes compile.

## Coding Style & Naming Conventions

- TypeScript + React functional components; prefer server components unless client hooks/events require `"use client"`.
- Prettier governs formatting (2-space indent, semicolons off); keep Tailwind classes readable and grouped by role (layout → spacing → color → state).
- Components and hooks use `PascalCase` and `useCamelCase`; route segments and files are kebab-case to mirror URLs.

## Testing Guidelines

- No formal automated test suite yet; verify key flows manually (`pnpm dev`), especially new routes, forms, and RSS/sitemap generation.
- For data-related changes, confirm `pnpm build` succeeds and inspect generated output where relevant (e.g., Open Graph images in `app/og`).
- If adding tests, colocate them near the feature and align names with the route or component (e.g., `component-name.test.tsx`).

## Commit & Pull Request Guidelines

- Follow the existing concise, imperative commit style (`Add feature`, `Fix bug`); keep scope small.
- PRs should describe intent, major UX changes, and risks; link issues when applicable and add screenshots for visual tweaks.
- Ensure builds pass locally and note any manual verification steps performed.

## Security & Configuration Tips

- Required env vars are documented in README (`GITHUB_ACCESS_TOKEN`, `UPSTASH_REDIS_REST_URL`, etc.); use a local `.env` and avoid committing secrets.
- When handling workflows that call external services (Upstash, Resend, Twilio), gate new code paths behind environment checks and fail gracefully in development.

## MCP servers

If the context7 MCP server is present, always use it when I need setup or configuration steps, or
library/API documentation. This means you should automatically use the Context7 MCP
tools to resolve library id and get library docs without me having to explicitly ask.
