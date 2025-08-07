import { serve } from '@upstash/workflow/nextjs'
import { Receiver } from '@upstash/qstash'
import twilio, { twiml } from 'twilio'

export const { POST } = serve(
  async (context) => {
    const shouldCall = await context.run('decide-to-call', async () => {
      const timezone = 'America/Los_Angeles'
      const now = new Date()
      const nowInTimezone = new Date(
        now.toLocaleString('en-US', { timeZone: timezone }),
      )
      const hour = nowInTimezone.getHours()

      if (hour < 10 || hour > 17) return false

      const diceRoll = Math.random()
      return diceRoll <= 0.25
    })

    if (!shouldCall) {
      return
    }

    const delaySeconds = await context.run(
      'random-delay-within-hour',
      async () => {
        const timezone = 'America/Los_Angeles'
        const now = new Date()
        const nowInTimezone = new Date(
          now.toLocaleString('en-US', { timeZone: timezone }),
        )

        const endOfHour = new Date(nowInTimezone)
        endOfHour.setMinutes(59, 59, 999)
        const remainingMs = Math.max(
          0,
          endOfHour.getTime() - nowInTimezone.getTime(),
        )
        const remainingSeconds = Math.floor(remainingMs / 1000)

        const randomSeconds = Math.floor(Math.random() * (remainingSeconds + 1))
        return randomSeconds
      },
    )

    await context.sleep('sleep-random-delay', delaySeconds)

    const voiceTwiml = await context.run('build-voice-response', () => {
      const response = new twiml.VoiceResponse().say(
        'Remember not to forget, as Simon would say.',
      )
      return response.toString()
    })

    await context.run('twilio-call', async () => {
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID as string,
        process.env.TWILIO_AUTH_TOKEN as string,
      )

      await client.calls.create({
        from: process.env.TWILIO_PHONE_NUMBER as string,
        to: process.env.MAX_PHONE_NUMBER as string,
        twiml: voiceTwiml,
      })
    })
  },
  {
    receiver: new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY as string,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY as string,
    }),
  },
)
