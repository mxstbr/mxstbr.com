import { after } from 'next/server'
import { isOwner } from 'app/lib/pebble/config'
import { parseRecording, PebbleError } from 'app/lib/pebble/ingest'
import { pebbleWebhooks, recordingStore } from 'app/lib/pebble/runtime'

export const runtime = 'nodejs'
export const maxDuration = 60
export async function POST(
  request: Request,
  context: { params: Promise<{ owner: string }> },
) {
  const { owner } = await context.params
  if (!isOwner(owner)) return new Response('Not found', { status: 404 })
  try {
    if (
      process.env.NODE_ENV === 'production' &&
      new URL(request.url).protocol !== 'https:'
    )
      throw new PebbleError(400, 'HTTPS is required')
    const input = await parseRecording(request, owner)
    const result = await recordingStore(owner).accept(input)
    after(async () => {
      try {
        await pebbleWebhooks(owner).drain()
      } catch {
        console.error('Pebble event delivery deferred to the scheduled drain')
      }
    })
    return Response.json(
      { ok: true, ...result, isTest: input.recording.isTest },
      {
        status: result.duplicate ? 200 : 202,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof PebbleError
            ? error.message
            : 'Recording could not be saved; retry from Pebble Recent runs.',
      },
      {
        status: error instanceof PebbleError ? error.status : 503,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  }
}
