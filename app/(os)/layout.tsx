import '../global.css'
import { GeistSans } from 'geist/font/sans'
import { Analytics } from '@vercel/analytics/react'
import Script from 'next/script'
import { ReportView } from '../components/report-view'
import { PasswordForm } from './components/password-form'
import { auth } from '../auth'

const inter = GeistSans

export default async function OSRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const password = await auth()
  const isAuthorized = password === process.env.CAL_PASSWORD

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
        <main className="min-w-0 min-h-screen">
          {isAuthorized ? (
            children
          ) : (
            <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-slate-50/70 via-white to-slate-100/80">
              <PasswordForm
                error={password ? 'Invalid password.' : undefined}
                defaultPassword={password}
              />
            </div>
          )}
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
