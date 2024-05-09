import { getBlogPosts } from 'app/thoughts/utils'
import { navItems } from './components/nav'

export const prodUrl = 'https://mxstbr.com'

export default async function sitemap() {
  let blogs = getBlogPosts({ archived: true }).map((post) => ({
    url: `${prodUrl}/thoughts/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }))

  let routes = ['', ...Object.keys(navItems)].map((route) => ({
    url: `${prodUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...blogs]
}
