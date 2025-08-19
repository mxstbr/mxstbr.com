import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MaxOS',
  description: 'A Windows 98-inspired operating system interface',
  icons: {
    icon: '/static/images/windows_98_icons/windows-0.png',
    apple: '/static/images/windows_98_icons/windows-0.png',
  },
  appleWebApp: {
    title: 'MaxOS',
    statusBarStyle: 'default',
    capable: true,
  },
  manifest: '/os-manifest.json',
}

export default function OSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
