import { formatISODateDay, getCurrentYear } from './date-utils'
import { colors, Event, ISODateDayString } from './data'

// Define a type for birthday entries
type Birthday = {
  name: string
  month: number
  day: number
}

// List of birthdays
export const BIRTHDAYS: Birthday[] = [
  { name: 'Max', month: 1, day: 4 },
  { name: 'Minnie', month: 1, day: 28 },
  { name: 'Bedi', month: 3, day: 16 },
  { name: 'Dad', month: 4, day: 13 },
  { name: 'Dilan', month: 6, day: 12 },
  { name: 'Mom', month: 8, day: 13 },
  { name: 'Darian', month: 8, day: 21 },
  { name: 'Dal', month: 9, day: 24 },
  { name: 'Devina', month: 10, day: 29 },
  { name: 'Zen', month: 11, day: 13 },
  { name: 'Daniel', month: 12, day: 6 },

  { name: 'Mama', month: 11, day: 11 },
  { name: 'Papa', month: 6, day: 1 },
  { name: 'Konstanze', month: 10, day: 19 },
  { name: 'Niki', month: 4, day: 14 },
]

export function birthdaysToEvents(
  years: number[] = [getCurrentYear(), getCurrentYear() + 1],
): Event[] {
  const events: Event[] = []

  // Generate events for each birthday for each year
  years.forEach((year) => {
    BIRTHDAYS.forEach((birthday) => {
      const date = formatISODateDay(year, birthday.month, birthday.day)

      events.push({
        start: date,
        end: date,
        label: `${birthday.name} 🎂`,
        color: colors.yellow,
        labelSize: 'small',
      })
    })
  })

  return events
}
