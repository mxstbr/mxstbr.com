import { BlogPosts } from 'app/components/posts'

import { getRepos } from './github'
import ossProjects from './data/oss-projects'
import { investments } from './investing/investments'
import Link from 'next/link'
import { ItemList, ItemListItem } from './components/item-list'

export const revalidate = 3600 // revalidate every hour

export default async function Home() {
  const repos = await getRepos(
    ossProjects
      .filter((project) => project.featured)
      .map((project) => project.repo)
  )

  return (
    <div className="space-y-16">
      <Section title="TL;DR">
        <ItemList>
          <li>
            CEO & co-founder of <a href="https://stellate.co">Stellate</a>, the
            GraphQL CDN
          </li>
          <li>
            <Link href="/oss">Creator of open source projects</Link> used by
            millions of developers
          </li>
          <li>
            <a href="https://github.com/mxstbr/ama/issues/46">
              Speciality coffee barista
            </a>{' '}
            and{' '}
            <a href="https://www.youtube.com/watch?v=19kDOIwzTfE">
              backcountry skier
            </a>
          </li>
          <li>Austrian 🇦🇹 in San Francisco</li>
          <li>
            <a href="https://linkedin.com/in/mxstbr">LinkedIn</a>,{' '}
            <a href="https://twitter.com/mxstbr">Twitter</a>,{' '}
            <a href="https://github.com/mxstbr">GitHub</a>,{' '}
            <a href="https://instagram.com/mxstbr">Instagram</a>
          </li>
        </ItemList>
      </Section>

      <Section title="Essays">
        <BlogPosts />
      </Section>

      <Section title="Work">
        <ItemList>
          {work.map((project) => (
            <ItemListItem
              key={project.name}
              left={<Link href={project.href}>{project.name}</Link>}
              right={
                <>
                  <span>{project.role}</span>
                  <span className="ml-4 text-neutral-500 text-right tabular-nums shrink-0">
                    {project.timeframe}
                  </span>
                </>
              }
            />
          ))}
        </ItemList>
      </Section>

      <Section title="Open Source Projects">
        <ItemList>
          {repos.map((repo) => (
            <ItemListItem
              key={repo.nameWithOwner}
              left={
                <a href={`https://github.com${repo.nameWithOwner}`}>
                  {repo.nameWithOwner}
                </a>
              }
              right={
                <>
                  {repo.stargazerCount.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}{' '}
                  stars
                </>
              }
            />
          ))}
        </ItemList>
        <Link href="/oss" className="text-neutral-600">
          More →
        </Link>
      </Section>

      <Section title="Angel Investments">
        <ItemList>
          {investments.slice(0, 6).map((investment) => (
            <ItemListItem
              key={investment.href}
              left={
                <a target="_blank" href={investment.href}>
                  {investment.name}
                </a>
              }
              right={investment.description}
            />
          ))}
        </ItemList>
        <Link href="/investing" className="text-neutral-600">
          More →
        </Link>
      </Section>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-bold">{title}</h2>
      {children}
    </div>
  )
}

const work = [
  {
    name: 'Stellate',
    role: 'CEO & Co-founder',
    timeframe: '2021–now',
    href: 'https://stellate.co',
  },
  {
    name: 'Gatsby',
    role: 'Senior Staff Software Engineer',
    timeframe: '2020–2021',
    href: 'https://gatsbyjs.com',
  },
  {
    name: 'GitHub',
    role: 'Software Engineer',
    timeframe: '2018–2020',
    href: 'https://github.com',
  },
  {
    name: 'Spectrum',
    role: 'CTO & Co-founder',
    timeframe: '2017–2018',
    href: 'https://spectrum.chat',
  },
  {
    name: 'Thinkmill',
    role: 'Open Source Developer',
    timeframe: '2016–2017',
    href: 'https://thinkmill.com.au',
  },
]
