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
import { getNote, getNotes, type Note } from '../../data/notes'
import { useMDXComponents } from '../../../mdx-components'
import Link from 'next/link'
import ArrowLeft from 'react-feather/dist/icons/arrow-left'
import Tag from 'react-feather/dist/icons/tag'
import { slugify } from '../../slugify'

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
      remarkPlugins: [remarkSmartypants, remarkGfm],
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
    <section>
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

      <Link
        href="/notes"
        className="flex flex-row items-center gap-2 uppercase text-sm font-bold tracking-wider  no-underline hover:underline"
      >
        <ArrowLeft size="1em" /> All Notes
      </Link>
      <h1 className="title font-bold text-4xl mt-6 mb-3">
        {frontmatter.title}
      </h1>
      <div className="text-md flex items-center flex-wrap space-x-4 mb-6 text-slate-600 dark:text-slate-400">
        <span>
          {formatDate(frontmatter.publishedAt)}
          {frontmatter.updatedAt &&
            formatDate(frontmatter.updatedAt) !==
              formatDate(frontmatter.publishedAt) && (
              <> (updated {formatDate(frontmatter.updatedAt)})</>
            )}
        </span>
        {frontmatter.tags?.length && frontmatter.tags?.length > 0 && (
          <>
            <span>|</span>
            {frontmatter.tags?.map((tag) => (
              <Link
                key={tag.slug}
                href={`/notes/topics/${tag.slug}`}
                className="flex flex-row gap-1 items-center"
              >
                <Tag size="0.8em" className="text-slate-500" />
                {tag.name}
              </Link>
            ))}
          </>
        )}
      </div>
      <div className="relative">
        {/* Sidebar */}
        {(headings.length > 1 ||
          (!!headings[0] &&
            Array.isArray(headings[0].children) &&
            headings[0].children?.length > 0)) && (
          <div className="top-8 hidden xl:block sticky">
            <div className="absolute -right-8 translate-x-full top-0 w-1/2 text-sm text-slate-500 space-y-2">
              <strong>Table of contents</strong>
              <ul className="space-y-2 font-mono tracking-tighter">
                {headings.map((heading) => (
                  <TOCHeading key={heading.text} {...heading} />
                ))}
              </ul>
            </div>
          </div>
        )}
        {/* Content */}
        <Prose className="prose-lg">
          <MDXContent />
        </Prose>
      </div>
      {relatedNotes.length > 0 && (
        <div className="bg-slate-100 dark:bg-slate-900 sm:rounded-md border border-solid border-slate-300 dark:border-slate-700 p-8 mt-16">
          <h1 className="text-lg font-bold mt-0 mb-8">
            Other notes about{' '}
            {note.frontmatter.tags
              ?.map((tag) => (
                <Link
                  href={`/notes/topics/${tag.slug}`}
                  className="inline-flex flex-row items-baseline"
                >
                  <Tag size="0.8em" className="mr-1" /> {tag.name}
                </Link>
              ))
              .reduce((result, item) => (
                <>
                  {result} and/or {item}
                </>
              ))}
          </h1>
          <ul className="space-y-6 sm:space-y-4">
            {relatedNotes
              .sort(
                (a, b) =>
                  new Date(b.frontmatter.publishedAt).getTime() -
                  new Date(a.frontmatter.publishedAt).getTime(),
              )
              .map((note) => (
                <li
                  key={note.frontmatter.slug}
                  className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row sm:space-x-4"
                >
                  <div className="w-32 font-mono shrink-0 tabular-nums text-slate-500">
                    {formatDate(note.frontmatter.publishedAt)}
                  </div>
                  <Link href={`/notes/${note.frontmatter.slug}`}>
                    {note.frontmatter.title}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function TOCHeading(props: Heading) {
  return (
    <li>
      <a
        className="no-underline hover:underline"
        href={`#${slugify(props.text)}`}
      >
        {`#`.repeat(props.level)} {props.text}
      </a>
      {Array.isArray(props.children) && props.children.length > 0 && (
        <ul className="pl-4 space-y-2 mt-2">
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
