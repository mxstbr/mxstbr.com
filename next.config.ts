import type { NextConfig } from 'next'
import createMDX from '@next/mdx'
import { getNotes } from './app/(public)/notes/utils'

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  turbopack: {},
  experimental: {
    mdxRs: true,
  },
  async redirects() {
    const notes = await getNotes()
    const previousSlugNotesRedirects = notes
      .filter((note) => note.metadata.previousSlugs.length > 0)
      .flatMap((note) =>
        note.metadata.previousSlugs.map((previousSlug) => ({
          source: `/notes/${previousSlug}`,
          destination: `/notes/${note.slug}`,
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
    // Turbopack requires MDX plugins be specified as serializable values.
    // Use the plugin module name string instead of an imported function.
    remarkPlugins: ['remark-smartypants'],
  },
})

export default withMDX(nextConfig)
