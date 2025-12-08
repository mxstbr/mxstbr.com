import { NextResponse } from 'next/server'
import { experimental_generateSpeech as generateSpeech } from 'ai'
import { openai } from '@ai-sdk/openai'
import { isMax } from 'app/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request): Promise<Response> {
  if (!(await isMax())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let text: string | undefined
  try {
    const payload = await request.json()
    text = typeof payload?.text === 'string' ? payload.text.trim() : ''
  } catch {
    text = ''
  }

  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 })
  }

  const truncated = text.slice(0, 140)

  try {
    const result = await generateSpeech({
      model: openai.speech('gpt-4o-mini-tts'),
      text: truncated,
      voice: 'alloy',
      outputFormat: 'mp3',
      language: 'en',
    })

    return new Response(Buffer.from(result.audio.uint8Array), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to generate chore TTS', error)
    return NextResponse.json({ error: 'Failed to generate audio', message }, { status: 500 })
  }
}
