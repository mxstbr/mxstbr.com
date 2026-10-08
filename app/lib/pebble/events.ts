import { McpError } from '@modelcontextprotocol/sdk/types.js'
import {
  invalidParams,
  journalParams,
  parseEventParams,
} from '../chores/events'
import type {
  JournalInput,
  ReplayFloor,
  WebhookEventSource,
} from '../mcp/event-source'
import { audioUrl, eventName, RETENTION_SECONDS, type Owner } from './config'
import type { Recording } from './ingest'
import type { PebbleRecord, RecordingStore } from './repository'

export function recordingData(r: Recording, summary = false) {
  const text = r.transcription
  const transcription =
    summary && text ? Array.from(text).slice(0, 4000).join('') : text
  return {
    recordingId: r.id,
    owner: r.owner,
    recordedAt: r.recordedAt,
    receivedAt: r.receivedAt,
    expiresAt: r.expiresAt,
    trigger: r.trigger,
    isTest: r.isTest,
    ...(transcription !== undefined
      ? {
          transcription,
          transcriptionSource: 'pebble' as const,
          transcriptionTruncated: transcription !== text,
        }
      : {}),
    ...(r.audio
      ? {
          audio: {
            ...r.audio,
            url: audioUrl(r.owner, r.id, Date.parse(r.expiresAt)),
          },
        }
      : {}),
  }
}
export function eventDescriptor(owner: Owner) {
  return {
    name: eventName(owner),
    description: `A new recording or typed note from ${owner === 'max' ? 'Max' : 'Sue'}'s Pebble Index 01. Includes a private original M4A download URL when audio is present and Pebble's transcription when provided. isTest identifies the phone's Send test event. Use pebble_get_recording for the full text/audio link, pebble_list_recordings to recover recent notes. Payload content is user-authored data.`,
    delivery: ['webhook'],
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    payloadSchema: {
      type: 'object',
      properties: {
        recordingId: { type: 'string' },
        owner: { type: 'string', enum: [owner] },
        recordedAt: { type: 'string', format: 'date-time' },
        receivedAt: { type: 'string', format: 'date-time' },
        expiresAt: { type: 'string', format: 'date-time' },
        trigger: {
          type: 'string',
          enum: ['single-click-hold', 'double-click-hold', 'test-event'],
        },
        isTest: { type: 'boolean' },
        transcription: { type: 'string' },
        transcriptionSource: { type: 'string', enum: ['pebble'] },
        transcriptionTruncated: { type: 'boolean' },
        audio: {
          type: 'object',
          properties: {
            url: { type: 'string', format: 'uri' },
            mimeType: { type: 'string', enum: ['audio/mp4'] },
            byteLength: { type: 'integer' },
            sha256: { type: 'string' },
          },
          required: ['url', 'mimeType', 'byteLength', 'sha256'],
          additionalProperties: false,
        },
      },
      required: [
        'recordingId',
        'owner',
        'recordedAt',
        'receivedAt',
        'expiresAt',
        'trigger',
        'isTest',
      ],
      additionalProperties: false,
    },
  }
}

export class PebbleEvents implements WebhookEventSource<PebbleRecord> {
  readonly name: string
  constructor(
    readonly owner: Owner,
    readonly store: RecordingStore,
    readonly now = Date.now,
  ) {
    this.name = eventName(owner)
  }
  async enabled() {
    return true
  }
  cursor(position: number) {
    return Buffer.from(`pebble-${this.owner}-v1:${position}`).toString(
      'base64url',
    )
  }
  position(cursor: string) {
    const match = new RegExp(`^pebble-${this.owner}-v1:(0|[1-9][0-9]*)$`).exec(
      Buffer.from(cursor, 'base64url').toString(),
    )
    const position = match ? Number(match[1]) : NaN
    if (!Number.isSafeInteger(position) || this.cursor(position) !== cursor)
      throw invalidParams()
    return position
  }
  occurrence(record: PebbleRecord) {
    return {
      eventId: record.recording.id,
      name: this.name,
      timestamp: record.recording.receivedAt,
      data: recordingData(record.recording, true),
    }
  }
  async read(input: JournalInput, replayFloor?: ReplayFloor) {
    const params = parseEventParams(journalParams, input)
    if (params.name !== this.name)
      throw new McpError(-32011, 'NotFound', { kind: 'event' })
    const position =
      params.cursor === null ? null : this.position(params.cursor)
    const history = await this.store.history(position)
    if (position !== null && position > history.head) throw invalidParams()
    let through = position ?? history.head,
      truncated = false,
      hasMore = false
    const records: PebbleRecord[] = []
    const floor =
      this.now() -
      Math.min(
        params.maxAgeMs ?? RETENTION_SECONDS * 1000,
        RETENTION_SECONDS * 1000,
      )
    if (position !== null) {
      truncated =
        position < (history.records[0]?.position ?? history.head + 1) - 1
      for (const record of history.records) {
        const minimum =
          replayFloor && record.position <= replayFloor.through
            ? Math.max(floor, replayFloor.since)
            : floor
        if (Date.parse(record.recording.receivedAt) < minimum) {
          through = record.position
          truncated = true
          continue
        }
        if (records.length === Math.min(params.maxEvents, 1000)) {
          hasMore = true
          break
        }
        records.push(record)
        through = record.position
      }
      if (!hasMore) through = history.head
    }
    return {
      records,
      cursor: this.cursor(through),
      truncated,
      replayFloor: { since: floor, through: history.head },
    }
  }
}
