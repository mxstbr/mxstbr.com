import twilio from 'twilio'
import { NextResponse } from 'next/server'
import { clippy } from 'app/lib/clippy-agent'

const { MessagingResponse } = twilio.twiml

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const rawBody = await req.text()

  const twilioSignature = req.headers.get('x-twilio-signature') || ''

  const forwardedProto = req.headers.get('x-forwarded-proto')
  const forwardedHost = req.headers.get('x-forwarded-host')
  const host = forwardedHost || req.headers.get('host') || ''
  const proto = forwardedProto || 'https'

  // Get the path and query string from the request
  const url = new URL(req.url, `${proto}://${host}`)
  const absoluteUrl = url.toString()

  const authToken = process.env.TWILIO_AUTH_TOKEN || ''
  if (!authToken)
    return NextResponse.json(
      { error: 'Missing TWILIO_AUTH_TOKEN' },
      { status: 500 },
    )

  // Parse the form data for validation
  const formData = Object.fromEntries(new URLSearchParams(rawBody))

  // Use the standard validateRequest with parsed parameters
  const isValid = twilio.validateRequest(
    authToken,
    twilioSignature,
    absoluteUrl,
    formData,
  )
  if (!isValid)
    return NextResponse.json(
      { error: 'Invalid Twilio signature' },
      { status: 403 },
    )

  const params = new URLSearchParams(rawBody)
  const messageBody = params.get('Body') || ''

  const aiResult = await clippy.generate({
    messages: [
      {
        role: 'system',
        content:
          'This message was sent via SMS and you will respond via SMS. Keep your response below 1600 characters (extended SMS messaging limit).',
      },
      { role: 'user', content: messageBody },
    ],
  })
  const replyText = aiResult.text ?? String(aiResult)

  const twiml = new MessagingResponse()
  twiml.message(replyText)

  return new Response(twiml.toString(), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}
