import { getRepos } from '../../github'
import ossProjects from './data'
import Prose from 'app/components/prose'
import { Metadata } from 'next'
import { size } from 'app/og/utils'
import { prodUrl } from 'app/sitemap'

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
      repos.map((repo) => ({
        ...ossProjects.find((project) => repo.nameWithOwner === project.repo),
        ...repo,
      })),
  )

  return (
    <div className="space-y-12">
      <Prose>
        <h1>Open Source Projects</h1>
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
      </Prose>
      <ul className="space-y-4">
        {repos
          .filter((repo) => repo.owner !== false)
          .sort((a, b) => b.stargazerCount - a.stargazerCount)
          .map((repo) => (
            <Repo repo={repo} key={repo.nameWithOwner} />
          ))}
      </ul>
      <ul className="space-y-4">
        {repos
          .filter((repo) => repo.owner === false)
          .sort((a, b) => b.stargazerCount - a.stargazerCount)
          .map((repo) => (
            <Repo repo={repo} key={repo.nameWithOwner} />
          ))}
      </ul>
    </div>
  )
}

function Repo({ repo }) {
  return (
    <li
      key={repo.nameWithOwner}
      className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2"
    >
      <div className="text-slate-600 shrink-0 dark:text-slate-400 w-[120px] tabular-nums">
        {repo.stargazerCount.toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })}{' '}
        stars
      </div>
      <div>
        <p className="text-slate-900 dark:text-slate-100 ">
          <a
            className="underline"
            href={`https://github.com/${repo.nameWithOwner}`}
          >
            {repo.nameWithOwner}
          </a>
          {repo.owner === false ? ` (maintainer)` : null}
        </p>
        <p className="text-slate-600 dark:text-slate-400">{repo.description}</p>
      </div>
    </li>
  )
}
