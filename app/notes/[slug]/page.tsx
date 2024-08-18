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
  const note = await getNote(params.slug)

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
        <ArrowLeft size="1em" /> Notes
      </Link>
      <h1 className="title font-bold text-4xl mt-6 mb-3">
        {frontmatter.title}
      </h1>
      <div className="flex items-center space-x-6 mb-6">
        <p className="text-md text-slate-600 dark:text-slate-400">
          {formatDate(frontmatter.publishedAt)}
          {frontmatter.updatedAt && (
            <>
              <span className="mx-1">&middot;</span>
              <span className="text-slate-600 dark:text-slate-400">
                Updated {formatDate(frontmatter.updatedAt)}
              </span>
            </>
          )}
        </p>
      </div>
      <Prose className="prose-lg">
        <MDXContent />
      </Prose>
    </section>
  )
}

function generateOgImage(title: string, publishedAt: string) {
  return `${prodUrl}/og?title=${encodeURIComponent(title)}&subtitle=Note published on ${formatDate(publishedAt)}`
}
