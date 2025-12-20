import { headers } from 'next/headers'

export async function getBaseUrl(): Promise<string> {
  if (process.env.SITE_URL) return process.env.SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`

  const headerList = await headers()
  const forwardedProto = headerList.get('x-forwarded-proto') ?? 'https'
  const forwardedHost = headerList.get('x-forwarded-host')
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`

  const host = headerList.get('host')
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  if (host) return `${proto}://${host}`

  return 'http://localhost:3000'
}
