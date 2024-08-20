import { Redis } from '@upstash/redis'
import { waitUntil } from '@vercel/functions'
import { NextRequest, NextResponse } from 'next/server'

const redis = Redis.fromEnv()

export const runtime = 'edge'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const referer = req.headers
    .get('referer')
    // Remove trailing slash to normalize
    ?.replace(/\/$/, '')
  if (!referer) return new NextResponse(null, { status: 400 })

  const { pathname } = new URL(referer)

  waitUntil(
    new Promise<void>(async (resolve) => {
      // Hash the IP and turn it into a hex string
      const buf = await crypto.subtle.digest(
        'SHA-256',
        // NOTE: req.ip doesn't work as expected in non-edge runtime.
        new TextEncoder().encode(req.ip),
      )
      const ip = Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      const isNew = await redis.set(
        ['deduplicate', ip, pathname].join(':'),
        true,
        {
          nx: true,
          ex: 24 * 60 * 60,
        },
      )

      // Only actually increment in production
      if (isNew && process.env.NODE_ENV === 'production') {
        await redis.incr(['pageviews', pathname].join(':'))
      }

      resolve()
    }),
  )

  return new NextResponse(null, { status: 202 })
}
