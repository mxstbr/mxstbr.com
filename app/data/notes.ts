import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

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
            previousSlugs
          }
        }
      }
    }
  }
`

type Status = 'sketch' | 'prototype' | 'production'

type Frontmatter = {
  cuid: string
  title: string
  summary: string
  slug: string
  publishedAt: string
  readTimeInMinutes: number
  // Other ideas:
  // 'prototype' | 'beta' | 'production'
  // 'draft' | 'developing' | 'finished'
  // 'braindump' | 'exploring' | 'finished'
  status?: Status
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
  const { data } = await fetch(`https://gql.hashnode.com`, {
    method: 'POST',
    headers: {
      Authorization: process.env.HASHNODE_ACCESS_TOKEN as string,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: GET_POSTS_QUERY,
    }),
  }).then((res) => res.json())

  return await Promise.all(
    data.publication.posts.edges.map(async ({ node: post }): Promise<Note> => {
      const views =
        (await redis.get<number>(
          ['pageviews', `/notes/${post.slug}`].join(':'),
        )) ?? 0

      const { status, content } = parseStatusFromContent(post.content.markdown)

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
          previousSlugs: post.previousSlugs,
          views,
        },
        content: content
          // Hashnode serves images with an odd non-standard markdown syntax that looks like this:
          // ![alt](url.com align="center")
          // This is a temporary hack to remove that non-standard syntax and make it render until I
          // figure out a long-term solution for it. Right now, it'd break if I use different alignment.
          .replaceAll('align="center")', ')'),
      }
    }),
  ).then((res) => res.sort((a, b) => b.frontmatter.views - a.frontmatter.views))
}

export async function getNote(
  slug,
): Promise<{ content: string; frontmatter: Frontmatter } | null> {
  const notes = await getNotes()

  return notes.find((note) => note.frontmatter.slug === slug) || null
}

const STATUS_REGEX = /^status-(\w+)$/m

function parseStatusFromContent(markdown: string): {
  content: string
  status?: Status
} {
  let status
  const result = markdown.match(STATUS_REGEX)
  if (result) status = result[1]
  return { content: markdown.replace(STATUS_REGEX, ''), status }
}
