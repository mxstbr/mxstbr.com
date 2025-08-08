import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'
import { isMax } from 'app/auth'

const redis = Redis.fromEnv()

export const runtime = 'edge'

export async function GET() {
  if (!isMax()) return new NextResponse('Unauthorized', { status: 401 })
  const timezone = await redis.get<string>('reminder:timezone')
  return NextResponse.json({ timezone })
}

export async function POST(req: Request) {
  if (!isMax()) return new NextResponse('Unauthorized', { status: 401 })

  let timezone: unknown
  try {
    const body = await req.json()
    timezone = (body as any)?.timezone
  } catch (_) {
    // ignore
  }

  if (typeof timezone !== 'string' || !timezone) {
    return NextResponse.json({ error: 'Missing timezone' }, { status: 400 })
  }

  await redis.set('reminder:timezone', timezone)

  return NextResponse.json({ ok: true })
}
