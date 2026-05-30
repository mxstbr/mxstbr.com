import env from '@next/env'
import { Redis } from '@upstash/redis'
import { execFile } from 'child_process'
import { constants as fsConstants, promises as fs } from 'fs'
import path from 'path'
import { promisify } from 'util'

const projectDir = process.cwd()
env.loadEnvConfig(projectDir)

const redis = Redis.fromEnv()
const execFileAsync = promisify(execFile)

const PENDING_KEY = 'pebble:index:pending'
const DEBUG_LOG_KEY = 'pebble:index:webhook-debug'
const RECORDING_KEY_PREFIX = 'pebble:index:recording:'
const AUDIO_KEY_PREFIX = 'pebble:index:audio:'
const LOCK_KEY_PREFIX = 'pebble:index:lock:'
const OUTPUT_DIR = '/private/tmp/pebble-index'
const LOCK_TTL_SECONDS = 5 * 60
const DEFAULT_TRANSCRIPTION_TIMEOUT_MS = 5 * 60 * 1000
const MACWHISPER_CLI_CANDIDATES = ['/usr/local/bin/mw', '/opt/homebrew/bin/mw']

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
  transcription?: TranscriptionResult
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
  transcription?: TranscriptionResult
}

type TranscriptionResult =
  | {
      status: 'completed'
      provider: 'macwhisper'
      transcript: string
      transcriptPath: string
      command: string
    }
  | {
      status: 'blocked'
      provider: 'macwhisper'
      error: string
      command?: string
    }

type ClaimOptions = {
  transcribe: boolean
  macwhisperCliPath?: string
  transcriptionTimeoutMs: number
}

type DebugEvent = {
  at: string
  path?: string
  outcome?: string
  status?: number | string
  error?: string
  recordingId?: string
  method?: string
  contentType?: string
  contentLength?: string
  userAgent?: string
  headerNames?: string[]
  hasAuthorization?: boolean
  authorizationLength?: number
  authorizationScheme?: string
  tokenHeaderName?: string
  queryTokenName?: string
  hasQueryToken?: boolean
  tokenCandidateCount?: number
  byteLength?: number
  payloadContentType?: string
  payloadSource?: string
  details?: Record<string, unknown>
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

function getNumberArg(
  args: Map<string, string | boolean>,
  key: string,
): number | undefined {
  const value = Number(getStringArg(args, key))
  return Number.isFinite(value) && value > 0 ? value : undefined
}

function getClaimOptions(args: Map<string, string | boolean>): ClaimOptions {
  const envTimeout = Number(process.env.PEBBLE_INDEX_TRANSCRIPTION_TIMEOUT_MS)
  const transcriptionTimeoutMs =
    getNumberArg(args, 'transcription-timeout-ms') ??
    (Number.isFinite(envTimeout) && envTimeout > 0
      ? envTimeout
      : DEFAULT_TRANSCRIPTION_TIMEOUT_MS)

  return {
    transcribe: args.has('transcribe'),
    macwhisperCliPath:
      getStringArg(args, 'macwhisper-cli') ??
      process.env.MACWHISPER_CLI_PATH?.trim() ??
      undefined,
    transcriptionTimeoutMs,
  }
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

async function isExecutable(filePath: string) {
  try {
    await fs.access(filePath, fsConstants.X_OK)
    return true
  } catch {
    return false
  }
}

async function findExecutable(name: string, candidates: string[]) {
  for (const candidate of candidates) {
    if (await isExecutable(candidate)) return candidate
  }

  for (const directory of (process.env.PATH ?? '').split(path.delimiter)) {
    if (!directory) continue

    const candidate = path.join(directory, name)
    if (await isExecutable(candidate)) return candidate
  }

  return undefined
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

async function transcribeWithMacWhisper(
  id: string,
  localPath: string,
  options: ClaimOptions,
): Promise<TranscriptionResult> {
  const cliPath =
    options.macwhisperCliPath ??
    (await findExecutable('mw', MACWHISPER_CLI_CANDIDATES))

  if (!cliPath) {
    return {
      status: 'blocked',
      provider: 'macwhisper',
      error:
        'MacWhisper CLI `mw` was not found. Install it in MacWhisper > Settings > Advanced > Command-Line Tool.',
    }
  }

  const command = `${cliPath} transcribe ${localPath}`

  try {
    const { stdout, stderr } = await execFileAsync(
      cliPath,
      ['transcribe', localPath],
      {
        timeout: options.transcriptionTimeoutMs,
        maxBuffer: 10 * 1024 * 1024,
      },
    )
    const transcript = stdout.trim()

    if (!transcript) {
      return {
        status: 'blocked',
        provider: 'macwhisper',
        command,
        error: `MacWhisper CLI returned an empty transcript${
          stderr.trim() ? `: ${stderr.trim()}` : ''
        }`,
      }
    }

    const transcriptPath = path.join(OUTPUT_DIR, `${id}.txt`)
    await fs.writeFile(transcriptPath, `${transcript}\n`)

    return {
      status: 'completed',
      provider: 'macwhisper',
      transcript,
      transcriptPath,
      command,
    }
  } catch (error) {
    return {
      status: 'blocked',
      provider: 'macwhisper',
      command,
      error: getErrorMessage(error),
    }
  }
}

async function maybeTranscribeRecording(
  id: string,
  localPath: string,
  options: ClaimOptions,
) {
  if (!options.transcribe) return undefined

  return transcribeWithMacWhisper(id, localPath, options)
}

async function claimRecording(
  id: string,
  options: ClaimOptions,
): Promise<ClaimedRecording | null> {
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
  const transcription = await maybeTranscribeRecording(id, localPath, options)
  const updatedMetadata: RecordingMetadata = {
    ...metadata,
    status: 'claimed',
    attempts: (metadata.attempts ?? 0) + 1,
    claimedAt: now,
    claimedUntil: now + LOCK_TTL_SECONDS * 1000,
    updatedAt: now,
    localPath,
    error: undefined,
    transcription,
  }

  await redis.set(recordingKey(id), updatedMetadata)

  return {
    id,
    localPath,
    byteLength: metadata.byteLength,
    contentType: metadata.contentType,
    createdAt: metadata.createdAt,
    filename: metadata.filename,
    transcription,
  }
}

async function claim(limit: number, options: ClaimOptions) {
  const ids = await redis.zrange<string[]>(
    PENDING_KEY,
    0,
    Math.max(0, limit - 1),
  )
  const recordings: ClaimedRecording[] = []

  for (const id of ids) {
    const recording = await claimRecording(id, options)
    if (recording) recordings.push(recording)
  }

  console.log(JSON.stringify({ ok: true, recordings }, null, 2))
}

async function claimId(id: string, options: ClaimOptions) {
  const recording = await claimRecording(id, options)

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

async function debugLog(limit: number) {
  const events = await redis.lrange<DebugEvent[]>(DEBUG_LOG_KEY, 0, limit - 1)
  console.log(JSON.stringify({ ok: true, events }, null, 2))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const claimOptions = getClaimOptions(args)

  if (args.has('claim')) {
    await claim(getLimit(args), claimOptions)
    return
  }

  if (args.has('debug-log')) {
    await debugLog(getLimit(args))
    return
  }

  const claimedId = getStringArg(args, 'claim-id')
  if (claimedId) {
    await claimId(claimedId, claimOptions)
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
    'Use --claim [--transcribe], --claim-id <id> [--transcribe], --debug-log, --complete <id> --thread-id <id>, or --fail <id>',
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
