# mxstbr.com

This is the source for my personal website and blog [mxstbr.com](https://mxstbr.com).

## Tech Stack

- [Next.js](https://nextjs.org) v15
- [TailwindCSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org/)
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
```

## License

Licensed under the MIT License. Feel free to use parts of the code in your own projects with attribution!
