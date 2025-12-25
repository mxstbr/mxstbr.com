import { getBlogPosts } from 'app/(public)/thoughts/utils'
import { navItems } from './components/nav'
import { getNotes } from './(public)/notes/utils'

export const prodUrl = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000' 
  : 'https://your-website.vercel.app'
export const dynamic = 'force-static'

export default async function sitemap() {
  let blogs = getBlogPosts({ archived: true }).map((post) => ({
    url: `${prodUrl}/thoughts/${post.slug}`,
    lastModified: post.metadata.updatedAt || post.metadata.publishedAt,
  }))

  const notes = await getNotes()

  let notesPages = notes.map((note) => ({
    url: `${prodUrl}/notes/${note.slug}`,
    lastModified: note.metadata.updatedAt || note.metadata.publishedAt,
  }))

  let routes = ['', ...Object.keys(navItems)].map((route) => ({
    url: `${prodUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...blogs, ...notesPages]
}
