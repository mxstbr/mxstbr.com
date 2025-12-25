import { prodUrl } from 'app/sitemap'
import { getBlogPosts } from 'app/(public)/thoughts/utils'
import { getNotes } from '../(public)/notes/utils'

export const dynamic = 'force-static'

export async function GET() {
  let allBlogs = getBlogPosts({ archived: true })

  const blogXml = allBlogs
    .sort((a, b) => {
      if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
        return -1
      }
      return 1
    })
    .map(
      (post) =>
        `<item>
          <title>${post.metadata.title}</title>
          <link>${prodUrl}/thoughts/${post.slug}</link>
          <guid>${prodUrl}/thoughts/${post.slug}</guid>
          <description>${
            // NOTE: We need to double escape, apparently: https://validator.w3.org/feed/docs/warning/NotHtml.html
            escapeXml(escapeXml(post.metadata.summary || ''))
          }</description>
          <pubDate>${new Date(
            post.metadata.publishedAt,
          ).toUTCString()}</pubDate>
          ${post.metadata.updatedAt ? `<lastBuildDate>${new Date(post.metadata.updatedAt).toUTCString()}</lastBuildDate>` : ''}
        </item>`,
    )
    .join('\n')

  const notes = await getNotes()
  const notesXml = notes
    .sort(
      (a, b) =>
        new Date(b.metadata.publishedAt).getTime() -
        new Date(a.metadata.publishedAt).getTime(),
    )
    .map(
      (note) => `<item>
      <title>${note.metadata.title}</title>
      <link>${prodUrl}/notes/${note.slug}</link>
      <guid>${prodUrl}/notes/${note.slug}</guid>
      <description>${
        // NOTE: We need to double escape, apparently: https://validator.w3.org/feed/docs/warning/NotHtml.html
        escapeXml(escapeXml(note.metadata.summary || ''))
      }</description>
      <pubDate>${new Date(note.metadata.publishedAt).toUTCString()}</pubDate>
      ${note.metadata.updatedAt ? `<lastBuildDate>${new Date(note.metadata.updatedAt).toUTCString()}</lastBuildDate>` : ''}
    </item>`,
    )
    .join('\n')

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Sonjeet Paul's Essays</title>
        <link>${prodUrl}</link>
        <description>CEO and co-founder of Stellate, creator of styled-components and react-boilerplate and angel investor in early-stage startups.</description>
        <atom:link href="https://mxstbr.com/rss" rel="self" type="application/rss+xml" />
        ${blogXml}
        ${notesXml}
    </channel>
  </rss>`

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'text/xml',
    },
  })
}

// From: https://stackoverflow.com/a/27979933
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
    }
  })
}
