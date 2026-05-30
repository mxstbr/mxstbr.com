import { Redis } from '@upstash/redis'
import { createHash, randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const redis = Redis.fromEnv()

const PENDING_KEY = 'pebble:index:pending'
const DEBUG_LOG_KEY = 'pebble:index:webhook-debug'
const RECORDING_KEY_PREFIX = 'pebble:index:recording:'
const AUDIO_KEY_PREFIX = 'pebble:index:audio:'
const SHA_KEY_PREFIX = 'pebble:index:sha:'
const DEFAULT_MAX_BYTES = 4_000_000
const DEDUPE_TTL_SECONDS = 30 * 24 * 60 * 60
const DEBUG_LOG_LIMIT = 100
const AUDIO_FIELD_KEYS = [
  'audio',
  'recording',
  'file',
  'data',
  'base64',
  'recordingData',
]
const AUTH_TOKEN_HEADER_NAMES = [
  'x-auth-token',
  'x-webhook-token',
  'x-pebble-auth-token',
  'x-pebble-token',
  'x-api-key',
  'x-api-token',
  'x-widget-token',
]
const AUTH_TOKEN_QUERY_PARAM_NAMES = [
  'token',
  'authToken',
  'auth_token',
  'apiKey',
  'api_key',
]

type PayloadSource = 'raw' | 'multipart' | 'json'

type RecordingMetadata = {
  id: string
  status: 'pending'
  createdAt: number
  updatedAt: number
  byteLength: number
  contentType: string
  filename?: string
  sha256: string
  source: PayloadSource
  request: {
    contentLength?: string
    contentType?: string
    userAgent?: string
  }
  fields?: Record<string, string>
}

type ParsedPayload = {
  bytes: Buffer
  contentType: string
  filename?: string
  fields?: Record<string, string>
  source: PayloadSource
}

class WebhookPayloadError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: Record<string, unknown>,
  ) {
    super(message)
  }
}

function recordingKey(id: string) {
  return `${RECORDING_KEY_PREFIX}${id}`
}

function audioKey(id: string) {
  return `${AUDIO_KEY_PREFIX}${id}`
}

function shaKey(sha256: string) {
  return `${SHA_KEY_PREFIX}${sha256}`
}

function getMaxBytes() {
  const configured = Number(process.env.PEBBLE_INDEX_MAX_BYTES)
  if (Number.isFinite(configured) && configured > 0) return configured
  return DEFAULT_MAX_BYTES
}

function getAuthorizationDetails(request: NextRequest) {
  const authorization = request.headers.get('authorization') ?? ''
  const match = authorization.match(/^(\S+)\s+(.+)$/)
  const scheme = match?.[1]
  const authorizationValue = authorization.trim()
  const schemeToken = match?.[2]?.trim() ?? ''
  const rawAuthorizationToken = match ? '' : authorizationValue
  const basicAuthorizationTokens =
    scheme?.toLowerCase() === 'basic'
      ? getBasicAuthorizationTokens(schemeToken)
      : []
  const tokenHeaderName = AUTH_TOKEN_HEADER_NAMES.find((headerName) =>
    request.headers.get(headerName)?.trim(),
  )
  const headerToken = tokenHeaderName
    ? (request.headers.get(tokenHeaderName)?.trim() ?? '')
    : ''
  const queryTokenName = AUTH_TOKEN_QUERY_PARAM_NAMES.find((paramName) =>
    request.nextUrl.searchParams.get(paramName)?.trim(),
  )
  const queryToken = queryTokenName
    ? (request.nextUrl.searchParams.get(queryTokenName)?.trim() ?? '')
    : ''

  return {
    hasAuthorization: Boolean(authorization),
    authorizationLength: authorization.length || undefined,
    scheme,
    tokenCandidates: Array.from(
      new Set([
        schemeToken,
        rawAuthorizationToken,
        ...basicAuthorizationTokens,
        headerToken,
        queryToken,
      ]),
    ).filter(Boolean),
    tokenHeaderName,
    queryTokenName,
    hasQueryToken: Boolean(queryToken),
  }
}

function getBasicAuthorizationTokens(value: string) {
  try {
    const decoded = Buffer.from(value, 'base64').toString('utf8')
    const [username, password] = decoded.split(':', 2)
    return [decoded, username, password].filter(Boolean)
  } catch {
    return []
  }
}

function getRequestLogContext(request: NextRequest) {
  const authorization = getAuthorizationDetails(request)

  return {
    method: request.method,
    contentType: request.headers.get('content-type') ?? undefined,
    contentLength: request.headers.get('content-length') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
    headerNames: Array.from(request.headers.keys()).sort(),
    hasAuthorization: authorization.hasAuthorization,
    authorizationLength: authorization.authorizationLength,
    authorizationScheme: authorization.scheme,
    tokenHeaderName: authorization.tokenHeaderName,
    queryTokenName: authorization.queryTokenName,
    hasQueryToken: authorization.hasQueryToken,
    tokenCandidateCount: authorization.tokenCandidates.length,
  }
}

function logWebhookWarning(
  request: NextRequest,
  reason: string,
  extra?: Record<string, unknown>,
) {
  console.warn('Pebble Index webhook warning', {
    reason,
    ...getRequestLogContext(request),
    ...extra,
  })
}

async function appendDebugEvent(
  request: NextRequest,
  event: Record<string, unknown>,
) {
  try {
    await redis.lpush(DEBUG_LOG_KEY, {
      at: new Date().toISOString(),
      path: request.nextUrl.pathname,
      ...getRequestLogContext(request),
      ...event,
    })
    await redis.ltrim(DEBUG_LOG_KEY, 0, DEBUG_LOG_LIMIT - 1)
  } catch (error) {
    console.error('Failed to persist Pebble Index webhook debug event', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

function getExpectedWebhookTokens() {
  const explicitToken = process.env.PEBBLE_INDEX_WEBHOOK_TOKEN?.trim()
  if (explicitToken) return [explicitToken]

  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!redisToken) return []

  return [
    createHash('sha256').update(`pebble-index:${redisToken}`).digest('hex'),
  ]
}

function validateAuthorization(request: NextRequest) {
  const expectedTokens = getExpectedWebhookTokens()
  if (expectedTokens.length === 0) {
    logWebhookWarning(request, 'missing_webhook_token_env')
    throw new WebhookPayloadError('Webhook token is not configured', 500)
  }

  const authorization = getAuthorizationDetails(request)
  if (
    !authorization.tokenCandidates.some((token) =>
      expectedTokens.includes(token),
    )
  ) {
    logWebhookWarning(request, 'unauthorized')
    throw new WebhookPayloadError('Unauthorized', 401)
  }
}

function validateSize(bytes: Buffer, maxBytes: number) {
  if (bytes.length === 0) {
    throw new WebhookPayloadError('Recording payload is empty', 400)
  }

  if (bytes.length > maxBytes) {
    throw new WebhookPayloadError('Recording payload is too large', 413, {
      byteLength: bytes.length,
      maxBytes,
    })
  }
}

function extractBase64(value: string) {
  const trimmed = value.trim()
  const dataUrlMatch = trimmed.match(/^data:([^;]+);base64,(.+)$/)

  if (dataUrlMatch) {
    return {
      contentType: dataUrlMatch[1],
      value: dataUrlMatch[2],
    }
  }

  return { value: trimmed }
}

function bufferFromBase64(value: string) {
  const parsed = extractBase64(value)
  const bytes = Buffer.from(parsed.value, 'base64')

  if (bytes.length === 0) {
    throw new WebhookPayloadError('Base64 recording payload is empty', 400)
  }

  return {
    bytes,
    contentType: parsed.contentType,
  }
}

function getStringRecordFields(formData: FormData) {
  const fields: Record<string, string> = {}

  for (const [key, value] of Array.from(formData.entries())) {
    if (typeof value === 'string') fields[key] = value
  }

  return fields
}

function omitAudioFields(fields: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(fields).filter(([key]) => !AUDIO_FIELD_KEYS.includes(key)),
  )
}

async function parseMultipartPayload(request: NextRequest, maxBytes: number) {
  const formData = await request.formData()
  const fields = getStringRecordFields(formData)

  for (const [key, value] of Array.from(formData.entries())) {
    if (typeof value === 'string') continue

    const bytes = Buffer.from(await value.arrayBuffer())
    validateSize(bytes, maxBytes)

    return {
      bytes,
      contentType: value.type || 'application/octet-stream',
      filename: value.name || key,
      fields: omitAudioFields(fields),
      source: 'multipart' as const,
    }
  }

  for (const [key, value] of Object.entries(fields)) {
    if (!AUDIO_FIELD_KEYS.includes(key)) continue

    const parsed = bufferFromBase64(value)
    validateSize(parsed.bytes, maxBytes)

    return {
      bytes: parsed.bytes,
      contentType: parsed.contentType ?? 'application/octet-stream',
      filename: fields.filename,
      fields: omitAudioFields(fields),
      source: 'multipart' as const,
    }
  }

  throw new WebhookPayloadError(
    'Multipart payload did not include audio',
    400,
    {
      fieldNames: Object.keys(fields),
    },
  )
}

function findJsonAudioField(body: Record<string, unknown>) {
  for (const key of AUDIO_FIELD_KEYS) {
    const value = body[key]
    if (typeof value === 'string' && value.trim()) return { key, value }
  }

  return undefined
}

async function parseJsonPayload(request: NextRequest, maxBytes: number) {
  const body = (await request.json()) as unknown

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new WebhookPayloadError('JSON payload must be an object', 400)
  }

  const record = body as Record<string, unknown>
  const audioField = findJsonAudioField(record)

  if (!audioField) {
    throw new WebhookPayloadError(
      'JSON payload did not include base64 audio',
      400,
      {
        jsonKeys: Object.keys(record),
      },
    )
  }

  const parsed = bufferFromBase64(audioField.value)
  validateSize(parsed.bytes, maxBytes)

  const fields = Object.fromEntries(
    Object.entries(record)
      .filter(
        ([key, value]) =>
          typeof value === 'string' && !AUDIO_FIELD_KEYS.includes(key),
      )
      .map(([key, value]) => [key, value as string]),
  )

  return {
    bytes: parsed.bytes,
    contentType:
      parsed.contentType ??
      (typeof record.contentType === 'string'
        ? record.contentType
        : typeof record.mimeType === 'string'
          ? record.mimeType
          : 'application/octet-stream'),
    filename: typeof record.filename === 'string' ? record.filename : undefined,
    fields,
    source: 'json' as const,
  }
}

async function parseRawPayload(request: NextRequest, maxBytes: number) {
  const bytes = Buffer.from(await request.arrayBuffer())
  validateSize(bytes, maxBytes)

  return {
    bytes,
    contentType:
      request.headers.get('content-type')?.split(';')[0]?.trim() ||
      'application/octet-stream',
    source: 'raw' as const,
  }
}

async function parsePayload(
  request: NextRequest,
  maxBytes: number,
): Promise<ParsedPayload> {
  const contentLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new WebhookPayloadError('Recording payload is too large', 413, {
      contentLength,
      maxBytes,
    })
  }

  const contentType =
    request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ??
    ''

  if (contentType === 'multipart/form-data') {
    return parseMultipartPayload(request, maxBytes)
  }

  if (contentType === 'application/json') {
    return parseJsonPayload(request, maxBytes)
  }

  return parseRawPayload(request, maxBytes)
}

export async function POST(request: NextRequest) {
  try {
    validateAuthorization(request)

    const payload = await parsePayload(request, getMaxBytes())
    const sha256 = createHash('sha256').update(payload.bytes).digest('hex')
    const dedupeKey = shaKey(sha256)
    const existingId = await redis.get<string>(dedupeKey)

    if (existingId) {
      const existing = await redis.get<RecordingMetadata>(
        recordingKey(existingId),
      )

      if (existing) {
        await appendDebugEvent(request, {
          outcome: 'deduplicated',
          status: existing.status,
          recordingId: existingId,
          byteLength: payload.bytes.length,
          payloadContentType: payload.contentType,
          payloadSource: payload.source,
        })

        return NextResponse.json({
          ok: true,
          id: existingId,
          deduplicated: true,
          status: existing.status,
        })
      }
    }

    const id = `idx_${randomUUID()}`
    const now = Date.now()
    const metadata: RecordingMetadata = {
      id,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      byteLength: payload.bytes.length,
      contentType: payload.contentType,
      filename: payload.filename,
      sha256,
      source: payload.source,
      request: {
        contentLength: request.headers.get('content-length') ?? undefined,
        contentType: request.headers.get('content-type') ?? undefined,
        userAgent: request.headers.get('user-agent') ?? undefined,
      },
      fields: payload.fields,
    }

    await redis.set(audioKey(id), payload.bytes.toString('base64'))
    await redis.set(recordingKey(id), metadata)
    await redis.zadd(PENDING_KEY, { score: now, member: id })
    await redis.set(dedupeKey, id, { ex: DEDUPE_TTL_SECONDS })

    console.log('Pebble Index recording queued', {
      id,
      byteLength: metadata.byteLength,
      contentType: metadata.contentType,
      source: metadata.source,
    })
    await appendDebugEvent(request, {
      outcome: 'queued',
      recordingId: id,
      byteLength: metadata.byteLength,
      payloadContentType: metadata.contentType,
      payloadSource: metadata.source,
    })

    return NextResponse.json({ ok: true, id }, { status: 202 })
  } catch (error) {
    if (error instanceof WebhookPayloadError) {
      if (error.status >= 400 && error.status < 500 && error.status !== 401) {
        logWebhookWarning(request, 'payload_error', {
          error: error.message,
          ...error.details,
        })
      }
      await appendDebugEvent(request, {
        outcome: 'error',
        status: error.status,
        error: error.message,
        details: error.details,
      })

      return NextResponse.json(
        { ok: false, error: error.message },
        { status: error.status },
      )
    }

    console.error('Pebble Index webhook failed', {
      ...getRequestLogContext(request),
      error: error instanceof Error ? error.message : String(error),
    })
    await appendDebugEvent(request, {
      outcome: 'error',
      status: 500,
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      { ok: false, error: 'Failed to queue recording' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  await appendDebugEvent(request, {
    outcome: 'healthcheck',
    status: 200,
  })

  return NextResponse.json({ ok: true })
}
