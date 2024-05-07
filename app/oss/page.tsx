import { getRepos } from '../github'
import ossProjects from '../data/oss-projects'

export default async function OSS() {
  const repos = await getRepos(ossProjects.map((project) => project.repo))

  return (
    <div className="prose">
      <h2>Open Source Projects</h2>
      <p>
        Open source projects I have (co-)created or maintained are used on more
        than 1% of all public, crawlable websites and have a total of{' '}
        {repos
          .reduce((total, repo) => total + repo.stargazerCount, 0)
          .toLocaleString()}{' '}
        stars on GitHub.
      </p>
      <ul>
        {repos
          .sort((a, b) => b.stargazerCount - a.stargazerCount)
          .map((repo) => (
            <li
              key={repo.nameWithOwner}
              className="flex flex-col space-y-1 mb-4"
            >
              <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2">
                <p className="text-neutral-600 dark:text-neutral-400 w-[120px] tabular-nums">
                  {repo.stargazerCount} stars
                </p>
                <div>
                  <p className="text-neutral-900 dark:text-neutral-100 tracking-tight">
                    <a
                      className="underline"
                      href={`https://github.com${repo.nameWithOwner}`}
                    >
                      {repo.nameWithOwner}
                    </a>
                  </p>
                  <p className="text-neutral-600">{repo.description}</p>
                </div>
              </div>
            </li>

            // <li key={repo.nameWithOwner}>
            //   <a href={`https://github.com${repo.nameWithOwner}`}>
            //     {repo.nameWithOwner}
            //   </a>
            //   : {repo.stargazerCount.toLocaleString()} stars
            // </li>
          ))}
      </ul>
    </div>
  )
}
