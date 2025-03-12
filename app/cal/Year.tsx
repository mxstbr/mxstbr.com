import React from 'react'
import {
  addDays,
  addWeeks,
  format,
  getDate,
  isFirstDayOfMonth,
  isPast,
  isWithinInterval,
  subDays,
  eachDayOfInterval,
  isMonday,
  isToday,
  isLastDayOfMonth,
  getYear,
  isFuture,
  subYears,
  differenceInCalendarWeeks,
  lastDayOfMonth,
  closestTo,
  addMonths,
  startOfWeek,
  differenceInCalendarDays,
  getDay,
  endOfWeek,
  endOfMonth,
  Interval,
  formatISODateDay,
  today,
  isEqualDay,
  isAfterDay,
  isBeforeDay,
} from './date-utils'
// @ts-ignore
import * as patterns from 'hero-patterns'
import { Event, colors, ISODateDayString, createEventId } from './data'
import { PUBLIC_HOLIDAYS, holidaysToEvents } from './public-holidays'
import { BIRTHDAYS, birthdaysToEvents } from './birthdays'

// Get public holiday events
const PUBLIC_HOLIDAY_EVENTS = holidaysToEvents(PUBLIC_HOLIDAYS)

// Get birthday events
const BIRTHDAY_EVENTS = birthdaysToEvents()

const VISIBLE_QUARTERS = 4
const MONTHS_PER_QUARTER = 3
const DAYS_PER_WEEK = 7
// When does the first quarter start? MM/DD
const FY_START_MONTH = 1
const FY_START_DAY = 1
// Current FY
let FY_START_DATE = formatISODateDay(
  getCurrentYear(),
  FY_START_MONTH,
  FY_START_DAY,
)
if (isFuture(FY_START_DATE)) FY_START_DATE = subYears(FY_START_DATE, 1)

// Helper function to get current year
function getCurrentYear(): number {
  return new Date().getFullYear()
}

export default function Year({ events }: { events: Array<Event> }) {
  const firstVisibleQuarterStartDate = getFirstVisibleQuarterStartDate()
  return (
    <>
      <div className="flex flex-row space-x-8">
        {arr(VISIBLE_QUARTERS).map((_, idx) => {
          const startDate = addMonths(firstVisibleQuarterStartDate, idx * 3)
          const endDate = lastDayOfMonth(addMonths(startDate, 2))
          const weeks =
            differenceInCalendarWeeks(endDate, startDate, {
              weekStartsOn: 1,
            }) + 1

          return (
            <Quarter
              key={idx}
              events={[...events, ...PUBLIC_HOLIDAY_EVENTS, ...BIRTHDAY_EVENTS]}
              startDate={startDate}
              weeks={weeks}
            />
          )
        })}
      </div>
    </>
  )
}

function Quarter(props: {
  startDate: ISODateDayString
  weeks: number
  events: Array<Event>
}) {
  const quarterNo =
    ((differenceInCalendarWeeks(props.startDate, FY_START_DATE, {
      weekStartsOn: 1,
    }) /
      13) %
      4) +
    1

  const { weeks, startDate, events } = props

  return (
    <div className="flex flex-col">
      <h2 className="mb-4 text-center text-3xl font-bold">Q{quarterNo}</h2>
      <div className="border-2">
        {arr(weeks).map((_, idx) => {
          const weekStartDate =
            idx === 0
              ? addDays(startDate, idx * DAYS_PER_WEEK)
              : startOfWeek(addDays(startDate, idx * DAYS_PER_WEEK))

          return (
            <Week
              key={idx}
              events={events}
              startDate={weekStartDate}
              endDate={
                idx === weeks - 1
                  ? endOfMonth(weekStartDate)
                  : endOfWeek(weekStartDate)
              }
            />
          )
        })}
      </div>
    </div>
  )
}

function Week(props: {
  startDate: ISODateDayString
  endDate: ISODateDayString
  events: Array<Event>
}) {
  // For a standard week, we want to show 7 days (Monday through Sunday)
  // If we're at the start of a quarter, we might need to add empty cells for days before the quarter starts
  // If we're at the end of a quarter, we might need to add empty cells for days after the quarter ends

  // Get the day of week for the start date (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const startDayOfWeek = getDay(props.startDate)

  // Calculate prefix days - how many empty cells we need before the first day
  // If startDayOfWeek is 1 (Monday), we need 0 prefix days
  // If startDayOfWeek is 2 (Tuesday), we need 1 prefix day, etc.
  const prefixDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1
  const isStartOfQuarter = prefixDays > 0

  // Get the day of week for the end date
  const endDayOfWeek = getDay(props.endDate)

  // Calculate suffix days - how many empty cells we need after the last day
  // If endDayOfWeek is 0 (Sunday), we need 0 suffix days
  // If endDayOfWeek is 6 (Saturday), we need 1 suffix day, etc.
  let suffixDays = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek
  const isEndOfQuarter = suffixDays > 0

  // Calculate how many actual days we need to display
  // Start with the difference between end and start dates, plus 1 to include both start and end
  const daysBetween =
    differenceInCalendarDays(props.endDate, props.startDate) + 1

  // Ensure we don't exceed 7 days total in a week
  const daysToShow = Math.min(daysBetween, DAYS_PER_WEEK - prefixDays)

  return (
    <div className="flex flex-row">
      {/* Render empty cells for days before the start date */}
      {Array.from({ length: prefixDays }).map((_, idx) => (
        <DayWrapper key={`prefix-${idx}`} />
      ))}

      {/* Render actual days */}
      {Array.from({ length: daysToShow }).map((_, idx) => (
        <Day
          key={`day-${idx}`}
          index={idx}
          events={props.events}
          day={addDays(props.startDate, idx)}
          isEndOfQuarter={isEndOfQuarter}
          isStartOfQuarter={isStartOfQuarter}
        />
      ))}

      {/* Render empty cells for days after the end date if needed */}
      {isEndOfQuarter &&
        Array.from({ length: suffixDays }).map((_, idx) => (
          <DayWrapper key={`suffix-${idx}`} />
        ))}
    </div>
  )
}

function Day(props: {
  index: number
  day: ISODateDayString
  events: Array<Event>
  isEndOfQuarter: boolean
  isStartOfQuarter: boolean
}) {
  const { events } = props

  const dayOfTheMonth = getDate(props.day)
  const dayEvents = events.filter(
    (event) =>
      isEqualDay(props.day, event.start) ||
      isEqualDay(props.day, event.end) ||
      (isAfterDay(props.day, event.start) && isBeforeDay(props.day, event.end)),
  )

  let borders = dayEvents
    .filter((event) => !!event.border)
    .reduce(
      (borders, event) => {
        let { top, bottom, left, right } = borders

        // TOP border: If 7 days ago isn't in the same event
        if (
          !isWithinInterval(subDays(props.day, 7), {
            start: event.start,
            end: event.end,
          })
        ) {
          top.push(event.color)
        }

        // LEFT border: is first in event
        // TODO: Only render first in row if event doesn't "connect" visually to previous week
        if (isEqualDay(props.day, event.start)) {
          left.push(event.color)
        }

        // BOTTOM border: if in 7 days  isn't in the same event
        if (
          !isWithinInterval(addDays(props.day, 7), {
            start: event.start,
            end: event.end,
          })
        ) {
          bottom.push(event.color)
        }

        // RIGHT border: is last in event
        // TODO: Only render lsat in row if event doesn't "connect" visually to next week
        if (isEqualDay(props.day, event.end)) {
          right.push(event.color)
        }

        return {
          top,
          bottom,
          left,
          right,
        }
      },
      { top: [], bottom: [], left: [], right: [] } as BorderProps,
    )

  // Month divider borders
  if (
    borders.right.length === 0 &&
    isLastDayOfMonth(props.day) &&
    props.index !== 6 &&
    !props.isEndOfQuarter
  ) {
    borders.right = [...borders.right, 'black']
  }
  if (
    borders.left.length === 0 &&
    props.isStartOfQuarter &&
    isFirstDayOfMonth(props.day)
  ) {
    borders.left = [...borders.left, 'black']
  }
  if (borders.top.length === 0 && dayOfTheMonth <= 7) {
    // TODO: End of month border needs to be border-bottom
    borders.top = [...borders.top, 'black']
  }

  return (
    <DayWrapper
      style={{
        background: dayEvents
          .filter((evt) => !!evt.background)
          .map((evt) => patterns[evt.background](evt.color, 0.5))
          .join(', '),
      }}
    >
      <div
        className={`absolute bottom-0 left-0 right-0 top-0 flex flex-col justify-between p-2 box-border ${isPast(props.day) && !isToday(props.day) ? 'opacity-20' : ''}`}
      >
        {/* Borders */}
        <Borders {...borders} />

        {/* Day number */}
        <span className={`text-sm opacity-75`}>
          <span
            className={
              isToday(props.day)
                ? 'bg-red-500 text-white px-1 py-0.5 rounded-md'
                : ''
            }
          >
            {isFirstDayOfMonth(props.day) ? (
              <>
                <strong>
                  {format(props.day, 'MMM')}
                  {format(props.day, 'MMM') === 'Jan'
                    ? ` ${format(props.day, 'yy')}`
                    : ''}
                </strong>
                <br />
              </>
            ) : (
              format(props.day, 'dd')
            )}
          </span>
        </span>

        {/* Modified Labels section */}
        {dayEvents
          .filter(
            (evt) =>
              evt.label && isMiddleDayOfLongestWeekInInterval(evt, props.day),
          )
          .map((evt) => {
            const eventId = createEventId(evt)

            // Special case: single day events render at the bottom.
            if (evt.labelSize === 'small') {
              return (
                <a
                  key={evt.label}
                  href={`#${eventId}`}
                  className="text-xs font-semibold no-underline"
                  style={{
                    color: evt.color,
                  }}
                >
                  {evt.label}
                </a>
              )
            }

            return (
              <a
                key={evt.label}
                href={`#${eventId}`}
                className={`absolute top-8 z-10 no-underline ${
                  isWeekEventDaysEven(evt, props.day)
                    ? 'right-0 translate-x-1/2'
                    : 'left-1/2 -translate-x-1/2'
                } w-max text-center font-medium`}
                style={{
                  color: evt.color,
                }}
              >
                {evt.label}
              </a>
            )
          })}
      </div>
    </DayWrapper>
  )
}

function DayWrapper(props: any) {
  return <div {...props} className={`relative px-9 py-11`} />
}

function Cross() {
  return (
    <svg
      fill="#000"
      version="1.1"
      viewBox="0 0 490 490"
      xmlSpace="preserve"
      preserveAspectRatio="none"
      className="absolute bottom-0 left-0 right-0 top-0 h-full w-full z-20"
    >
      <path d="M456.851 0L245 212.564 33.149 0 0.708 32.337 212.669 245.004 0.708 457.678 33.149 490 245 277.443 456.851 490 489.292 457.678 277.331 245.004 489.292 32.337z"></path>
    </svg>
  )
}

type BorderProps = {
  top: Array<string>
  bottom: Array<string>
  left: Array<string>
  right: Array<string>
}

const DEFAULT_BORDER_COLOR = colors['gray']

function Borders(props: BorderProps) {
  const top = props.top.length > 0 ? props.top : [DEFAULT_BORDER_COLOR]
  const bottom = props.bottom.length > 0 ? props.bottom : [DEFAULT_BORDER_COLOR]
  const left = props.left.length > 0 ? props.left : [DEFAULT_BORDER_COLOR]
  const right = props.right.length > 0 ? props.right : [DEFAULT_BORDER_COLOR]

  return (
    <>
      {top.length > 0 && (
        <svg
          className="absolute left-0 right-0 top-0 h-0.5"
          style={{
            width: `100%`,
            // Gray borders need to be below colored borders
            zIndex: top.length === 1 && top[0] === DEFAULT_BORDER_COLOR ? 0 : 1,
          }}
        >
          {top.map((color, index) => (
            <line
              key={index}
              x1="100%"
              y1="0%"
              x2="0%"
              y2="100%"
              stroke={color}
              strokeWidth={5}
              strokeDasharray={
                // TODO: Figure this out
                top.length > 1 ? `5,${5 * (top.length - 1)}` : undefined
              }
              strokeDashoffset={5 * index}
              width="100%"
            />
          ))}
        </svg>
      )}
      {bottom.length > 0 && (
        <svg
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{
            width: `100%`,
            // Gray borders need to be below colored borders
            zIndex:
              bottom.length === 1 && bottom[0] === DEFAULT_BORDER_COLOR ? 0 : 1,
          }}
        >
          {bottom.map((color, index) => (
            <line
              key={index}
              x1="100%"
              y1="0%"
              x2="0%"
              y2="100%"
              stroke={color}
              strokeWidth={5}
              strokeDasharray={
                // TODO: Figure this out
                bottom.length > 1 ? `5,${5 * (bottom.length - 1)}` : undefined
              }
              strokeDashoffset={5 * index}
              width="100%"
              height="4"
            />
          ))}
        </svg>
      )}
      {left.length > 0 && (
        <svg
          className="absolute bottom-0 left-0 top-0 w-0.5"
          style={{
            height: `100%`,
            // Gray borders need to be below colored borders
            zIndex:
              left.length === 1 && left[0] === DEFAULT_BORDER_COLOR ? 0 : 1,
          }}
        >
          {left.map((color, index) => (
            <line
              key={index}
              x1="100%"
              y1="0%"
              x2="0%"
              y2="100%"
              stroke={color}
              strokeWidth={5}
              strokeDasharray={
                // TODO: Figure this out
                left.length > 1 ? `5,${5 * (left.length - 1)}` : undefined
              }
              strokeDashoffset={5 * index}
              height="100%"
              width="4"
            />
          ))}
        </svg>
      )}
      {right.length > 0 && (
        <svg
          className="absolute bottom-0 right-0 top-0 w-0.5"
          style={{
            height: `100%`,
            // Gray borders need to be below colored borders
            zIndex:
              right.length === 1 && right[0] === DEFAULT_BORDER_COLOR ? 0 : 1,
          }}
        >
          {right.map((color, index) => (
            <line
              key={index}
              x1="100%"
              y1="0%"
              x2="0%"
              y2="100%"
              stroke={color}
              strokeWidth={5}
              strokeDasharray={
                // TODO: Figure this out
                right.length > 1 ? `5,${5 * (right.length - 1)}` : undefined
              }
              strokeDashoffset={5 * index}
              height="100%"
              width="4"
            />
          ))}
        </svg>
      )}
    </>
  )
}

function getFirstVisibleQuarterStartDate() {
  // Define the start dates for each quarter based on the fiscal year start date
  const QUARTER_START_DAYS = [
    FY_START_DATE,
    addMonths(FY_START_DATE, MONTHS_PER_QUARTER),
    addMonths(FY_START_DATE, MONTHS_PER_QUARTER * 2),
    addMonths(FY_START_DATE, MONTHS_PER_QUARTER * 3),
  ]

  // Get today's date
  const currentDate = today()

  // Find the most recent quarter start date (the one that's in the past or today)
  const pastQuarters = QUARTER_START_DAYS.filter(
    (date) => !isAfterDay(date, currentDate),
  )

  // If no quarters are in the past, use the first quarter
  if (pastQuarters.length === 0) {
    return QUARTER_START_DAYS[0]
  }

  // Otherwise, use the most recent quarter
  return pastQuarters[pastQuarters.length - 1]
}

function getWeeksWithinInterval(interval: Interval) {
  return eachDayOfInterval({
    start: interval.start,
    end: interval.end,
  }).reduce(
    (weeks, day) => {
      if (isMonday(day)) {
        return [...weeks, [day]]
      }

      // If there are no weeks yet or the current week is empty, start a new week
      if (weeks.length === 0 || weeks[weeks.length - 1].length === 0) {
        return [[day]]
      }

      // Otherwise, add the day to the current week
      return [...weeks.slice(0, -1), [...weeks[weeks.length - 1], day]]
    },
    [] as Array<Array<ISODateDayString>>,
  )
}

function isWeekEventDaysEven(event: Event, day: ISODateDayString) {
  const weeks = getWeeksWithinInterval(event)

  const week = weeks.find((week) => week.includes(day))

  if (!week)
    throw new Error(
      `Event ${
        event.label || event.start
      } has day ${day} that isn't within the event days. What!`,
    )

  return week.length % 2 === 0
}

/**
 * Check whether a day is the middle day of the longest continuous sequence of days in a visual row for a specific event
 */
function isMiddleDayOfLongestWeekInInterval(
  event: Interval,
  day: ISODateDayString,
) {
  const weeks = getWeeksWithinInterval(event)

  const longestWeek = weeks.sort((a, b) => b.length - a.length)[0]

  const isInLongestWeek = isWithinInterval(day, {
    start: longestWeek[0],
    end: longestWeek[longestWeek.length - 1],
  })

  if (!isInLongestWeek) return false

  const isMiddleDay =
    // Even length: [1,2,3,4].indexOf(2) = 1 + 1; length / 2 = 2
    // Uneven length: [1,2,3,4,5].indexOf(3) = 2 + 1; length / 2 = 2.5; Math.ceil(2.5) = 3
    longestWeek.indexOf(day) + 1 === Math.ceil(longestWeek.length / 2)

  return isMiddleDay
}

/**
 * Returns an Array with the length of num
 */
const arr = (length: number) => {
  // Ensure length is a positive integer
  const safeLength = Math.max(0, Math.floor(length))
  return new Array(safeLength).fill(undefined)
}
