import Link from 'next/link'
import { getBlogPosts } from 'app/thoughts/utils'
import { ItemList, ItemListItem } from './item-list'

export function BlogPosts() {
  let allBlogs = getBlogPosts()

  return (
    <div className="space-y-8">
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
          className="flex-1 rounded-sm px-2 py-1"
        />
        <input type="hidden" value="1" name="embed" />
        <input
          type="submit"
          value="Get notified of new essays"
          className="px-4 py-1 bg-slate-900 text-white rounded-sm"
        />
      </form>
    </div>
  )
}
