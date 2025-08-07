// This route gets posted by the Telegram Bot API when a message is sent to the bot.
import { NextRequest } from 'next/server'
import twilio, { twiml } from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const client = twilio(accountSid, authToken)

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  if (!authHeader.includes(process.env.CRON_SECRET as string)) {
    return new Response('Unauthorized', {
      status: 401,
    })
  }

  // TODO: Make dynamic
  const timezone = 'America/Los_Angeles'
  const now = new Date()
  const nowInTimezone = new Date(
    now.toLocaleString('en-US', { timeZone: timezone }),
  )
  const hour = nowInTimezone.getHours()

  if (hour < 10 || hour > 17) {
    return Response.json({ success: true })
  }

  // This cron job gets called at 25 minutes past the hour, every hour
  // We filter out hours < 10 or > 17 to avoid calling outside of work hours
  // We roll a dice to call on average twice a day
  // With 8 work hours (10-17), we want ~2 calls per day, so ~25% chance per hour
  const diceRoll = Math.random()
  if (diceRoll > 0.25) {
    return Response.json({ success: true })
  }

  const response = new twiml.VoiceResponse().say(
    'Remember not to forget, as Simon would say.',
  )

  await client.calls.create({
    from: process.env.TWILIO_PHONE_NUMBER as string,
    to: process.env.MAX_PHONE_NUMBER as string,
    twiml: response.toString(),
  })

  return Response.json({ success: true })
}
