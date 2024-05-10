import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  experimental: {
    ppr: true,
    outputFileTracingIncludes: {
      '**': ['./app/thoughts'],
    },
  },
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

const withMDX = createMDX()

export default withMDX(nextConfig)
