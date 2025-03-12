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

/**
 * Creates a URL-safe ID for an event that works with emojis
 * by encoding the label part of the ID
 */
export function createEventId(event: Event): string {
  const baseId = `${event.start}-${event.end}-`
  const labelPart = event.label || 'untitled'

  // Use encodeURIComponent to handle emojis and special characters
  return baseId + encodeURIComponent(labelPart)
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

/**
 * Converts any ISO date format to ISODateDayString format (YYYY-MM-DD)
 * This function handles both ISO date strings with time and ISODateDayString formats
 * and always returns an ISODateDayString
 */
export function toDayString(date: string): ISODateDayString {
  // If the date already doesn't have a time component (no 'T'), it's already a day string
  if (!date.includes('T')) {
    return date as ISODateDayString
  }

  // Otherwise, extract just the date part (before the 'T')
  return date.split('T')[0] as ISODateDayString
}
