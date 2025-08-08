import React from 'react'
import { notFound } from 'next/navigation'
import { isMax } from 'app/auth'
import { Redis } from '@upstash/redis'
import TimezoneClient from './TimezoneClient'

const redis = Redis.fromEnv()

export default async function ReminderPage() {
  if (!isMax()) return notFound()
  const timezone = await redis.get<string>('reminder:timezone')

  return (
    <div className="py-6">
      <TimezoneClient initialTimezone={timezone ?? null} />
    </div>
  )
}
