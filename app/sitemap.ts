import { getBlogPosts } from 'app/thoughts/utils'
import { navItems } from './components/nav'
import { notes } from './data/notes'

export const prodUrl = 'https://mxstbr.com'

export default async function sitemap() {
  let blogs = getBlogPosts({ archived: true }).map((post) => ({
    url: `${prodUrl}/thoughts/${post.slug}`,
    lastModified: post.metadata.updatedAt || post.metadata.publishedAt,
  }))

  let notesPages = notes.map((note) => ({
    url: note.href,
    lastModified: note.updatedAt,
  }))

  let routes = ['', ...Object.keys(navItems)].map((route) => ({
    url: `${prodUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...blogs, ...notesPages]
}
