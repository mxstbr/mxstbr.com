import './chatgpt.css'
import { Inter } from 'next/font/google'
import { ChatGPTAppsSDKUIProvider } from './apps-sdk-ui-provider'

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
        <ChatGPTAppsSDKUIProvider>
          <main className="min-w-0 min-h-screen">{children}</main>
        </ChatGPTAppsSDKUIProvider>
      </body>
    </html>
  )
}
