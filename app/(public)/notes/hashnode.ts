import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()
const HASHNODE_GRAPHQL_ENDPOINT = 'https://gql-beta.hashnode.com'

const GET_POSTS_QUERY = /* GraphQL */ `
  {
    publication(host: "mxstbr.com/notes") {
      id
      posts(first: 50) {
        edges {
          node {
            id
            cuid
            slug
            title
            coverImage {
              url
            }
            content {
              markdown
            }
            readTimeInMinutes
            publishedAt
            updatedAt
            seo {
              title
              description
            }
            tags {
              id
              name
              slug
            }
          }
        }
      }
    }
  }
`

// Other ideas:
// 'prototype' | 'beta' | 'production'
// 'draft' | 'developing' | 'finished'
// 'braindump' | 'exploring' | 'finished'
// 'seedling' | 'budding' | 'evergreen'
type Status =
  | 'seedling'
  | 'budding'
  | 'evergreen'
  // This is odd to have as "status" but 🤷‍♂️
  | 'link'

type Frontmatter = {
  cuid: string
  title: string
  summary: string
  slug: string
  publishedAt: string
  readTimeInMinutes: number
  status: Status
  updatedAt?: string
  tags?: Array<{
    name: string
    slug: string
  }>
  previousSlugs: Array<string>
  views: number
}

export type Note = {
  frontmatter: Frontmatter
  content: string
}

export async function getNotes(): Promise<Array<Note>> {
  const response = await fetch(HASHNODE_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: GET_POSTS_QUERY,
    }),
  })

  const body = await response.text()
  let json

  try {
    json = JSON.parse(body)
  } catch {
    throw new Error(
      `Hashnode API returned a non-JSON response with ${response.status} ${response.statusText}`,
    )
  }

  const errors = json.errors?.map((error) => error.message).join(', ')

  if (!response.ok || errors) {
    throw new Error(
      `Hashnode API request failed with ${response.status} ${response.statusText}${errors ? `: ${errors}` : ''}`,
    )
  }

  if (!json.data?.publication?.posts?.edges) {
    throw new Error('Hashnode API response did not include publication posts')
  }

  return await Promise.all(
    json.data.publication.posts.edges.map(
      async ({ node: post }): Promise<Note> => {
        const views =
          (await redis.get<number>(
            ['pageviews', `/notes/${post.slug}`].join(':'),
          )) ?? 0

        const { status, content } = parseStatusFromContent(
          post.content.markdown,
        )

        return {
          frontmatter: {
            cuid: post.cuid,
            title: post.title,
            summary: post.seo.description,
            slug: post.slug,
            publishedAt: post.publishedAt,
            readTimeInMinutes: post.readTimeInMinutes,
            updatedAt: post.updatedAt,
            status: status,
            tags: post.tags.map((tag) => ({
              slug: tag.slug,
              // Hashnode has inconsistent tag name capitalization, so I manually capitalize each word
              name: tag.name
                .trim()
                .split(' ')
                .map((word) => word[0].toUpperCase() + word.substring(1))
                .join(' '),
            })),
            // Hashnode's beta API no longer exposes previous slug history.
            previousSlugs: [],
            views,
          },
          content: content
            // Hashnode serves images with an odd non-standard markdown syntax that looks like this:
            // ![alt](url.com align="center")
            // This is a temporary hack to remove that non-standard syntax and make it render until I
            // figure out a long-term solution for it. Right now, it'd break if I use different alignment.
            .replaceAll('align="center")', ')'),
        }
      },
    ),
  ).then((res) => res.sort((a, b) => b.frontmatter.views - a.frontmatter.views))
}

export async function getNote(
  slug: string,
): Promise<{ content: string; frontmatter: Frontmatter } | null> {
  const notes = await getNotes()

  return notes.find((note) => note.frontmatter.slug === slug) || null
}

const STATUS_REGEX = /^status-(\w+)$/m

const OLD_STATUSES = {
  sketch: 'seedling',
  prototype: 'budding',
  production: 'evergreen',
}

export const EMOJI_FOR_STATUS: Record<Status, string> = {
  seedling: '🌱',
  budding: '🌿',
  evergreen: '🌲',
  link: '🔗',
}

function parseStatusFromContent(markdown: string): {
  content: string
  status: Status
} {
  let status
  const result = markdown.match(STATUS_REGEX)
  if (result) status = result[1]
  if (status) status = OLD_STATUSES[status] || status
  return {
    content: markdown.replace(STATUS_REGEX, ''),
    status: status || 'seedling',
  }
}
