import { addDays, getYear, subDays } from 'date-fns'
// @ts-ignore
import Holidays, { HolidaysTypes } from 'date-holidays'
import { colors, Event } from './data'

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
  ...getFederalHolidays(getYear(Date.now())),
  ...getFederalHolidays(getYear(Date.now()) + 1),
]
  .filter((h) => h.type !== 'optional' && h.type !== 'observance')
  .reduce((holidays: HolidaysTypes.Holiday[], holiday) => {
    // Filter out substituted holidays
    if (holiday.substitute)
      return [
        ...holidays.filter((h) => !holiday.name.includes(h.name)),
        {
          ...holiday,
          name: holiday.name.replace(' (substitute day)', ' (sub)'),
        },
      ]

    // Merge Thanksgiving + "Day after Thanksgiving"
    // by ignoring the "Day after" and adding +1 day to thanksgiving.end
    if (holiday.name.includes('Day after '))
      return holidays.map((h) => {
        if (!h.name.includes('Thanksgiving')) return h

        return {
          ...h,
          // NOTE: We add 2 days here because we always -1 the holiday.end
          // because date-holidays reports the end as Date+1 at midnight
          // instead of Date at 23:59:59 🤦‍♂️
          end: addDays(new Date(h.date), 2),
        }
      })

    return [...holidays, holiday]
  }, [])

export function holidaysToEvents(holidays: HolidaysTypes.Holiday[]): Event[] {
  return holidays.map((holiday) => ({
    start: holiday.start,
    // NOTE: We always -1 the holiday.end because date-holidays
    // reports the end as Date+1 at midnight instead of Date at 23:59:59 🤦‍♂️
    end: subDays(holiday.end, 1),
    label: holiday.name.replace(' Day', ''),
    color: colors.yellow,
    labelSize: 'small',
    background: 'diagonalLines',
  }))
}
