import { getBlogPosts } from 'app/thoughts/utils'

export const baseUrl = 'https://mxstbr.com'

export default async function sitemap() {
  let blogs = getBlogPosts().map((post) => ({
    url: `${baseUrl}/thoughts/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }))

  let routes = ['', '/thoughts'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...blogs]
}
