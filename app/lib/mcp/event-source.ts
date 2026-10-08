// Minimal journal contract shared by chores and Pebble. Durable delivery state
// stays in each source's own namespace; existing chores keys never move.
export type Occurrence = {
  eventId: string
  name: string
  timestamp: string
  data: Record<string, unknown>
}
export type ReplayFloor = { since: number; through: number }
export type JournalInput = {
  name: string
  arguments?: Record<string, never>
  cursor?: string | null
  maxAgeMs?: number
  maxEvents?: number
}
export interface WebhookEventSource<R extends { position: number }> {
  name: string
  enabled(): Promise<boolean>
  occurrence(record: R): Occurrence
  cursor(position: number): string
  position(cursor: string): number
  read(
    input: JournalInput,
    floor?: ReplayFloor,
  ): Promise<{
    records: R[]
    cursor: string
    truncated: boolean
    replayFloor: ReplayFloor
  }>
}
