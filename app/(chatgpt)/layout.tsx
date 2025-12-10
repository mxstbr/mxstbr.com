import './chatgpt.css'
import { Inter } from 'next/font/google'
import { AppsSDKUIProvider } from '@openai/apps-sdk-ui/components/AppsSDKUIProvider'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export default async function OSRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.className} text-black`}
      style={{ backgroundColor: '#c0c0c0' }}
    >
      <body
        className="antialiased mx-auto overflow-x-hidden"
        style={{ backgroundColor: '#c0c0c0' }}
      >
        <AppsSDKUIProvider linkComponent={Link}>
          <main className="min-w-0 min-h-screen">{children}</main>
        </AppsSDKUIProvider>
      </body>
    </html>
  )
}
