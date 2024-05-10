import { Redis } from '@upstash/redis'
import { getBlogPosts } from '../../thoughts/utils'
import { NextRequest, NextResponse } from 'next/server'

const redis = Redis.fromEnv()

export const config = {
  runtime: 'edge',
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json()
  const slug = body.slug as string | undefined
  const posts = getBlogPosts()
  if (!slug || !posts.find((post) => post.slug === slug)) {
    return new NextResponse('Slug not found', { status: 400 })
  }

  // Hash the IP and turn it into a hex string
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(req.ip)
  )
  const ip = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const isNew = await redis.set(['deduplicate', ip, slug].join(':'), true, {
    nx: true,
    ex: 24 * 60 * 60,
  })

  if (!isNew) {
    return new NextResponse(null, { status: 202 })
  }

  await redis.incr(['pageviews', 'essay', slug].join(':'))
  return new NextResponse(null, { status: 202 })
}
