import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  // TODO: Redirects. Redirects. Redirects.
  async redirects() {
    return [
      {
        source: '/thoughts',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

const withMDX = createMDX()

export default withMDX(nextConfig)
