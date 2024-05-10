import Link from 'next/link'
import { getBlogPosts } from 'app/thoughts/utils'
import { ItemList, ItemListItem } from './item-list'
import { NewsletterSignupForm } from './newsletter-form'
import Views from './views'
import { Suspense } from 'react'

export function BlogPosts() {
  let publishedBlogs = getBlogPosts()

  return (
    <div className="space-y-12 relative">
      <ItemList>
        {publishedBlogs.map((post) => (
          <ItemListItem
            key={post.slug}
            left={
              <Link
                href={`/thoughts/${post.slug}`}
                className="text-slate-900 dark:text-slate-100  shrink-0"
              >
                {post.metadata.title}
              </Link>
            }
            right={
              <Suspense fallback={null}>
                <Views slug={post.slug} />
              </Suspense>
            }
          />
        ))}
      </ItemList>
      <NewsletterSignupForm />
    </div>
  )
}
