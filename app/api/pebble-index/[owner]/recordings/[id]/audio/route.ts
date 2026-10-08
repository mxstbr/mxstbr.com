import { audioAuthorized, isOwner } from 'app/lib/pebble/config'
import { recordingStore } from 'app/lib/pebble/runtime'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
async function audio(
  request: Request,
  context: { params: Promise<{ owner: string; id: string }> },
) {
  const { owner, id } = await context.params
  if (!isOwner(owner) || !/^idx_[a-f0-9]{64}$/.test(id))
    return new Response('Not found', { status: 404 })
  try {
    if (!audioAuthorized(owner, id, request))
      return new Response('Unauthorized', { status: 401 })
    const store = recordingStore(owner),
      recording = await store.recording(id)
    if (!recording?.audio || Date.parse(recording.expiresAt) <= Date.now())
      return new Response('Recording not found or expired', { status: 404 })
    const headers = {
      'Content-Type': recording.audio.mimeType,
      'Content-Length': String(recording.audio.byteLength),
      'Content-Disposition': `attachment; filename="${id}.m4a"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    }
    if (request.method === 'HEAD') return new Response(null, { headers })
    const encoded = await store.audio(id)
    if (!encoded) return new Response('Recording expired', { status: 404 })
    return new Response(Buffer.from(encoded, 'base64'), { headers })
  } catch {
    return new Response('Recording temporarily unavailable', { status: 503 })
  }
}
export { audio as GET, audio as HEAD }
