import { Redis } from '@upstash/redis'
import { waitUntil } from '@vercel/functions'
import { NextRequest, NextResponse } from 'next/server'

const redis = Redis.fromEnv()

export const runtime = 'edge'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json()
  const slug = body.slug as string | undefined
  if (!slug) {
    return new NextResponse('Slug not found', { status: 400 })
  }

  waitUntil(
    new Promise<void>(async (resolve) => {
      // Hash the IP and turn it into a hex string
      const buf = await crypto.subtle.digest(
        'SHA-256',
        // NOTE: req.ip doesn't work as expected in non-edge runtime.
        new TextEncoder().encode(req.ip)
      )
      const ip = Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      const isNew = await redis.set(['deduplicate', ip, slug].join(':'), true, {
        nx: true,
        ex: 24 * 60 * 60,
      })

      if (isNew) {
        await redis.incr(['pageviews', 'essay', slug].join(':'))
      }

      resolve()
    })
  )

  return new NextResponse(null, { status: 202 })
}
