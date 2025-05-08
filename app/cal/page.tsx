import React from 'react'
import { Redis } from '@upstash/redis'
import Year from './Year'
import type { BackgroundPattern, Event, ISODateDayString } from './data'
import { toDayString } from './data'
import { PasswordForm } from './password-form'
import { auth, isMax } from '../auth'
import CreateEventForm from './create-event-form'
import { revalidatePath } from 'next/cache'
import { EventList } from './event-list'
import type { Metadata } from 'next'
import Chat from './chat'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Minmax calendar',
  description: '',
}

const redis = Redis.fromEnv()

async function createEvent(formData: FormData): Promise<Boolean> {
  'use server'

  const start = formData.get('startDate')?.toString()
  const end = formData.get('endDate')?.toString()
  const label = formData.get('label')?.toString()
  const color = formData.get('color')?.toString()
  const border = formData.get('border')?.toString()
  const background = formData.get('background')?.toString()

  if (!start || !end || !color) return false

  const existingEvents: Array<Event> | null = await redis.json.get(
    `cal:${process.env.CAL_PASSWORD}`,
  )

  if (!existingEvents) return false

  // Convert any date format to ISODateDayString
  const startDay = toDayString(start)
  const endDay = toDayString(end)

  const newEvents: Array<Event> = [
    {
      start: startDay,
      end: endDay,
      label,
      color,
      border: border as 'solid' | undefined,
      background: background as BackgroundPattern | undefined,
      labelSize: startDay === endDay ? 'small' : undefined,
    },
    // No need to convert existing events as they're already Events with ISODateDayString
    ...existingEvents,
  ]

  await redis.json.set(`cal:${process.env.CAL_PASSWORD}`, '$', newEvents)

  revalidatePath(`/cal`)

  return true
}

async function getEvents(password: string) {
  if (!isMax()) throw new Error('Invalid password.')

  const data: Event[] | null = await redis.json.get(`cal:${password}`)

  if (!data) return []

  return data
}

async function deleteEvent(event: Event) {
  'use server'

  const events: Array<Event> | null = await redis.json.get(
    `cal:${process.env.CAL_PASSWORD}`,
  )

  if (!events) return false

  const index = events.findIndex(
    (evt) =>
      evt.start === event.start &&
      evt.end === event.end &&
      evt.label === event.label &&
      evt.color === event.color &&
      evt.border === event.border &&
      evt.background === event.background &&
      evt.labelSize === event.labelSize,
  )

  if (index === -1) return false

  events.splice(index, 1)
  await redis.json.set(`cal:${process.env.CAL_PASSWORD}`, '$', events)

  revalidatePath(`/cal`)

  return true
}

async function updateEvent(oldEvent: Event, formData: FormData) {
  'use server'

  const start = formData.get('startDate')?.toString()
  const end = formData.get('endDate')?.toString()
  const label = formData.get('label')?.toString()
  const color = formData.get('color')?.toString()
  const border = formData.get('border')?.toString()
  const background = formData.get('background')?.toString()

  if (!start || !end || !color) return false

  const events: Array<Event> | null = await redis.json.get(
    `cal:${process.env.CAL_PASSWORD}`,
  )

  if (!events) return false

  const index = events.findIndex(
    (evt) =>
      evt.start === oldEvent.start &&
      evt.end === oldEvent.end &&
      evt.label === oldEvent.label &&
      evt.color === oldEvent.color &&
      evt.border === oldEvent.border &&
      evt.background === oldEvent.background &&
      evt.labelSize === oldEvent.labelSize,
  )

  if (index === -1) return false

  // Convert any date format to ISODateDayString
  const startDay = toDayString(start)
  const endDay = toDayString(end)

  const updatedEvent: Event = {
    start: startDay,
    end: endDay,
    label,
    color,
    border: border as 'solid' | undefined,
    background: background as BackgroundPattern | undefined,
    labelSize: startDay === endDay ? ('small' as const) : undefined,
  }

  events[index] = updatedEvent

  await redis.json.set(`cal:${process.env.CAL_PASSWORD}`, '$', events)

  revalidatePath(`/cal`)

  return true
}

export default async function Plan() {
  const password = auth()

  if (!password) return <PasswordForm />

  let events: Array<Event> | undefined
  try {
    events = await getEvents(password)
  } catch (err) {
    return <PasswordForm error="Invalid password." />
  }

  return (
    <>
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-x-scroll bg-slate-50 text-slate-900">
        <div className="md:px-16">
          <Year events={events} />
        </div>
      </div>
      <CreateEventForm createEventAction={createEvent} />
      <h2 className="text-lg font-bold mt-24">Chat</h2>
      <Chat />
      <h2 className="text-lg font-bold mt-24">Raw events list (↓ end date)</h2>
      <EventList
        events={events}
        deleteEvent={deleteEvent}
        updateEvent={updateEvent}
      />
    </>
  )
}
