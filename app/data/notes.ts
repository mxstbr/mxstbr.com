/**
 * Notes from Gist
 * https://gist.github.com/mxstbr/29f4eebada6196debb1b085a844e49aa
 */
const GET_POSTS_QUERY = /* GraphQL */ `
  {
    publication(host: "mxstbr.com/notes") {
      id
      posts(first: 50) {
        edges {
          node {
            id
            slug
            title
            coverImage {
              url
            }
            content {
              markdown
            }
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
type Frontmatter = {
  title: string
  summary: string
  slug: string
  publishedAt: string
  updatedAt?: string
  tags?: Array<{
    name: string
    slug: string
  }>
  previousSlugs: Array<string>
}
type Note = {
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
    next: {
      revalidate: 300,
    },
  }).then((res) => res.json())

  return data.publication.posts.edges.map(({ node: post }) => ({
    frontmatter: {
      title: post.title,
      summary: post.seo.description,
      slug: post.slug,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
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
    },
    content: post.content.markdown,
  }))
}

export async function getNote(
  slug,
): Promise<{ content: string; frontmatter: Frontmatter } | null> {
  const notes = await getNotes()

  return notes.find((note) => note.frontmatter.slug === slug) || null
}
