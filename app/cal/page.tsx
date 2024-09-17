import React from 'react'
import { cookies } from 'next/headers'
import { Redis } from '@upstash/redis'

import Year from './Year'
import type { BackgroundPattern, Event } from './data'
import { redirect } from 'next/navigation'
import { PasswordForm } from './password-form'
import { auth, isMax } from '../auth'
import CreateEventForm from './create-event-form'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const redis = Redis.fromEnv()

type RedisEvent = Event & {
  // Dates are stored stringified
  start: string
  end: string
}

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

  const newEvents: Array<Event> = [
    ...existingEvents,
    {
      start: new Date(start),
      end: new Date(end),
      label,
      color,
      border: border as 'solid' | undefined,
      background: background as BackgroundPattern | undefined,
    },
  ]

  await redis.json.set(`cal:${process.env.CAL_PASSWORD}`, '$', newEvents)

  return true
}

async function getEvents(password: string) {
  if (!isMax()) throw new Error('Invalid password.')

  const data = await redis.json.get(`cal:${password}`)

  return (data as RedisEvent[]).map(
    (event): Event => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
    }),
  )
}

export default async function Plan() {
  const password = auth()

  if (!password) return <PasswordForm />

  let events
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
    </>
  )
}
