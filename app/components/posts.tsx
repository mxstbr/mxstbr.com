import Link from 'next/link'
import { getBlogPosts } from 'app/thoughts/utils'
import { ItemList, ItemListItem } from './item-list'

export function BlogPosts() {
  let allBlogs = getBlogPosts()

  const dates = allBlogs.map((post) =>
    new Date(post.metadata.publishedAt).getTime()
  )
  const newest = new Date()
  const oldest = Math.min(...dates)
  const years = (newest - oldest) / 1000 / 60 / 60 / 24 / 365
  const averagePerYear = (allBlogs.length / years).toFixed(3)

  return (
    <div className="space-y-12">
      <ItemList>
        {allBlogs.map((post) => (
          <ItemListItem
            key={post.slug}
            left={
              <Link
                href={`/thoughts/${post.slug}`}
                className="text-neutral-900 dark:text-neutral-100  shrink-0"
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
      <div className="space-y-2">
        <form
          action="https://buttondown.email/api/emails/embed-subscribe/mxstbr"
          method="post"
          target="popupwindow"
          className="flex flex-row space-x-4"
        >
          <input
            type="email"
            name="email"
            placeholder="your@email.com"
            className="w-full rounded-sm px-2 py-1 self-start dark:bg-black dark:text-white"
          />
          <input type="hidden" value="1" name="embed" />
          <div className="text-center space-y-1">
            <input
              type="submit"
              value="Get notified of new essays"
              className="px-4 py-1 cursor-pointer bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 rounded-sm"
            />
            <div
              className="text-neutral-500 dark:text-neutral-400 text-sm underline decoration-dotted cursor-help"
              title={`${allBlogs.length} essays in ${years.toFixed(2)} years`}
            >
              Average: {averagePerYear} essays/year
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
