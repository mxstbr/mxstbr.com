import React from 'react'
import {
  addMonths,
  format,
  formatISODateDay,
  getDate,
  getDay,
  getYear,
  isAfterDay,
  isBeforeDay,
  isPast,
  isToday,
  today,
} from './date-utils'
// @ts-ignore
import * as patterns from 'hero-patterns'
import { Event, ISODateDayString, createEventId } from './data'
import { PUBLIC_HOLIDAYS, holidaysToEvents } from './public-holidays'
import { BIRTHDAYS, birthdaysToEvents } from './birthdays'

const PUBLIC_HOLIDAY_EVENTS = holidaysToEvents(PUBLIC_HOLIDAYS)
const BIRTHDAY_EVENTS = birthdaysToEvents()

const DAY_ROWS = 31
const MONTH_COLUMNS = 13
const WEEKDAY_LABELS = ['SU', 'M', 'T', 'W', 'R', 'F', 'SA']

export default function Year({ events }: { events: Array<Event> }) {
  const monthStarts = getMonthStarts()
  const startYear = getYear(monthStarts[0])
  const endYear = getYear(monthStarts[monthStarts.length - 1])
  const yearLabel = startYear === endYear ? `${startYear}` : `${startYear}-${endYear}`

  return (
    <div className="py-8">
      <div className="mb-4 text-center text-sm font-semibold tracking-[0.3em] text-slate-500">
        {yearLabel}
      </div>
      <div className="flex flex-row gap-6">
        {monthStarts.map((monthStart) => (
          <MonthColumn
            key={monthStart}
            monthStart={monthStart}
            events={[...events, ...PUBLIC_HOLIDAY_EVENTS, ...BIRTHDAY_EVENTS]}
          />
        ))}
      </div>
    </div>
  )
}

function MonthColumn(props: { monthStart: ISODateDayString; events: Array<Event> }) {
  const { monthStart, events } = props
  const daysInMonth = getDate(lastDayOfMonth(monthStart))
  const monthLabel = format(monthStart, 'MMM').toUpperCase()

  return (
    <div className="min-w-[140px] flex-1">
      <div className="border-b border-slate-400 pb-1 text-center text-xs font-semibold text-slate-600">
        {monthLabel}
      </div>
      <div className="border-t border-slate-400">
        {Array.from({ length: DAY_ROWS }).map((_, index) => {
          const dayNumber = index + 1
          if (dayNumber > daysInMonth) {
            return <EmptyDayRow key={`${monthStart}-empty-${dayNumber}`} />
          }

          const dayDate = formatISODateDay(
            getYear(monthStart),
            parseInt(format(monthStart, 'MM'), 10),
            dayNumber,
          )

          return (
            <DayRow key={dayDate} day={dayDate} events={events} />
          )
        })}
      </div>
    </div>
  )
}

function DayRow(props: { day: ISODateDayString; events: Array<Event> }) {
  const { day, events } = props
  const dayEvents = events.filter(
    (event) =>
      !isAfterDay(event.start, day) && !isBeforeDay(event.end, day),
  )
  const dayOfWeek = getDay(day)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  return (
    <div
      className={`flex min-h-[30px] items-stretch gap-2 border-b border-slate-300 px-2 py-1 text-[11px] text-slate-700 ${
        isWeekend ? 'bg-slate-100' : 'bg-white'
      } ${isPast(day) && !isToday(day) ? 'opacity-30' : ''}`}
    >
      <div className="w-9 shrink-0 text-[10px] font-semibold uppercase text-slate-500">
        <div>{format(day, 'dd')}</div>
        <div>{WEEKDAY_LABELS[dayOfWeek]}</div>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        {dayEvents.map((event) => (
          <EventBlock
            key={`${createEventId(event)}-${day}`}
            day={day}
            event={event}
          />
        ))}
      </div>
    </div>
  )
}

function EmptyDayRow() {
  return (
    <div className="flex min-h-[28px] border-b border-slate-200 bg-white px-2 py-1" />
  )
}

function EventBlock(props: { day: ISODateDayString; event: Event }) {
  const { event } = props
  const backgroundPattern =
    event.background && patterns[event.background]
      ? patterns[event.background](event.color, 0.25)
      : undefined
  const backgroundColor = event.background
    ? undefined
    : withAlpha(event.color, 0.12)

  return (
    <div
      className="flex min-h-[22px] w-full items-center rounded-[2px] border px-1 py-0.5 text-[10px] font-semibold leading-tight text-slate-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]"
      style={{
        borderColor: event.color,
        background: backgroundPattern,
        backgroundColor,
      }}
    >
      <span className="truncate">{event.label}</span>
    </div>
  )
}

function getMonthStarts() {
  const current = today()
  const startOfCurrentMonth = formatISODateDay(
    getYear(current),
    parseInt(format(current, 'MM'), 10),
    1,
  )

  return Array.from({ length: MONTH_COLUMNS }).map((_, index) =>
    addMonths(startOfCurrentMonth, index),
  )
}

function lastDayOfMonth(date: ISODateDayString) {
  const year = getYear(date)
  const month = parseInt(format(date, 'MM'), 10)
  const lastDay = new Date(year, month, 0).getDate()
  return formatISODateDay(year, month, lastDay)
}

function withAlpha(color: string, alpha: number) {
  if (!color.startsWith('#') || color.length !== 7) return color
  const alphaHex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')
  return `${color}${alphaHex}`
}
