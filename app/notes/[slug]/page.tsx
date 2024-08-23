import React from 'react'
import { evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import { notFound } from 'next/navigation'
import remarkSmartypants from 'remark-smartypants'
import remarkGfm from 'remark-gfm'
import Prose from '../../components/prose'
import { prodUrl } from '../../sitemap'
import { formatDate } from '../../thoughts/utils'
import { size } from '../../og/utils'
import { EMOJI_FOR_STATUS, getNote, getNotes, type Note } from '../hashnode'
import { useMDXComponents } from '../../../mdx-components'
import Link from 'next/link'
import ArrowLeft from 'react-feather/dist/icons/arrow-left'
import Tag from 'react-feather/dist/icons/tag'
import { slugify } from '../../slugify'
import { EditButton } from './edit-button'
import FeedbackForm from './feedback-form'

export const dynamic = 'force-static'
export const revalidate = 60

export async function generateStaticParams() {
  return (await getNotes()).map((note) => note.frontmatter.slug)
}

export async function generateMetadata({ params }) {
  const note = await getNote(params.slug)

  if (!note) return null

  let {
    title,
    publishedAt: publishedTime,
    summary: description,
  } = note.frontmatter
  let ogImage = generateOgImage(note)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      url: `${prodUrl}/notes/${params.slug}`,
      images: [
        {
          url: ogImage,
          ...size,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function Page({ params }) {
  const notes = await getNotes()
  const note = notes.find((note) => note.frontmatter.slug === params.slug)

  if (!note) return notFound()

  const { content, frontmatter } = note

  const { default: MDXContent } = await evaluate(
    content,
    // For some reason the TS types only allow runtime, but not the
    // other options, even though it works just fine
    // @ts-ignore
    {
      ...runtime,
      remarkPlugins: [
        // @ts-ignore
        remarkSmartypants,
        remarkGfm,
      ],
      // @ts-ignore
      useMDXComponents: useMDXComponents,
    },
  )

  const headings = parseMarkdownHeadings(content)

  const relatedNotes = notes.filter(
    (maybeRelatedNote) =>
      maybeRelatedNote.frontmatter.slug !== note.frontmatter.slug &&
      maybeRelatedNote.frontmatter.tags?.some((tag) =>
        note.frontmatter.tags?.map((tag) => tag.slug).includes(tag.slug),
      ),
  )

  return (
    <section className="relative">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: frontmatter.title,
            datePublished: frontmatter.publishedAt,
            dateModified: frontmatter.updatedAt || frontmatter.publishedAt,
            description: frontmatter.summary,
            image: generateOgImage(note),
            url: `${prodUrl}/notes/${params.slug}`,
            author: {
              '@type': 'Person',
              '@id': 'mxstbr',
              name: 'Max Stoiber',
            },
          }),
        }}
      />

      <div className="relative">
        <Link
          href="/notes"
          className="text-slate-700 flex flex-row items-center gap-2 uppercase text-sm font-bold tracking-wider no-underline hover:underline"
        >
          <ArrowLeft size="1em" className="text-slate-500" /> All Notes
        </Link>
        <h1 className="title font-bold text-4xl leading-tight my-4">
          {frontmatter.title}
        </h1>

        {(headings.length > 1 ||
          (!!headings[0] &&
            Array.isArray(headings[0].children) &&
            headings[0].children?.length > 0)) && (
          <div className="hidden top-8 xl:block sticky">
            <div className="font-mono text-sm text-slate-500 absolute -right-6 pl-6 translate-x-full top-0 w-72 space-y-4 border border-y-0 border-r-0 dark:border-slate-700">
              <div className="space-y-2">
                <p className="uppercase font-bold">Reading time</p>
                <div>{note.frontmatter.readTimeInMinutes} mins</div>
              </div>
              <div className="space-y-2">
                <div className="font-mono font-bold uppercase tracking-wider">
                  Table of contents
                </div>
                <ul className="space-y-2 font-mono tracking-tighter">
                  {headings.map((heading) => (
                    <TOCHeading key={heading.text} {...heading} />
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        <div className="my-8">
          <div className="font-mono text-sm text-slate-500 dark:border-slate-700">
            <div className="flex flex-row">
              <div className="shrink-0 space-y-1 border-2 border-y-0 dark:border-slate-700 border-l-0 pr-6">
                <p className="uppercase font-bold">Status</p>
                <Link
                  href={`/notes/digital-garden#denoting-the-maturity-of-my-explorations`}
                  className="block"
                >
                  {EMOJI_FOR_STATUS[frontmatter.status]}{' '}
                  {/* Uppercase the status */}
                  {frontmatter.status[0].toUpperCase() +
                    frontmatter.status.substring(1)}
                </Link>
              </div>
              <div className=" shrink-0 space-y-1 px-6 border-2 border-y-0 dark:border-slate-700 border-l-0">
                <p className="uppercase font-bold">Last updated</p>
                <div>
                  {formatDate(frontmatter.updatedAt || frontmatter.publishedAt)}
                </div>
              </div>
              {frontmatter.tags?.length && frontmatter.tags?.length > 0 ? (
                <div className="space-y-1 pl-6">
                  <p className="uppercase font-bold">Topics</p>
                  <div className="flex flex-row flex-wrap gap-x-2 gap-y-1">
                    {frontmatter.tags?.map((tag) => (
                      <Link
                        key={tag.slug}
                        href={`/notes/topics/${tag.slug}`}
                        className="flex flex-row gap-1 items-center"
                      >
                        <Tag
                          size="0.8em"
                          className="opacity-75 text-slate-500"
                        />
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                ''
              )}
            </div>
          </div>
        </div>
        {/* Metadata, renders as sidebar on desktop (> xl) */}

        {/* Content */}
        <Prose className="prose-lg">
          <MDXContent />
        </Prose>
      </div>
      {relatedNotes.length > 0 && (
        <div className="my-32 relative">
          {/* Background */}
          <div className="absolute -top-6 -left-6 -right-6 -bottom-6 sm:-top-10 sm:-left-10 sm:-right-10 sm:-bottom-10 bg-slate-100 dark:bg-slate-900 sm:rounded-md border border-solid border-slate-300 dark:border-slate-700" />
          <div className="relative">
            <h1 className="text-xl font-bold mt-0 mb-8">
              Other notes about{' '}
              {note.frontmatter.tags
                ?.map((tag) => (
                  <Link
                    href={`/notes/topics/${tag.slug}`}
                    className="inline-flex flex-row items-baseline"
                  >
                    <Tag size="0.8em" className="opacity-75 mr-1" /> {tag.name}
                  </Link>
                ))
                .reduce((result, item) => (
                  <>
                    {result} and/or {item}
                  </>
                ))}
            </h1>
            <ul className="space-y-8 sm:space-y-6 text-lg">
              {relatedNotes.map((note) => (
                <li
                  key={note.frontmatter.slug}
                  className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-6"
                >
                  <div className="text-2xl">
                    {EMOJI_FOR_STATUS[note.frontmatter.status]}
                  </div>
                  <div className="space-y-2">
                    <Link href={`/notes/${note.frontmatter.slug}`}>
                      {note.frontmatter.title}
                    </Link>
                    <p className="text-slate-500">{note.frontmatter.summary}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {/* Admin-only: Edit button */}
      <EditButton cuid={note.frontmatter.cuid} />
      <FeedbackForm />
    </section>
  )
}

function TOCHeading(props: Heading) {
  return (
    <li className={props.level > 2 ? 'text-xs' : ''}>
      <a
        className="no-underline hover:underline"
        href={`#${slugify(props.text)}`}
      >
        {props.text}
      </a>
      {Array.isArray(props.children) && props.children.length > 0 && (
        <ul className="pl-4 space-y-1 mt-1">
          {props.children.map((child) => (
            <TOCHeading key={child.text} {...child} />
          ))}
        </ul>
      )}
    </li>
  )
}

function generateOgImage(note: Note) {
  return `${prodUrl}/og?name=${encodeURIComponent("Max Stoiber's Notes")}&title=${encodeURIComponent(note.frontmatter.title)}${note.frontmatter.tags && note.frontmatter.tags.length > 0 ? `&subtitle=${encodeURIComponent(`${note.frontmatter.tags?.map((tag) => `🏷️ ${tag.name}`).join(' ')}`)}` : ''}`
}

type Heading = {
  level: number
  text: string
  children?: Heading[]
}

function parseMarkdownHeadings(markdown) {
  const lines = markdown.split('\n')
  const toc: Heading[] = []
  const stack = [{ level: 0, children: toc }]
  let inCodeBlock = false

  lines.forEach((line) => {
    // Check for start or end of code block
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock
    }

    if (!inCodeBlock) {
      const match = line.match(/^(#{1,6})\s+(.*)$/)
      if (match) {
        const level = match[1].length
        const text = match[2]
        const item = { level, text, children: [] }

        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
          stack.pop()
        }

        stack[stack.length - 1].children.push(item)
        stack.push(item)
      }
    }
  })

  return toc
}
