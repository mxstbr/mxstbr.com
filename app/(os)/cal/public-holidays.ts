import {
  getCurrentYear,
  addDays,
  subDays,
  formatISODateDay,
} from './date-utils'
// @ts-ignore
import Holidays, { HolidaysTypes } from 'date-holidays'
import { colors, Event, ISODateDayString, toDayString } from './data'

// Define a custom type for our modified holiday object
type ModifiedHoliday = Omit<HolidaysTypes.Holiday, 'start' | 'end'> & {
  start: ISODateDayString
  end: ISODateDayString
}

function getFederalHolidays(year: number) {
  const CAHolidays = new Holidays('US', 'CA').getHolidays(year)
  const DEHolidays = new Holidays('US', 'DE').getHolidays(year)

  // Filter holidays that are present in both states to only get federal holidays
  const federalHolidays = CAHolidays.filter((holiday1) =>
    DEHolidays.some((holiday2) => holiday1.name === holiday2.name),
  )

  return federalHolidays
}

export const PUBLIC_HOLIDAYS = [
  ...getFederalHolidays(getCurrentYear()),
  ...getFederalHolidays(getCurrentYear() + 1),
]
  .filter((h) => h.type !== 'optional' && h.type !== 'observance')
  .map((holiday) => {
    // Convert Date objects to ISODateDayString first
    return {
      ...holiday,
      start: formatISODateDay(
        holiday.start.getFullYear(),
        holiday.start.getMonth() + 1,
        holiday.start.getDate(),
      ),
      end: formatISODateDay(
        holiday.end.getFullYear(),
        holiday.end.getMonth() + 1,
        holiday.end.getDate(),
      ),
    }
  })
  .reduce((holidays: ModifiedHoliday[], holiday) => {
    // Filter out substituted holidays
    if (holiday.substitute) {
      const baseName = holiday.name.replace(' (substitute day)', '')
      const holidayYear = new Date(holiday.start).getFullYear()

      return [
        ...holidays.filter((h) => {
          // Keep the holiday if it's not the original version from the same year
          if (h.name !== baseName) return true

          // Get the year from the holiday start date (now always an ISODateDayString)
          const hYear = new Date(h.start).getFullYear()

          return hYear !== holidayYear
        }),
        {
          ...holiday,
          name: holiday.name.replace(' (substitute day)', ' (sub)'),
        },
      ]
    }

    // Merge Thanksgiving + "Day after Thanksgiving"
    // by ignoring the "Day after" and adding +1 day to thanksgiving.end
    if (holiday.name.includes('Day after '))
      return holidays.map((h) => {
        if (!h.name.includes('Thanksgiving')) return h

        // Already have ISODateDayString
        const holidayDate = new Date(h.date)
        const endDate = addDays(
          formatISODateDay(
            holidayDate.getFullYear(),
            holidayDate.getMonth() + 1,
            holidayDate.getDate(),
          ),
          2,
        )

        return {
          ...h,
          end: endDate,
        }
      })

    // Regular holidays (already converted to ISODateDayString)
    return [
      ...holidays,
      {
        ...holiday,
      },
    ]
  }, [])

export function holidaysToEvents(holidays: ModifiedHoliday[]): Event[] {
  return holidays.map((holiday) => {
    // NOTE: We always -1 the holiday.end because date-holidays
    // reports the end as Date+1 at midnight instead of Date at 23:59:59 🤦‍♂️
    const endISOString = subDays(holiday.end, 1)

    return {
      start: holiday.start,
      end: endISOString,
      label: holiday.name.replace(' Day', ''),
      color: colors.yellow,
      labelSize: 'small',
      background: 'diagonalLines',
    }
  })
}
