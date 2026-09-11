import type { NextConfig } from 'next'
import createMDX from '@next/mdx'

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  turbopack: {},
  experimental: {
    mdxRs: true,
  },
  async redirects() {
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
