import { getBlogPosts } from 'app/(public)/thoughts/utils'

export function NewsletterSignupForm({ className = '' }) {
  const posts = getBlogPosts({ archived: true })
  const dates = posts.map((post) =>
    new Date(post.metadata.publishedAt).getTime()
  )
  const oldest = Math.min(...dates)
  const years = (new Date().getTime() - oldest) / 1000 / 60 / 60 / 24 / 365
  const averagePerYear = (posts.length / years).toFixed(2).replace('.', ',')

  return (
    <div className={`space-y-2 ${className}`}>
      <form
        action="https://buttondown.email/api/emails/embed-subscribe/mxstbr"
        method="post"
        target="popupwindow"
        className="flex flex-row items-center space-x-4 pb-4"
      >
        <input
          type="email"
          name="email"
          placeholder="your@email.com"
          className="w-full rounded-sm px-2 py-1 border-slate-300 dark:border-slate-700 dark:bg-black dark:text-white"
        />
        <input type="hidden" value="1" name="embed" />
        <div className="relative">
          <input
            type="submit"
            value="Get notified of new essays"
            className="px-4 h-full py-1 cursor-pointer bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-sm"
          />
          <div
            className="absolute -bottom-6 left-0 right-0 text-center text-slate-500 dark:text-slate-400 text-sm underline decoration-dotted decoration-slate-300 dark:decoration-slate-500 cursor-help"
            title={`${dates.length} essays (${
              dates.length -
              posts.filter((post) => post.metadata.state === 'published').length
            } archived) in ${years.toFixed(2)} years`}
          >
            Average: {averagePerYear} essays/year
          </div>
        </div>
      </form>
    </div>
  )
}
