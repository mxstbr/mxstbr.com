import './plain.css'
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { ReportView } from '../components/report-view'
import { prodUrl } from '../sitemap'

export const metadata: Metadata = {
  metadataBase: new URL(prodUrl),
  title: {
    default: 'Max Stoiber (@mxstbr)',
    template: '%s | Max Stoiber (@mxstbr)',
  },
}

export default function PlainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <Analytics />
        <ReportView />
      </body>
    </html>
  )
}
