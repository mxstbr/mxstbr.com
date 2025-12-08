import type { NextConfig } from 'next'
import createMDX from '@next/mdx'
import smartypants from 'remark-smartypants'
import { getNotes } from './app/(public)/notes/hashnode'

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  async redirects() {
    const notes = await getNotes()
    const previousSlugNotesRedirects = notes
      .filter((note) => note.frontmatter.previousSlugs.length > 0)
      .flatMap((note) =>
        note.frontmatter.previousSlugs.map((previousSlug) => ({
          source: `/notes/${previousSlug}`,
          destination: `/notes/${note.frontmatter.slug}`,
          permanent: true,
        })),
      )

    return [
      {
        source: '/thoughts',
        destination: '/',
        permanent: true,
      },
      {
        source: '/investments',
        destination: '/investing',
        permanent: true,
      },
      {
        source: '/angel',
        destination: '/investing',
        permanent: true,
      },
      ...previousSlugNotesRedirects,
    ]
  },
  async rewrites() {
    return [
      {
        source: '/sb.js',
        destination: 'https://cdn.splitbee.io/sb.js',
      },
      {
        source: '/_sb/:slug',
        destination: 'https://hive.splitbee.io/:slug',
      },
    ]
  },
  outputFileTracingIncludes: {
    '/stats': ['./app/(public)/thoughts/**/*'],
  },
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [smartypants],
  },
})

export default withMDX(nextConfig)
