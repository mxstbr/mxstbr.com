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
  Interval,
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
  isFirstDayOfYear,
} from 'date-fns'
// @ts-ignore
import * as patterns from 'hero-patterns'
import { Event, colors } from './data'
import { PUBLIC_HOLIDAYS, holidaysToEvents } from './public-holidays'

const PUBLIC_HOLIDAY_EVENTS = holidaysToEvents(PUBLIC_HOLIDAYS)

const VISIBLE_QUARTERS = 4
const MONTHS_PER_QUARTER = 3
const DAYS_PER_WEEK = 7
// When does the first quarter start? MM/DD
const FY_START_DAY = '02/01'
// Current FY
let FY_START_DATE = new Date(`${getYear(Date.now())}/${FY_START_DAY}`)
if (isFuture(FY_START_DATE)) FY_START_DATE = subYears(FY_START_DATE, 1)

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
              events={[...events, ...PUBLIC_HOLIDAY_EVENTS]}
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
  startDate: Date
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
              : startOfWeek(addDays(startDate, idx * DAYS_PER_WEEK), {
                  weekStartsOn: 1,
                })

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

function Week(props: { startDate: Date; endDate: Date; events: Array<Event> }) {
  const prefixDays = Math.max(0, getDay(props.startDate) - 1)
  const isStartOfQuarter = prefixDays > 0
  let suffixDays = 6 - getDay(props.endDate)
  const isEndOfQuarter = suffixDays > 0
  // TODO: I don't know why this is necessary.
  if (isEndOfQuarter) suffixDays = suffixDays + 1
  const days = DAYS_PER_WEEK - prefixDays - suffixDays

  return (
    <div className="flex flex-row">
      {arr(prefixDays).map((_, idx) => (
        <DayWrapper key={idx} />
      ))}
      {arr(days).map((_, idx) => (
        <Day
          key={idx}
          index={idx}
          events={props.events}
          day={addDays(props.startDate, idx)}
          isEndOfQuarter={isEndOfQuarter}
          isStartOfQuarter={isStartOfQuarter}
        />
      ))}
    </div>
  )
}

function Day(props: {
  index: number
  day: Date
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

        {/* Labels */}
        {dayEvents
          .filter(
            (evt) =>
              evt.label && isMiddleDayOfLongestWeekInInterval(evt, props.day),
          )
          .map((evt) => {
            // Special case: single day events render at the bottom.
            if (evt.labelSize === 'small') {
              return (
                <span
                  key={evt.label}
                  className="text-xs font-semibold"
                  style={{
                    color: evt.color,
                  }}
                >
                  {evt.label}
                </span>
              )
            }

            return (
              <span
                key={evt.label}
                className={`absolute top-8 z-10 ${
                  isWeekEventDaysEven(evt, props.day)
                    ? 'right-0 translate-x-1/2'
                    : 'left-1/2 -translate-x-1/2'
                } w-max -translate-x-1/2 transform text-center font-medium`}
                style={{
                  color: evt.color,
                }}
              >
                {evt.label}
              </span>
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
  const QUARTER_START_DAYS = [
    FY_START_DATE,
    addMonths(FY_START_DATE, MONTHS_PER_QUARTER),
    addMonths(FY_START_DATE, MONTHS_PER_QUARTER * 2),
    addMonths(FY_START_DATE, MONTHS_PER_QUARTER * 3),
  ].filter((date) => isPast(date))

  // NOTE: The "as Date" is necessary because closestTo can return undefined
  // if an empty array is passed as the second arg. Since this array is never
  // empty, we can safely cast to always be Date.
  return closestTo(new Date(), QUARTER_START_DAYS) as Date
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

      return [...weeks.slice(0, -1), [...(weeks[weeks.length - 1] || []), day]]
    },
    [] as Array<Array<Date>>,
  )
}

function isWeekEventDaysEven(event: Event, day: Date) {
  const weeks = getWeeksWithinInterval(event)

  const week = weeks.find((week) =>
    week
      .map((dayOfTheWeek) => format(dayOfTheWeek, 'dd MM yyyy'))
      .includes(format(day, 'dd MM yyyy')),
  )

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
function isMiddleDayOfLongestWeekInInterval(event: Interval, day: Date) {
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
    longestWeek
      // Format days to days to avoid false negatives with differing time
      .map((dayOfTheWeek) => format(dayOfTheWeek, 'dd MM yyyy'))
      .indexOf(format(day, 'dd MM yyyy')) +
      1 ===
    Math.ceil(longestWeek.length / 2)

  return isMiddleDay
}

/**
 * Returns an Array with the length of num
 */
const arr = (length: number) => new Array(length).fill(undefined)

/**
 * Reimplement isEqual from date-fns to ignore time
 */
function isEqualDay(date1: Date, date2: Date) {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  )
}

/**
 * Returns true if date1 is after date2 while ignoring time
 */
function isAfterDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() > date2.getFullYear() ||
    (date1.getFullYear() === date2.getFullYear() &&
      (date1.getMonth() > date2.getMonth() ||
        (date1.getMonth() === date2.getMonth() &&
          date1.getDate() > date2.getDate())))
  )
}

/**
 * Returns true if date1 is before date2 while ignoring time
 */
function isBeforeDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() < date2.getFullYear() ||
    (date1.getFullYear() === date2.getFullYear() &&
      (date1.getMonth() < date2.getMonth() ||
        (date1.getMonth() === date2.getMonth() &&
          date1.getDate() < date2.getDate())))
  )
}
