import './global.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Navbar } from './components/nav'
import { Analytics } from '@vercel/analytics/react'
import Script from 'next/script'
import Footer from './components/footer'
import { prodUrl } from './sitemap'
import { size } from './og/utils'
import { ReportView } from './components/report-view'

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
        'text-slate-900 bg-slate-50 dark:text-slate-100 dark:bg-slate-950',
        inter.className,
      )}
    >
      <body className="antialiased mt-8 px-4 mx-auto">
        <main className="min-w-0 max-w-prose mx-auto mt-6 px-2 space-y-24">
          <Navbar />
          {children}
          <Footer />
        </main>
        <Analytics />
        <ReportView />
        {/* Splitbee */}
        <Script async data-api="/_sb" src="/sb.js"></Script>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'http://schema.org',
              '@type': 'Person',
              id: 'mxstbr',
              email: 'mailto:contact@mxstbr.com',
              image: 'https://mxstbr.com/static/images/headshot.jpeg',
              jobTitle: 'Senior Software Engineer',
              familyName: 'Stoiber',
              givenName: 'Max',
              name: 'Max Stoiber',
              birthPlace: 'Vienna, Austria',
              birthDate: '1997-01-04',
              height: '185 cm',
              gender: 'male',
              nationality: 'Austria',
              url: 'https://mxstbr.com',
              sameAs: [
                'https://mxstbr.blog',
                'https://www.facebook.com/mxstbr',
                'https://www.linkedin.com/in/max-stoiber-46698678',
                'http://twitter.com/mxstbr',
                'http://instagram.com/mxstbr',
              ],
            }),
          }}
        />
      </body>
    </html>
  )
}
