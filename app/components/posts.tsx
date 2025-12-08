import Link from 'next/link'
import { getBlogPosts } from 'app/(public)/thoughts/utils'
import { ItemList, ItemListItem } from './item-list'
import { NewsletterSignupForm } from './newsletter-form'

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
              <>
                {post.metadata.views.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}{' '}
                views
              </>
            }
          />
        ))}
      </ItemList>
      <NewsletterSignupForm />
    </div>
  )
}
