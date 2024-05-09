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
