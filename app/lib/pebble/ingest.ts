import { createHash, createHmac } from 'node:crypto'
import {
  equalSecret,
  secret,
  MAX_AUDIO_BYTES,
  MAX_REQUEST_BYTES,
  MAX_TRANSCRIPT_BYTES,
  RETENTION_SECONDS,
  type Owner,
} from './config'

export class PebbleError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}
export type Recording = {
  id: string
  owner: Owner
  deliveryId: string
  recordedAt: string
  receivedAt: string
  expiresAt: string
  trigger: 'single-click-hold' | 'double-click-hold' | 'test-event'
  isTest: boolean
  transcription?: string
  audio?: { mimeType: 'audio/mp4'; byteLength: number; sha256: string }
}
export type IncomingRecording = { recording: Recording; audioBase64?: string }

async function rawBody(request: Request) {
  if (Number(request.headers.get('content-length')) > MAX_REQUEST_BYTES)
    throw new PebbleError(413, 'Recording is too large')
  const reader = request.body?.getReader()
  if (!reader) throw new PebbleError(400, 'Missing request body')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel()
        throw new PebbleError(413, 'Recording is too large')
      }
      chunks.push(chunk.value)
    }
  } finally {
    reader.releaseLock()
  }
  return Buffer.concat(chunks)
}

// Pebble signs the exact multipart bytes, before parsing. Its signing key is
// the UTF-8 secret as entered (unlike the outbound Standard Webhooks key).
export async function parseRecording(
  request: Request,
  owner: Owner,
  now = Date.now(),
  signingSecret = secret(owner, 'webhook'),
): Promise<IncomingRecording> {
  const headers = request.headers
  const version = headers.get('x-index-webhook-version')
  const timestamp = headers.get('x-index-timestamp') ?? ''
  const deliveryId = headers.get('x-index-delivery') ?? ''
  const trigger = headers.get('x-index-trigger') ?? ''
  const testHeader = headers.get('x-index-test')
  const isTest = testHeader === 'true'
  if (version !== '1')
    throw new PebbleError(400, 'Expected Index webhook version 1')
  if (
    !/^\d{1,12}$/.test(timestamp) ||
    !/^[a-zA-Z0-9_-]{1,128}$/.test(deliveryId) ||
    !['single-click-hold', 'double-click-hold', 'test-event'].includes(
      trigger,
    ) ||
    (testHeader !== null && testHeader !== 'true') ||
    isTest !== (trigger === 'test-event')
  )
    throw new PebbleError(400, 'Invalid Index webhook headers')
  if (Math.abs(now / 1000 - Number(timestamp)) > 300)
    throw new PebbleError(401, 'Expired Index signature')
  const signature = headers.get('x-index-signature') ?? ''
  if (!/^[a-f0-9]{64}$/.test(signature))
    throw new PebbleError(401, 'Missing or invalid Index signature')
  const contentType = headers.get('content-type') ?? ''
  if (!/^multipart\/form-data\s*;/i.test(contentType))
    throw new PebbleError(415, 'Expected multipart/form-data')
  const bytes = await rawBody(request)
  const prefix = `v1\n${timestamp}\n${deliveryId}\n${trigger}\n${isTest ? 1 : 0}\n`
  const expected = createHmac('sha256', signingSecret)
    .update(prefix)
    .update(bytes)
    .digest('hex')
  if (!equalSecret(signature, expected))
    throw new PebbleError(401, 'Invalid Index signature')
  let form: FormData
  try {
    form = await new Response(bytes, {
      headers: { 'Content-Type': contentType },
    }).formData()
  } catch {
    throw new PebbleError(400, 'Invalid multipart body')
  }
  for (const name of ['audio', 'transcription', 'recordedAt', 'client', 'test'])
    if (form.getAll(name).length > 1)
      throw new PebbleError(400, 'Duplicate multipart field')
  const recordedAt = form.get('recordedAt')
  const transcription = form.get('transcription')
  const audio = form.get('audio')
  if (
    form.get('client') !== 'ring' ||
    typeof recordedAt !== 'string' ||
    !/^\d{1,16}$/.test(recordedAt) ||
    !Number.isFinite(new Date(Number(recordedAt)).getTime())
  )
    throw new PebbleError(400, 'Invalid recording metadata')
  if (isTest ? form.get('test') !== 'true' : form.has('test'))
    throw new PebbleError(400, 'Invalid test event')
  if (
    transcription !== null &&
    (typeof transcription !== 'string' ||
      Buffer.byteLength(transcription) > MAX_TRANSCRIPT_BYTES)
  )
    throw new PebbleError(413, 'Transcription is too large or invalid')
  if (
    audio !== null &&
    (typeof audio === 'string' ||
      audio.type !== 'audio/mp4' ||
      audio.size === 0 ||
      audio.size > MAX_AUDIO_BYTES)
  )
    throw new PebbleError(
      400,
      'Expected an M4A audio/mp4 recording, up to 4 MB',
    )
  if (!audio && (typeof transcription !== 'string' || !transcription.trim()))
    throw new PebbleError(400, 'Expected audio or transcription')
  const sizeHeader = headers.get('x-audio-size')
  if (
    sizeHeader !== null &&
    (!audio ||
      typeof audio === 'string' ||
      !/^\d+$/.test(sizeHeader) ||
      Number(sizeHeader) !== audio.size)
  )
    throw new PebbleError(400, 'Audio size does not match')
  const audioBytes =
    audio && typeof audio !== 'string'
      ? Buffer.from(await audio.arrayBuffer())
      : null
  const id = `idx_${createHash('sha256').update(`${owner}:${deliveryId}`).digest('hex')}`
  return {
    recording: {
      id,
      owner,
      deliveryId,
      recordedAt: new Date(Number(recordedAt)).toISOString(),
      receivedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + RETENTION_SECONDS * 1000).toISOString(),
      trigger: trigger as Recording['trigger'],
      isTest,
      ...(typeof transcription === 'string' ? { transcription } : {}),
      ...(audioBytes
        ? {
            audio: {
              mimeType: 'audio/mp4' as const,
              byteLength: audioBytes.length,
              sha256: createHash('sha256').update(audioBytes).digest('hex'),
            },
          }
        : {}),
    },
    ...(audioBytes ? { audioBase64: audioBytes.toString('base64') } : {}),
  }
}
