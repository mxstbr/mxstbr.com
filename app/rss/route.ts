import { prodUrl } from 'app/sitemap'
import { getBlogPosts } from 'app/thoughts/utils'

export async function GET() {
  let allBlogs = await getBlogPosts({ archived: true })

  const itemsXml = allBlogs
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
            post.metadata.publishedAt
          ).toUTCString()}</pubDate>
        </item>`
    )
    .join('\n')

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Max Stoiber's Essays</title>
        <link>${prodUrl}</link>
        <description>CEO and co-founder of Stellate, creator of styled-components and react-boilerplate and angel investor in early-stage startups.</description>
        <atom:link href="https://mxstbr.com/rss" rel="self" type="application/rss+xml" />
        ${itemsXml}
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
