import type { NextConfig } from 'next'
import createMDX from '@next/mdx'
import { getNotes } from './app/(public)/notes/hashnode'

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  turbopack: {},
  experimental: {
    mdxRs: true,
  },
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
