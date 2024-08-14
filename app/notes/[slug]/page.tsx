import { evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import { notFound } from 'next/navigation'
import remarkSmartypants from 'remark-smartypants'
import remarkGfm from 'remark-gfm'
import Prose from '../../components/prose'
import { prodUrl } from '../../sitemap'
import { formatDate } from '../../thoughts/utils'
import { size } from '../../og/utils'
import { getNote, getNotes } from '../../github'

// Generate all notes pages statically
export const dynamicParams = false
export const dynamic = 'force-static'
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
  let ogImage = generateOgImage(note.frontmatter.title)

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
            image: generateOgImage(frontmatter.title),
            url: `${prodUrl}/notes/${params.slug}`,
            author: {
              '@type': 'Person',
              '@id': 'mxstbr',
              name: 'Max Stoiber',
            },
          }),
        }}
      />

      <div className="bg-slate-100 border-slate-200 border dark:bg-yellow-900 text-slate-700 dark:text-yellow-100 p-4 rounded-lg mb-8">
        💡 The below is a <strong>note</strong>: my notes aren't as polished as
        my essays, but they are developed enough for me to share.
      </div>
      <h1 className="title font-bold text-4xl mb-2">{frontmatter.title}</h1>
      <div className="flex items-center space-x-6 mb-8 text-sm">
        <p className="text-sm text-slate-600 dark:text-slate-400">
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

function generateOgImage(title) {
  return `${prodUrl}/og?title=${encodeURIComponent(title)}&subtitle=Note`
}
