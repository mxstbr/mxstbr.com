import { auth } from 'app/auth'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const password = auth()

  return new NextResponse((password === process.env.CAL_PASSWORD).toString(), {
    status: 200,
  })
}
