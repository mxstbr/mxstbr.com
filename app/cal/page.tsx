import React from 'react'
import { cookies } from 'next/headers'
import { Redis } from '@upstash/redis'

import Year from './Year'
import type { Event } from './data'
import { redirect } from 'next/navigation'
import { PasswordForm } from './password-form'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const redis = Redis.fromEnv()

type RedisEvent = Event & {
  // Dates are stored stringified
  start: string
  end: string
}

async function getEvents(password: string) {
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
  const cookieStore = cookies()
  const password = cookieStore.get('password')

  if (!password) return <PasswordForm />

  let events
  try {
    events = await getEvents(password.value)
  } catch (err) {
    return <PasswordForm error="Invalid password." />
  }

  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-x-scroll">
      <div className="px-16">
        <Year events={events} />
      </div>
    </div>
  )
}
