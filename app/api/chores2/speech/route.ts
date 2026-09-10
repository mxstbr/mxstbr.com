import { experimental_generateSpeech as generateSpeech } from 'ai'
import { openai } from '@ai-sdk/openai'
import { requireDevice, verifySameOrigin } from 'app/lib/chores2/auth'
import { choresService } from 'app/lib/chores2/runtime'
import { fail } from 'app/lib/chores2/types'
import { errorResponse } from '../http'

export async function POST(request: Request) {
  try {
    verifySameOrigin(request)
    const actor = await requireDevice()
    const input = await request.json()
    const b = await choresService().getBoard(actor)
    const chore = b.kids
      .flatMap((k) => [...k.chores, ...k.bonus])
      .find((c) => c.occurrenceId === input.occurrenceId)
    if (!chore)
      fail('UNAVAILABLE', 'Only a currently open chore can be read aloud.')
    const result = await generateSpeech({
      model: openai.speech('gpt-4o-mini-tts'),
      text: chore.title,
      voice: 'alloy',
      outputFormat: 'mp3',
      language: 'en',
    })
    return new Response(Buffer.from(result.audio.uint8Array), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
