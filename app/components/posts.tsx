import Link from 'next/link'
import { formatDate, getBlogPosts } from 'app/thoughts/utils'

export function BlogPosts() {
  let allBlogs = getBlogPosts()

  return (
    <div className="space-y-4">
      {allBlogs.map((post) => (
        <div key={post.slug} className="flex flex-col space-y-1 mb-4">
          <div className="flex items-center space-x-4">
            <Link
              href={`/thoughts/${post.slug}`}
              className="text-neutral-900 dark:text-neutral-100  shrink-0"
            >
              <p>{post.metadata.title}</p>
            </Link>
            <span className="w-full border-t border-gray-300 border-dashed shrink dark:border-gray-800"></span>
            <p className="text-neutral-600 text-right dark:text-neutral-400 tabular-nums shrink-0">
              {post.metadata.views.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{' '}
              views
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
