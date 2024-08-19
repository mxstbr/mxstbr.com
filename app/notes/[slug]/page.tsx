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
import { getNote, getNotes } from '../../data/notes'
import { useMDXComponents } from '../../../mdx-components'
import Link from 'next/link'
import ArrowLeft from 'react-feather/dist/icons/arrow-left'
import Tag from 'react-feather/dist/icons/tag'

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
  let ogImage = generateOgImage(
    note.frontmatter.title,
    note.frontmatter.publishedAt,
  )

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
            image: generateOgImage(frontmatter.title, frontmatter.publishedAt),
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
      <Prose className="prose-lg">
        <MDXContent />
      </Prose>
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
          <ul className="space-y-4">
            {relatedNotes
              .sort(
                (a, b) =>
                  new Date(b.frontmatter.publishedAt).getTime() -
                  new Date(a.frontmatter.publishedAt).getTime(),
              )
              .map((note) => (
                <li
                  key={note.frontmatter.slug}
                  className="flex flex-row space-x-4"
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

function generateOgImage(title: string, publishedAt: string) {
  return `${prodUrl}/og?title=${encodeURIComponent(title)}&subtitle=Note published on ${formatDate(publishedAt)}`
}
