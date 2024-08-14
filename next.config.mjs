import createMDX from '@next/mdx'
import smartypants from 'remark-smartypants'

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  async redirects() {
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
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [smartypants],
  },
})

export default withMDX(nextConfig)
