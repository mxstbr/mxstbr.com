import { getRepos } from '../github'
import ossProjects from '../data/oss-projects'
import Prose from 'app/components/prose'

export default async function OSS() {
  const repos = await getRepos(ossProjects.map((project) => project.repo)).then(
    (repos) =>
      repos.map((repo) => ({
        ...ossProjects.find((project) => repo.nameWithOwner === project.repo),
        ...repo,
      }))
  )

  return (
    <>
      <Prose className="mb-16">
        <h2>Open Source Projects</h2>
        <p>
          Open source projects I have (co-)created or maintained are used on
          more than 1% of all public, crawlable websites and have a total of{' '}
          {repos
            .reduce((total, repo) => total + repo.stargazerCount, 0)
            .toLocaleString()}{' '}
          stars on GitHub:
        </p>
      </Prose>
      <ul className="space-y-4">
        {repos
          .filter((repo) => repo.owner !== false)
          .sort((a, b) => b.stargazerCount - a.stargazerCount)
          .map((repo) => (
            <Repo repo={repo} key={repo.nameWithOwner} />
          ))}
      </ul>
      <ul className="space-y-4 mt-16">
        {repos
          .filter((repo) => repo.owner === false)
          .sort((a, b) => b.stargazerCount - a.stargazerCount)
          .map((repo) => (
            <Repo repo={repo} key={repo.nameWithOwner} />
          ))}
      </ul>
    </>
  )
}

function Repo({ repo }) {
  return (
    <li
      key={repo.nameWithOwner}
      className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2"
    >
      <div className="text-neutral-600 shrink-0 dark:text-neutral-400 w-[120px] tabular-nums">
        {repo.stargazerCount.toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })}{' '}
        stars
      </div>
      <div>
        <p className="text-neutral-900 dark:text-neutral-100 ">
          <a
            className="underline"
            href={`https://github.com${repo.nameWithOwner}`}
          >
            {repo.nameWithOwner}
          </a>
          {repo.owner === false ? ` (maintainer)` : null}
        </p>
        <p className="text-neutral-600 dark:text-neutral-400">
          {repo.description}
        </p>
      </div>
    </li>
  )
}
