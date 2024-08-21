import { getBlogPosts } from 'app/thoughts/utils'
import { navItems } from './components/nav'
import { getNotes } from './data/notes'

export const prodUrl = 'https://mxstbr.com'
export const dynamic = 'force-static'

export default async function sitemap() {
  let blogs = getBlogPosts({ archived: true }).map((post) => ({
    url: `${prodUrl}/thoughts/${post.slug}`,
    lastModified: post.metadata.updatedAt || post.metadata.publishedAt,
  }))

  const notes = await getNotes()

  let notesPages = notes.map((note) => ({
    url: `${prodUrl}/notes/${note.frontmatter.slug}`,
    lastModified: note.frontmatter.updatedAt || note.frontmatter.publishedAt,
  }))

  let routes = ['', ...Object.keys(navItems)].map((route) => ({
    url: `${prodUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...blogs, ...notesPages]
}
