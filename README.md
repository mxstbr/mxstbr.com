# mxstbr.com

This is the source for my personal website and blog [mxstbr.com](https://mxstbr.com).

## Tech Stack

- [Next.js](https://nextjs.org) v15
- [TailwindCSS](https://tailwindcss.com)
- [TypeScript](https://typescript.org)
- [MDX](https://mdxjs.com)

## Development

```bash
pnpm install
```

```bash
pnpm dev
```

### Env vars

```
# Used to get the repositories of my OSS projects. Get from github.com
GITHUB_ACCESS_TOKEN=
# Used to store view counts of essays & notes. Get from upstash.com
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN==
# Used to store the notes content. Get from Hashnode.com
HASHNODE_ACCESS_TOKEN=
# Optional: Used to send emails to Max from the feedback form. Get from resend.com
RESEND_API_KEY=
# Optional: Used on the /cal page for auth. Pick any random string.
CAL_PASSWORD=
# Used to authenticate Pebble Index recording webhooks. If unset, the endpoint
# derives a stable webhook token from UPSTASH_REDIS_REST_TOKEN.
PEBBLE_INDEX_WEBHOOK_TOKEN=
# Optional: Max accepted Pebble Index recording payload size in bytes. Defaults to 4000000.
PEBBLE_INDEX_MAX_BYTES=
# Optional: Override the MacWhisper CLI used by `pnpm process-index-recordings --transcribe`.
MACWHISPER_CLI_PATH=/usr/local/bin/mw
# Optional: Local transcription timeout in milliseconds. Defaults to 300000.
PEBBLE_INDEX_TRANSCRIPTION_TIMEOUT_MS=
# Used by `pnpm reflect-append-daily-note` for Pebble note-to-self captures.
REFLECT_ACCESS_TOKEN=
REFLECT_GRAPH_ID=mxstbr
# Optional: Reflect list name used inside the daily note. Defaults to "Pebble Index".
REFLECT_DAILY_NOTE_LIST_NAME="Pebble Index"
```

Append a Pebble-marked note to today's Reflect daily note:

```bash
pnpm reflect-append-daily-note --recording-id idx_example --content "Remember to follow up on the contract."
```

## License

Licensed under the MIT License. Feel free to use parts of the code in your own projects with attribution!
