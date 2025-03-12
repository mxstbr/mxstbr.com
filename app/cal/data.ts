// TODO: Add more pre-selected colors
export const colors = {
  blue: '#3b82f6',
  yellow: '#eab308',
  pink: '#ec4899',
  green: '#22c55e',
  red: '#ef4444',
  gray: '#e5e7eb',
  black: '#6b7280',
}

type Color = keyof typeof colors

// Allowlist of patterns that work well at small size from heropatterns.com
export type BackgroundPattern =
  | 'architect'
  | 'texture'
  | 'charlieBrown'
  | 'hexagons'
  | 'bamboo'
  | 'corkScrew'
  | 'tinyCheckers'
  | 'heavyRain'
  | 'flippedDiamonds'
  | 'morphingDiamonds'
  | 'boxes'
  | 'zigZag'
  | 'diagonalLines'
  | 'eyes'
  | 'polkaDots'

export type Border = 'solid'

export type ISODateDayString = `${number}-${number}-${number}`

export type Event = {
  start: ISODateDayString
  end: ISODateDayString
  color: string
  background?: BackgroundPattern
  border?: Border
  label?: string
  labelSize?: 'small'
}

// Add this new type for Redis storage
export type ISODateString =
  `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z`

export type RedisEvent = Omit<Event, 'start' | 'end'> & {
  start: ISODateString | ISODateDayString
  end: ISODateString | ISODateDayString
}

export function toDayString(date: ISODateString | ISODateDayString) {
  return date.split('T')[0] as ISODateDayString
}
