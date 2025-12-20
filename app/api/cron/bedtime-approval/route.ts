import { NextRequest, NextResponse } from 'next/server'
import { BEDTIME_TEMPLATES } from 'app/(os)/chores/bedtime-approval/constants'
import { formatPacificDate, pacificTimeInMinutes, PACIFIC_TIMEZONE } from 'app/(os)/chores/utils'
import { getBaseUrl } from 'app/lib/base-url'
import { bot } from 'app/lib/telegram'

const pacificDateLabel = new Intl.DateTimeFormat('en-US', {
  timeZone: PACIFIC_TIMEZONE,
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.BEDTIME_CRON_SECRET
  if (!secret) return true

  const header = request.headers.get('authorization')
  if (header === `Bearer ${secret}`) return true

  const urlSecret = request.nextUrl.searchParams.get('token')
  return urlSecret === secret
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const pacificMinutes = pacificTimeInMinutes(new Date())
  const pacificHour = Math.floor(pacificMinutes / 60)
  if (pacificHour !== 5) {
    return NextResponse.json({ ok: false, reason: 'Outside 5am Pacific window' })
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ ok: false, reason: 'Telegram not configured' })
  }

  const baseUrl = await getBaseUrl()
  const approvalUrl = new URL('/chores/bedtime-approval', baseUrl).toString()
  const todayIso = formatPacificDate(new Date())
  const dayLabel = pacificDateLabel.format(new Date())
  const templateLines = BEDTIME_TEMPLATES.map(
    (template) => `${template.emoji} ${template.stars} ⭐️ — ${template.title}`,
  ).join('\n')
  const message = `☀️ Good morning! Time to log bedtime stars for ${dayLabel}.\n\nChoose the kids who earned:\n${templateLines}\n\nOpen the bedtime approval page below to add their morning chores.`

  try {
    await bot.telegram.sendMessage('-4904434425', message, {
      reply_markup: {
        inline_keyboard: [[{ text: 'Open bedtime approval', url: approvalUrl }]],
      },
    })
    return NextResponse.json({ ok: true, day: todayIso })
  } catch (error) {
    console.error('Failed to send bedtime approval reminder', error)
    return NextResponse.json({ ok: false, error: 'Failed to send Telegram message' }, { status: 500 })
  }
}
