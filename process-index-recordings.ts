import env from '@next/env'
import { Redis } from '@upstash/redis'
import { promises as fs } from 'fs'
import path from 'path'

const projectDir = process.cwd()
env.loadEnvConfig(projectDir)

const redis = Redis.fromEnv()

const PENDING_KEY = 'pebble:index:pending'
const RECORDING_KEY_PREFIX = 'pebble:index:recording:'
const AUDIO_KEY_PREFIX = 'pebble:index:audio:'
const LOCK_KEY_PREFIX = 'pebble:index:lock:'
const OUTPUT_DIR = '/private/tmp/pebble-index'
const LOCK_TTL_SECONDS = 5 * 60

type RecordingStatus = 'pending' | 'claimed' | 'thread_created' | 'failed'

type RecordingMetadata = {
  id: string
  status: RecordingStatus
  createdAt: number
  updatedAt: number
  byteLength: number
  contentType: string
  filename?: string
  sha256: string
  source: 'raw' | 'multipart' | 'json'
  attempts?: number
  claimedAt?: number
  claimedUntil?: number
  localPath?: string
  threadId?: string
  completedAt?: number
  failedAt?: number
  error?: string
  request?: {
    contentLength?: string
    contentType?: string
    userAgent?: string
  }
  fields?: Record<string, string>
}

type ClaimedRecording = {
  id: string
  localPath: string
  byteLength: number
  contentType: string
  createdAt: number
  filename?: string
}

function recordingKey(id: string) {
  return `${RECORDING_KEY_PREFIX}${id}`
}

function audioKey(id: string) {
  return `${AUDIO_KEY_PREFIX}${id}`
}

function lockKey(id: string) {
  return `${LOCK_KEY_PREFIX}${id}`
}

function parseArgs(argv: string[]) {
  const args = new Map<string, string | boolean>()

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (!arg.startsWith('--')) continue

    const [rawKey, inlineValue] = arg.slice(2).split('=', 2)
    if (inlineValue !== undefined) {
      args.set(rawKey, inlineValue)
      continue
    }

    const next = argv[index + 1]
    if (next && !next.startsWith('--')) {
      args.set(rawKey, next)
      index++
    } else {
      args.set(rawKey, true)
    }
  }

  return args
}

function getStringArg(
  args: Map<string, string | boolean>,
  key: string,
): string | undefined {
  const value = args.get(key)
  return typeof value === 'string' ? value : undefined
}

function getLimit(args: Map<string, string | boolean>) {
  const value = Number(getStringArg(args, 'limit') ?? '3')
  if (Number.isFinite(value) && value > 0) return Math.floor(value)
  return 3
}

function getFileExtension(metadata: RecordingMetadata) {
  const filenameExtension = metadata.filename
    ? path.extname(metadata.filename)
    : ''

  if (filenameExtension) return filenameExtension
  if (metadata.contentType.includes('m4a')) return '.m4a'
  if (metadata.contentType.includes('mp4')) return '.m4a'
  if (metadata.contentType.includes('mpeg')) return '.mp3'
  if (metadata.contentType.includes('wav')) return '.wav'
  return '.m4a'
}

async function writeRecordingFile(
  metadata: RecordingMetadata,
  encodedAudio: string,
) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  const outputPath = path.join(
    OUTPUT_DIR,
    `${metadata.id}${getFileExtension(metadata)}`,
  )

  await fs.writeFile(outputPath, Buffer.from(encodedAudio, 'base64'))
  return outputPath
}

async function claimRecording(id: string): Promise<ClaimedRecording | null> {
  const lockAcquired = await redis.set(lockKey(id), String(Date.now()), {
    nx: true,
    ex: LOCK_TTL_SECONDS,
  })

  if (!lockAcquired) return null

  const metadata = await redis.get<RecordingMetadata>(recordingKey(id))
  const encodedAudio = await redis.get<string>(audioKey(id))

  if (!metadata || !encodedAudio) {
    await redis.zrem(PENDING_KEY, id)
    await redis.del(lockKey(id))
    console.error('Pebble Index recording missing metadata or audio', { id })
    return null
  }

  if (metadata.status === 'thread_created') {
    await redis.zrem(PENDING_KEY, id)
    await redis.del(lockKey(id))
    return null
  }

  const now = Date.now()
  const localPath = await writeRecordingFile(metadata, encodedAudio)
  const updatedMetadata: RecordingMetadata = {
    ...metadata,
    status: 'claimed',
    attempts: (metadata.attempts ?? 0) + 1,
    claimedAt: now,
    claimedUntil: now + LOCK_TTL_SECONDS * 1000,
    updatedAt: now,
    localPath,
    error: undefined,
  }

  await redis.set(recordingKey(id), updatedMetadata)

  return {
    id,
    localPath,
    byteLength: metadata.byteLength,
    contentType: metadata.contentType,
    createdAt: metadata.createdAt,
    filename: metadata.filename,
  }
}

async function claim(limit: number) {
  const ids = await redis.zrange<string[]>(
    PENDING_KEY,
    0,
    Math.max(0, limit - 1),
  )
  const recordings: ClaimedRecording[] = []

  for (const id of ids) {
    const recording = await claimRecording(id)
    if (recording) recordings.push(recording)
  }

  console.log(JSON.stringify({ ok: true, recordings }, null, 2))
}

async function claimId(id: string) {
  const recording = await claimRecording(id)

  console.log(
    JSON.stringify(
      { ok: true, recordings: recording ? [recording] : [] },
      null,
      2,
    ),
  )
}

async function complete(id: string, threadId: string) {
  const metadata = await redis.get<RecordingMetadata>(recordingKey(id))
  const now = Date.now()

  if (metadata) {
    await redis.set(recordingKey(id), {
      ...metadata,
      status: 'thread_created',
      threadId,
      completedAt: now,
      updatedAt: now,
      error: undefined,
    } satisfies RecordingMetadata)
  }

  await redis.zrem(PENDING_KEY, id)
  await redis.del(audioKey(id))
  await redis.del(lockKey(id))
  console.log(JSON.stringify({ ok: true, id, status: 'thread_created' }))
}

async function fail(id: string, message: string) {
  const metadata = await redis.get<RecordingMetadata>(recordingKey(id))
  const now = Date.now()

  if (metadata) {
    await redis.set(recordingKey(id), {
      ...metadata,
      status: 'failed',
      failedAt: now,
      updatedAt: now,
      error: message,
    } satisfies RecordingMetadata)
  }

  await redis.del(lockKey(id))
  console.log(JSON.stringify({ ok: true, id, status: 'failed' }))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.has('claim')) {
    await claim(getLimit(args))
    return
  }

  const claimedId = getStringArg(args, 'claim-id')
  if (claimedId) {
    await claimId(claimedId)
    return
  }

  const completeId = getStringArg(args, 'complete')
  if (completeId) {
    const threadId =
      getStringArg(args, 'thread-id') ?? getStringArg(args, 'threadId')
    if (!threadId) throw new Error('--complete requires --thread-id')
    await complete(completeId, threadId)
    return
  }

  const failedId = getStringArg(args, 'fail')
  if (failedId) {
    await fail(failedId, getStringArg(args, 'message') ?? 'Unknown failure')
    return
  }

  throw new Error(
    'Use --claim, --claim-id <id>, --complete <id> --thread-id <id>, or --fail <id>',
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
