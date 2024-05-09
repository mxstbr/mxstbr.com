import './global.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Navbar } from './components/nav'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Footer from './components/footer'
import { prodUrl } from './sitemap'
import { size } from './og/route'

export const metadata: Metadata = {
  metadataBase: new URL(prodUrl),
  title: {
    default: 'Max Stoiber (@mxstbr)',
    template: '%s | Max Stoiber (@mxstbr)',
  },
  description:
    'CEO & co-founder of Stellate, creator of styled-components and react-boilerplate and angel investor in early-stage startups.',
  openGraph: {
    title: 'Max Stoiber (@mxstbr)',
    description:
      'CEO & co-founder of Stellate, creator of styled-components and react-boilerplate and angel investor in early-stage startups.',
    url: prodUrl,
    siteName: 'Max Stoiber (@mxstbr)',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og',
        alt: 'Max Stoiber (@mxstbr)',
        ...size,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Max Stoiber (@mxstbr)',
    description:
      'CEO & co-founder of Stellate, creator of styled-components and react-boilerplate and angel investor in early-stage startups.',
    site: '@mxstbr',
    creator: '@mxstbr',
    images: ['/og'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const cx = (...classes) => classes.filter(Boolean).join(' ')

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={cx(
        'text-black bg-white dark:text-white dark:bg-black',
        inter.className
      )}
    >
      <body className="antialiased mt-8 px-4 mx-auto">
        <main className="flex-auto min-w-0 mt-6 flex flex-col px-2 space-y-24">
          <Navbar />
          {children}
          <Footer />
          <Analytics />
          <SpeedInsights />
        </main>
      </body>
    </html>
  )
}
