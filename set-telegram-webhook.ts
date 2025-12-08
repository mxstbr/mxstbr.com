import { Telegraf } from 'telegraf'
import env from '@next/env'

const projectDir = process.cwd()
env.loadEnvConfig(projectDir)

async function main() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const secretToken = process.env.TELEGRAM_SECRET_TOKEN
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || 'https://mxstbr.com/api/telegram'

  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN environment variable is required')
  }

  if (!secretToken) {
    throw new Error('TELEGRAM_SECRET_TOKEN environment variable is required')
  }

  const bot = new Telegraf(botToken)

  try {
    const result = await bot.telegram.setWebhook(webhookUrl, {
      secret_token: secretToken,
    })

    console.log('Webhook set successfully!')
    console.log('Webhook URL:', webhookUrl)
    console.log('Result:', result)

    // Verify the webhook was set
    const webhookInfo = await bot.telegram.getWebhookInfo()
    console.log('\nWebhook info:')
    console.log(JSON.stringify(webhookInfo, null, 2))
  } catch (error) {
    console.error('Error setting webhook:', error)
    process.exit(1)
  }
}

main()

