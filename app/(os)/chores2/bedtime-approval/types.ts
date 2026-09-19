import type { BedtimeTemplateKey } from './constants'

export type BedtimeCreationSummary = {
  kidId: string
  kidName: string
  stars: number
  title: string
  template: BedtimeTemplateKey
}

export type BedtimeCreationResult = {
  created: BedtimeCreationSummary[]
  skipped: BedtimeCreationSummary[]
  dayIso: string
}

export type BedtimeActionState =
  | { status: 'idle' }
  | { status: 'success'; result: BedtimeCreationResult }
  | { status: 'error'; message: string }
