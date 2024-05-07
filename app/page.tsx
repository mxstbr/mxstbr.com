import { BlogPosts } from 'app/components/posts'

import { getRepos } from './github'
import ossProjects from './data/oss-projects'
import { investments } from './investing/investments'

export const revalidate = 3600 // revalidate every hour

export default async function Home() {
  const repos = await getRepos(
    ossProjects
      .filter((project) => project.featured)
      .map((project) => project.repo)
  )

  return (
    <div className="space-y-12">
      <Section title="TL;DR">
        <SectionList>
          <li>
            Founder & CEO of <a href="https://stellate.co">Stellate</a>, the
            GraphQL CDN
          </li>
          <li>
            Previously founder & CTO of Spectrum (
            <a
              href="https://hub.packtpub.com/github-acquires-spectrum-a-community-centric-conversational-platform/"
              target="_blank"
            >
              acq. by GitHub
            </a>
            ) and Staff Software Engineer at{' '}
            <a href="https://gatsbyjs.com" target="_blank">
              Gatsby
            </a>
          </li>
          <li>
            Creator of open source projects used by millions of developers
          </li>
          <li>Angel investor in 20+ early-stage startups</li>
          <li>
            <a href="https://github.com/mxstbr/ama/issues/46">
              Speciality coffee barista
            </a>{' '}
            and{' '}
            <a href="https://www.youtube.com/watch?v=19kDOIwzTfE">
              backcountry skier
            </a>
          </li>
          <li>Austrian living in San Francisco</li>
          <li>
            Follow me on <a href="https://linkedin.com/in/mxstbr">LinkedIn</a>,{' '}
            <a href="https://twitter.com/mxstbr">Twitter</a>,{' '}
            <a href="https://github.com/mxstbr">GitHub</a>, and{' '}
            <a href="https://instagram.com/mxstbr">Instagram</a>
          </li>
        </SectionList>
      </Section>

      <Section title="Essays">
        <BlogPosts />
      </Section>

      <Section title="Projects">
        <SectionList>
          {projects.map((project) => (
            <li key={project.name} className="flex flex-col space-y-1 mb-4">
              <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2">
                <p className="text-neutral-600 dark:text-neutral-400 w-[120px] tabular-nums">
                  {project.timeframe}
                </p>
                <div>
                  <p className="text-neutral-900 dark:text-neutral-100 tracking-tight">
                    <a className="underline" href={project.href}>
                      {project.name}
                    </a>
                    : {project.description}
                  </p>
                  <p className="text-neutral-600">{project.role}</p>
                </div>
              </div>
            </li>
          ))}
        </SectionList>
      </Section>

      <Section title="Open Source Projects">
        <SectionList>
          {repos.map((repo) => (
            <li key={repo.nameWithOwner}>
              <a href={`https://github.com${repo.nameWithOwner}`}>
                {repo.nameWithOwner}
              </a>
              :{' '}
              {repo.stargazerCount.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{' '}
              stars
            </li>
          ))}
        </SectionList>
        <p>See all →</p>
      </Section>

      <Section title="Angel Investments">
        <SectionList>
          {investments.slice(0, 6).map((investment) => (
            <li key={investment.href}>
              <a target="_blank" href={investment.href}>
                {investment.name}
              </a>
              , {investment.description}
            </li>
          ))}
        </SectionList>
        <p>See all →</p>
      </Section>

      {Array.from(Array(100)).map((_, i) => (
        <br key={i} />
      ))}
    </div>
  )
}

function SectionList(props: { children: React.ReactNode }) {
  return <ul className="space-y-2">{props.children}</ul>
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

const projects = [
  {
    name: 'Stellate',
    description: 'The GraphQL CDN',
    role: 'CEO & Co-founder',
    timeframe: '2021–now',
    href: 'https://stellate.co',
  },
  {
    name: 'styled-components',
    description: 'CSS-in-JS for React apps (40,112 stars)',
    role: 'Co-creator',
    timeframe: '2016–2020',
    href: 'https://stellate.co',
  },
]
