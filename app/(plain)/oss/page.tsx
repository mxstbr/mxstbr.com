import { getRepos } from '../../github'
import ossProjects from '../../(public)/oss/data'
import { Metadata } from 'next'
import { size } from 'app/og/utils'
import { prodUrl } from 'app/sitemap'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Open Source Projects',
  description:
    'All the open source projects I have (co-)created over the years.',
  openGraph: {
    title: 'Open Source Projects | Max Stoiber (@mxstbr)',
    description:
      'All the open source projects I have (co-)created over the years.',
    url: `${prodUrl}/oss`,
    siteName: 'Max Stoiber (@mxstbr)',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og?title=Open%20Source%20Projects',
        alt: 'Max Stoiber (@mxstbr)',
        ...size,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Open Source Projects | Max Stoiber (@mxstbr)',
    description:
      'All the open source projects I have (co-)created over the years.',
    site: '@mxstbr',
    creator: '@mxstbr',
    images: ['/og?title=Open%20Source%20Projects'],
  },
}

export default async function OSS() {
  const repos = await getRepos(ossProjects.map((project) => project.repo)).then(
    (repos) =>
      repos.map((repo) => {
        const project = ossProjects.find(
          (current) => current.repo === repo.nameWithOwner,
        )

        return {
          ...project,
          ...repo,
          description: repo.description || project?.description || '',
        }
      }),
  )

  return (
    <article className="plain-page">
      <h1>Open Source Projects</h1>

      <section>
        <p>
          <a href="https://npmtrends.com/styled-components">
            Millions of developers
          </a>{' '}
          have used open source projects that I have (co-)created{' '}
          <a
            href="https://trends.builtwith.com/framework/Styled-Components"
            target="_blank"
          >
            to build over 1.2 million websites
          </a>
          , including almost 10% of the top 10k. These open source projects have
          a total of{' '}
          {repos
            .filter((repo) => repo.owner !== false)
            .reduce((total, repo) => total + repo.stargazerCount, 0)
            .toLocaleString()}{' '}
          stars on GitHub:
        </p>
      </section>

      <section aria-labelledby="created-projects">
        <h2 id="created-projects">Projects I created:</h2>
        <ul>
          {repos
            .filter((repo) => repo.owner !== false)
            .sort((a, b) => b.stargazerCount - a.stargazerCount)
            .map((repo) => (
              <Repo repo={repo} key={repo.nameWithOwner} />
            ))}
        </ul>
      </section>

      <section aria-labelledby="maintained-projects">
        <h2 id="maintained-projects">Projects I maintained:</h2>
        <ul>
          {repos
            .filter((repo) => repo.owner === false)
            .sort((a, b) => b.stargazerCount - a.stargazerCount)
            .map((repo) => (
              <Repo repo={repo} key={repo.nameWithOwner} />
            ))}
        </ul>
      </section>

      <section>
        <Link href="/">← Max Stoiber</Link>
      </section>
    </article>
  )
}

function Repo({ repo }) {
  const stars = repo.stargazerCount.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })

  return (
    <li>
      <a href={`https://github.com/${repo.nameWithOwner}`}>
        {repo.nameWithOwner}
      </a>
      {repo.owner === false ? ` (maintainer)` : null} — {repo.description} (
      {stars} stars)
    </li>
  )
}
