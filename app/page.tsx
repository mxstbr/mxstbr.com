import { BlogPosts } from './components/posts'
import { investments } from './investing/investments'
import Link from 'next/link'
import { ItemList, ItemListItem } from './components/item-list'

export const revalidate = 3600 // revalidate every hour

export default async function Home() {
  return (
    <div className="space-y-20">
      <Section title="TL;DR">
        <ItemList>
          <ItemListItem
            left={
              <>
                CEO & co-founder of <a href="https://stellate.co">Stellate</a>,
                the GraphQL CDN
              </>
            }
            right={`⚡`}
          ></ItemListItem>
          <ItemListItem
            left={
              <>
                (Co-)creator of <Link href="/oss">open source projects</Link>{' '}
                used by millions
              </>
            }
            right={`💻`}
          ></ItemListItem>
          <ItemListItem
            left={
              <>
                <Link href="/investing">Angel investor</Link> in{' '}
                {investments.length}+ startups
              </>
            }
            right={`🚀`}
          ></ItemListItem>
          <ItemListItem
            left={
              <>
                <a href="https://github.com/mxstbr/ama/issues/46">
                  Speciality coffee barista
                </a>{' '}
                and{' '}
                <a href="https://www.youtube.com/watch?v=19kDOIwzTfE">
                  backcountry skier
                </a>
              </>
            }
            right={`🎿`}
          ></ItemListItem>
          <ItemListItem
            left={<>Austrian living in San Francisco</>}
            right={`🌁`}
          ></ItemListItem>
        </ItemList>
      </Section>

      <div className="relative flex-1">
        {/* Background */}
        <div className="absolute -top-6 -left-6 -right-6 -bottom-6 bg-slate-100 dark:bg-slate-900 sm:rounded-md border border-solid border-slate-300 dark:border-slate-700" />
        <Section className="relative">
          <h2 className="font-bold relative text-lg">Essays</h2>
          <BlogPosts />
        </Section>
      </div>
      <Section title="Work">
        <ItemList>
          {work.map((project) => (
            <div className="flex flex-row" key={project.name}>
              <ItemListItem
                left={<Link href={project.href}>{project.name}</Link>}
                right={
                  <div className="flex align-center">
                    <div>{project.role}</div>
                  </div>
                }
              />
              <div className="hidden xs:block ml-4 w-[6em] text-slate-500 text-right tabular-nums shrink-0">
                {project.timeframe}
              </div>
            </div>
          ))}
        </ItemList>
      </Section>
    </div>

    /* <Section title="Open Source Projects">
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
        <Link href="/oss" className="text-slate-600">
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
        <Link href="/investing" className="text-slate-600">
          More →
        </Link>
      </Section> */
  )
}

function Section({
  title,
  children,
  className,
}: {
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-6 flex-1 ${className}`}>
      {title && <h2 className="font-bold text-lg">{title}</h2>}
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
