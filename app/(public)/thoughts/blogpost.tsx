import { notFound } from 'next/navigation'
import { formatDate, getBlogPosts } from 'app/(public)/thoughts/utils'
import { prodUrl } from 'app/sitemap'
import Prose from 'app/components/prose'
import { size } from 'app/og/utils'
import { NewsletterSignupForm } from 'app/components/newsletter-form'

export async function generateStaticParams() {
  let posts = getBlogPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

function generateOgImage(post) {
  if (post.metadata.image) return post.metadata.image

  return `${prodUrl}/og?name=${encodeURIComponent("Sonjeet Paul's Essays")}&title=${encodeURIComponent(
    post.metadata.title,
  )}&subtitle=${
    post.metadata.views > 0
      ? `${post.metadata.views.toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })} views`
      : ''
  }`
}

export const generateMeta = (meta) => () => {
  let post = getBlogPosts({ archived: true, drafts: true }).find(
    (post) => post.metadata.title === meta.title,
  )

  if (!post) {
    return
  }

  let {
    title,
    publishedAt: publishedTime,
    summary: description,
  } = post.metadata
  let ogImage = generateOgImage(post)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      url: `${prodUrl}/thoughts/${post.slug}`,
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

export default async function Blog({ meta, children }) {
  // Show drafts & archived posts if people have direct links to them
  const post = getBlogPosts({ drafts: true, archived: true }).find(
    (post) => post.metadata.title === meta.title,
  )

  if (!post) notFound()

  return (
    <>
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
              dateModified:
                post.metadata.updatedAt || post.metadata.publishedAt,
              description: post.metadata.summary,
              image: generateOgImage(post),
              url: `${prodUrl}/thoughts/${post.slug}`,
              author: {
                '@type': 'Person',
                '@id': 'mxstbr',
                name: 'Sonjeet Paul',
              },
            }),
          }}
        />

        <h1 className="title font-bold text-4xl mb-3 text-balance">
          {post.metadata.title}
        </h1>
        <div className="flex items-center space-x-6 mb-6">
          <p className="text-md text-slate-600 dark:text-slate-400">
            {post.metadata.state === 'draft'
              ? 'Unpublished draft'
              : formatDate(post.metadata.publishedAt)}
            {post.metadata.updatedAt && (
              <>
                <span className="mx-1">&middot;</span>
                <span className="text-slate-600 dark:text-slate-400">
                  Updated {formatDate(post.metadata.updatedAt)}
                </span>
              </>
            )}
          </p>
          {post.metadata.views > 0 && (
            <p className="text-md text-slate-600 dark:text-slate-400">
              {post.metadata.views.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{' '}
              views
            </p>
          )}
        </div>
        {post.metadata.state !== 'published' && (
          <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 p-4 rounded-lg mb-8">
            <p className="font-bold">
              This essay is{' '}
              {post.metadata.state === 'archived' ? 'archived' : 'a draft.'}
            </p>
            <p>
              {post.metadata.state === 'draft'
                ? 'Please DO NOT SHARE this essay, it is not ready for public consumption yet.'
                : "This essay might contain outdated information. I've preserved it for historical accuracy, but it might not be relevant anymore."}
            </p>
          </div>
        )}
        <Prose className="prose-lg">{children}</Prose>
      </section>
      <NewsletterSignupForm className="mt-16" />
    </>
  )
}
