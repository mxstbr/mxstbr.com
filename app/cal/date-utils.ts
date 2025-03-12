import { ISODateDayString } from './data'

// Helper to parse ISODateDay into year, month, day components
function parseISODateDay(date: string): {
  year: number
  month: number
  day: number
} {
  // If the date has a time component, extract just the date part
  const datePart = date.includes('T') ? date.split('T')[0] : date
  const [year, month, day] = datePart.split('-').map(Number)
  return { year, month, day }
}

// Format a date object as ISODateDayString
export function formatISODateDay(
  year: number,
  month: number,
  day: number,
): ISODateDayString {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` as ISODateDayString
}

// Get current date as ISODateDayString
export function today(): ISODateDayString {
  const now = new Date()
  return formatISODateDay(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

// Get current year
export function getCurrentYear(): number {
  return new Date().getFullYear()
}

// Add days to a date
export function addDays(
  date: ISODateDayString,
  days: number,
): ISODateDayString {
  const { year, month, day } = parseISODateDay(date)
  const newDate = new Date(year, month - 1, day + days)
  return formatISODateDay(
    newDate.getFullYear(),
    newDate.getMonth() + 1,
    newDate.getDate(),
  )
}

// Subtract days from a date
export function subDays(
  date: ISODateDayString,
  days: number,
): ISODateDayString {
  return addDays(date, -days)
}

// Add weeks to a date
export function addWeeks(
  date: ISODateDayString,
  weeks: number,
): ISODateDayString {
  return addDays(date, weeks * 7)
}

// Add months to a date
export function addMonths(
  date: ISODateDayString,
  months: number,
): ISODateDayString {
  const { year, month, day } = parseISODateDay(date)
  const newDate = new Date(year, month - 1 + months, day)
  return formatISODateDay(
    newDate.getFullYear(),
    newDate.getMonth() + 1,
    newDate.getDate(),
  )
}

// Subtract years from a date
export function subYears(
  date: ISODateDayString,
  years: number,
): ISODateDayString {
  const { year, month, day } = parseISODateDay(date)
  return formatISODateDay(year - years, month, day)
}

// Get the day of the month
export function getDate(date: ISODateDayString): number {
  return parseISODateDay(date).day
}

// Get the day of the week (0-6, 0 is Sunday)
export function getDay(date: ISODateDayString): number {
  const { year, month, day } = parseISODateDay(date)
  return new Date(year, month - 1, day).getDay()
}

// Get the year
export function getYear(date: ISODateDayString): number {
  return parseISODateDay(date).year
}

// Check if a date is in the past
export function isPast(date: ISODateDayString): boolean {
  const todayStr = today()
  return isBeforeDay(date, todayStr)
}

// Check if a date is in the future
export function isFuture(date: ISODateDayString): boolean {
  const todayStr = today()
  return isAfterDay(date, todayStr)
}

// Check if a date is today
export function isToday(date: ISODateDayString): boolean {
  return date === today()
}

// Check if a date is a Monday
export function isMonday(date: ISODateDayString): boolean {
  const { year, month, day } = parseISODateDay(date)
  return new Date(year, month - 1, day).getDay() === 1
}

// Check if a date is the first day of the month
export function isFirstDayOfMonth(date: ISODateDayString): boolean {
  return parseISODateDay(date).day === 1
}

// Check if a date is the last day of the month
export function isLastDayOfMonth(date: ISODateDayString): boolean {
  const { year, month, day } = parseISODateDay(date)
  const lastDay = new Date(year, month, 0).getDate()
  return day === lastDay
}

// Get the last day of the month
export function lastDayOfMonth(date: ISODateDayString): ISODateDayString {
  const { year, month } = parseISODateDay(date)
  const lastDay = new Date(year, month, 0).getDate()
  return formatISODateDay(year, month, lastDay)
}

// Get the end of the month
export function endOfMonth(date: ISODateDayString): ISODateDayString {
  return lastDayOfMonth(date)
}

// Get the start of the week (Monday)
export function startOfWeek(date: ISODateDayString): ISODateDayString {
  const { year, month, day } = parseISODateDay(date)
  const dayOfWeek = new Date(year, month - 1, day).getDay()
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Adjust for Monday as first day
  return subDays(date, diff)
}

// Get the end of the week (Sunday)
export function endOfWeek(date: ISODateDayString): ISODateDayString {
  const startOfWeekDate = startOfWeek(date)
  return addDays(startOfWeekDate, 6)
}

// Format a date according to a format string (simplified version)
export function format(date: ISODateDayString, formatStr: string): string {
  const { year, month, day } = parseISODateDay(date)

  // Handle common format patterns
  switch (formatStr) {
    case 'yyyy-MM-dd':
      return formatISODateDay(year, month, day)
    case 'dd':
      return day.toString().padStart(2, '0')
    case 'MM':
      return month.toString().padStart(2, '0')
    case 'MMM':
      return new Date(year, month - 1, day).toLocaleString('en-US', {
        month: 'short',
      })
    case 'yy':
      return year.toString().slice(-2)
    case 'dd MM yyyy':
      return `${day.toString().padStart(2, '0')} ${month.toString().padStart(2, '0')} ${year}`
    default:
      return formatISODateDay(year, month, day)
  }
}

// Check if two dates are equal (ignoring time)
export function isEqualDay(
  date1: ISODateDayString,
  date2: ISODateDayString,
): boolean {
  return date1 === date2
}

// Check if date1 is after date2 (ignoring time)
export function isAfterDay(
  date1: ISODateDayString,
  date2: ISODateDayString,
): boolean {
  const d1 = parseISODateDay(date1)
  const d2 = parseISODateDay(date2)

  if (d1.year !== d2.year) return d1.year > d2.year
  if (d1.month !== d2.month) return d1.month > d2.month
  return d1.day > d2.day
}

// Check if date1 is before date2 (ignoring time)
export function isBeforeDay(
  date1: ISODateDayString,
  date2: ISODateDayString,
): boolean {
  const d1 = parseISODateDay(date1)
  const d2 = parseISODateDay(date2)

  if (d1.year !== d2.year) return d1.year < d2.year
  if (d1.month !== d2.month) return d1.month < d2.month
  return d1.day < d2.day
}

// Check if a date is within an interval
export function isWithinInterval(
  date: ISODateDayString,
  interval: { start: ISODateDayString; end: ISODateDayString },
): boolean {
  return (
    (isEqualDay(date, interval.start) || isAfterDay(date, interval.start)) &&
    (isEqualDay(date, interval.end) || isBeforeDay(date, interval.end))
  )
}

// Get each day of an interval
export function eachDayOfInterval(interval: {
  start: ISODateDayString
  end: ISODateDayString
}): ISODateDayString[] {
  const days: ISODateDayString[] = []
  let currentDate = interval.start

  while (
    isBeforeDay(currentDate, interval.end) ||
    isEqualDay(currentDate, interval.end)
  ) {
    days.push(currentDate)
    currentDate = addDays(currentDate, 1)
  }

  return days
}

// Get the difference in calendar weeks
export function differenceInCalendarWeeks(
  dateLeft: ISODateDayString,
  dateRight: ISODateDayString,
  options?: { weekStartsOn: number },
): number {
  const startLeft = startOfWeek(dateLeft)
  const startRight = startOfWeek(dateRight)

  const days = differenceInCalendarDays(startLeft, startRight)
  return Math.round(days / 7)
}

// Get the difference in calendar days
export function differenceInCalendarDays(
  dateLeft: ISODateDayString,
  dateRight: ISODateDayString,
): number {
  const { year: y1, month: m1, day: d1 } = parseISODateDay(dateLeft)
  const { year: y2, month: m2, day: d2 } = parseISODateDay(dateRight)

  const date1 = new Date(y1, m1 - 1, d1)
  const date2 = new Date(y2, m2 - 1, d2)

  const diffTime = date1.getTime() - date2.getTime()
  return Math.round(diffTime / (1000 * 60 * 60 * 24))
}

// Find the closest date from a list of dates
export function closestTo(
  targetDate: ISODateDayString,
  datesArray: ISODateDayString[],
): ISODateDayString | undefined {
  if (datesArray.length === 0) return undefined

  return datesArray.reduce((closest, date) => {
    const closestDiff = Math.abs(differenceInCalendarDays(targetDate, closest))
    const currentDiff = Math.abs(differenceInCalendarDays(targetDate, date))
    return currentDiff < closestDiff ? date : closest
  }, datesArray[0])
}

// Define an Interval type
export type Interval = {
  start: ISODateDayString
  end: ISODateDayString
}
