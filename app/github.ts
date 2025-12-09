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
  try {
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

    if (!process.env.GITHUB_ACCESS_TOKEN) {
      throw new Error('Missing GitHub token')
    }

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

    if (!res.ok) {
      throw new Error(`GitHub API responded with ${res.status}`)
    }

    const json = await res.json()

    const data = Object.keys(json.data).map((key) => json.data[key])

    return data
  } catch (error) {
    console.warn('Falling back to local repo data:', error)

    return repos.map((repo) => ({
      nameWithOwner: repo,
      stargazerCount: 0,
      description: '',
    }))
  }
}
