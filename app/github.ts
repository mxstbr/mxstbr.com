import matter from 'gray-matter'

/**
 * Repositories
 */

type Repo = {
  nameWithOwner: string
  stargazerCount: number
  description: string
}

export async function getRepos(repos: Array<string>): Promise<Array<Repo>> {
  const query = `{
    ${repos
      .map((repo, index) => {
        const [owner, name] = repo.split('/')

        return `repo${index}: repository(owner: "${owner}", name: "${name}") { 
          nameWithOwner 
          stargazerCount 
          description 
        }`
      })
      .join('\n')}
  }`

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query,
    }),
  })

  const json = await res.json()

  const data = Object.keys(json.data).map((key) => json.data[key])

  return data
}

/**
 * Notes from Gist
 * https://gist.github.com/mxstbr/29f4eebada6196debb1b085a844e49aa
 */

const NOTES_GIST_ID = '29f4eebada6196debb1b085a844e49aa'

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
      Authorization: `c15db134-2e49-4ecd-8843-d88e8222aa52`,
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
