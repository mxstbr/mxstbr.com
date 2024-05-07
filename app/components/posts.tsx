import Link from 'next/link'
import { formatDate, getBlogPosts } from 'app/thoughts/utils'

export function BlogPosts() {
  let allBlogs = getBlogPosts()

  return (
    <div>
      {allBlogs.map((post) => (
        <div key={post.slug} className="flex flex-col space-y-1 mb-4">
          <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2">
            <p className="text-neutral-600 dark:text-neutral-400 w-[120px] tabular-nums">
              {formatDate(post.metadata.publishedAt, false)}
            </p>
            <Link href={`/thoughts/${post.slug}`}>
              <p className="text-neutral-900 dark:text-neutral-100 tracking-tight">
                {post.metadata.title}
              </p>
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
