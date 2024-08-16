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
  }).then((res) => res.json())

  return data.publication.posts.edges.map(({ node: post }) => ({
    frontmatter: {
      title: post.title,
      summary: post.seo.description,
      slug: post.slug,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
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
