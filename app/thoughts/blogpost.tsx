import { notFound } from 'next/navigation'
import { formatDate, getBlogPosts } from 'app/thoughts/utils'
import { baseUrl } from 'app/sitemap'
import Prose from 'app/components/prose'
import { CenterPage, Columns } from 'app/components/layout-columns'

export async function generateStaticParams() {
  let posts = getBlogPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export function generateMetadata({ params }) {
  let post = getBlogPosts().find((post) => post.slug === params.slug)
  if (!post) {
    return
  }

  let {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = post.metadata
  let ogImage = image
    ? image
    : `${baseUrl}/og?title=${encodeURIComponent(title)}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      url: `${baseUrl}/thoughts/${post.slug}`,
      images: [
        {
          url: ogImage,
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

// TODO: Fix mxstbr.com/thoughts/tailwind width.
export default function Blog({ meta, children }) {
  // Show drafts & archived posts if people have direct links to them
  const post = getBlogPosts({ drafts: true, archived: true }).find(
    (post) => post.metadata.title === meta.title
  )

  if (!post) notFound()

  return (
    <CenterPage>
      <section>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: post.metadata.title,
              datePublished: post.metadata.publishedAt,
              dateModified: post.metadata.publishedAt,
              description: post.metadata.summary,
              image: post.metadata.image
                ? `${baseUrl}${post.metadata.image}`
                : `/og?title=${encodeURIComponent(post.metadata.title)}`,
              url: `${baseUrl}/thoughts/${post.slug}`,
              author: {
                '@type': 'Person',
                '@id': 'mxstbr',
                name: 'Max Stoiber',
              },
            }),
          }}
        />

        <h1 className="title font-bold text-4xl mb-0">{post.metadata.title}</h1>
        <div className="flex items-center space-x-6 mb-8 text-sm">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {formatDate(post.metadata.publishedAt)}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {post.metadata.views.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}{' '}
            views
          </p>
        </div>
        {/* TODO: Fix heading levels across all blog posts */}
        <Prose className="prose-lg">{children}</Prose>
      </section>
    </CenterPage>
  )
}
