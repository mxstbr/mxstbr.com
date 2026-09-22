import type { Metadata, Viewport } from 'next'
import './chores.css'

export const metadata: Metadata = {
  title: 'Chores',
  robots: { index: false, follow: false },
}
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fff8e8',
}
export default function ChoresLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="chores-body">{children}</body>
    </html>
  )
}
