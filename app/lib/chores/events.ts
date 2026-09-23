import { McpError } from '@modelcontextprotocol/sdk/types.js'
import z from 'zod/v3'
import type { Notification, Repository } from './types'

// Wire contract pinned to the Events WG draft, 6682596 (checked 2026-09-23).
// https://github.com/modelcontextprotocol/experimental-ext-triggers-events
export const CHORE_EVENT = 'chores.notification'
export const EVENT_HISTORY_LIMIT = 5000
export const EVENT_MAX_AGE_MS = 7 * 86400000
export type EventRecord = {
  position: number
  notification: Pick<
    Notification,
    'id' | 'text' | 'createdAt' | 'day' | 'submissionId'
  >
}
export type EventHistory = { head: number; records: EventRecord[] }
export type ReplayFloor = { since: number; through: number }
export const eventArguments = z.object({}).strict()
export const eventParams = z.object({
  name: z.string(),
  arguments: eventArguments.optional().default({}),
  cursor: z.string().max(200).nullable().optional().default(null),
  maxAgeMs: z
    .number()
    .int()
    .nonnegative()
    .max(Number.MAX_SAFE_INTEGER)
    .optional(),
})
export const journalParams = eventParams.extend({
  maxEvents: z
    .number()
    .int()
    .min(1)
    .max(Number.MAX_SAFE_INTEGER)
    .optional()
    .default(50),
})
export const choreEventDescriptor = {
  name: CHORE_EVENT,
  description:
    'The same parent notifications sent to Telegram: chore submissions, completions, reviews, undo, period bonuses and reward redemptions. data.text is the unchanged notification text. Save the cursor and deduplicate by eventId. Up to 5,000 events from the last seven days can be replayed; truncated signals a gap. Read authoritative state with the chores tools.',
  delivery: ['webhook'],
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  payloadSchema: {
    type: 'object',
    properties: {
      notificationId: { type: 'string' },
      text: { type: 'string' },
      day: {
        type: 'string',
        description: 'Pacific occurrence day, when available.',
      },
      submissionId: {
        type: 'string',
        description: 'Exact accepted submission ID, when available.',
      },
    },
    required: ['notificationId', 'text'],
    additionalProperties: false,
  },
}
export function invalidParams() {
  return new McpError(-32602, 'InvalidParams')
}
export function parseEventParams<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown,
): z.output<T> {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw invalidParams()
  return parsed.data
}
export function checkEventName(name: string) {
  if (name !== CHORE_EVENT)
    throw new McpError(-32011, 'NotFound', { kind: 'event' })
}
export function eventCursor(position: number) {
  return Buffer.from(`chores-events-v1:${position}`).toString('base64url')
}
export function cursorPosition(cursor: string) {
  const decoded = Buffer.from(cursor, 'base64url').toString()
  const match = /^chores-events-v1:(0|[1-9][0-9]*)$/.exec(decoded)
  const position = match ? Number(match[1]) : NaN
  if (!Number.isSafeInteger(position) || eventCursor(position) !== cursor)
    throw invalidParams()
  return position
}
export function eventOccurrence(record: EventRecord) {
  const n = record.notification
  return {
    eventId: n.id,
    name: CHORE_EVENT,
    timestamp: n.createdAt,
    data: {
      notificationId: n.id,
      text: n.text,
      ...(n.day ? { day: n.day } : {}),
      ...(n.submissionId ? { submissionId: n.submissionId } : {}),
    },
  }
}

export class ChoreEvents {
  constructor(
    readonly repository: Repository,
    readonly now: () => number = Date.now,
  ) {}

  async read(input: z.input<typeof journalParams>, replayFloor?: ReplayFloor) {
    const params = parseEventParams(journalParams, input)
    checkEventName(params.name)
    const position =
      params.cursor === null ? null : cursorPosition(params.cursor)
    const history = await this.repository.readNotificationEvents(position)
    if (position !== null && position > history.head) throw invalidParams()
    let through = position ?? history.head
    let truncated = false
    let hasMore = false
    const records: EventRecord[] = []
    const floor =
      this.now() -
      Math.min(params.maxAgeMs ?? EVENT_MAX_AGE_MS, EVENT_MAX_AGE_MS)
    if (
      position !== null &&
      (await this.repository.readCore()).notificationsEnabled
    ) {
      const earliest = history.records[0]?.position ?? history.head + 1
      truncated = position < earliest - 1
      for (const record of history.records) {
        const minimumTime =
          replayFloor && record.position <= replayFloor.through
            ? Math.max(floor, replayFloor.since)
            : floor
        if (Date.parse(record.notification.createdAt) < minimumTime) {
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
      events: records.map(eventOccurrence),
      cursor: eventCursor(through),
      truncated,
      hasMore,
      // Delivery adapters need per-occurrence positions, kept inside the delivery adapter.
      records,
      replayFloor: { since: floor, through: history.head },
    }
  }
}
