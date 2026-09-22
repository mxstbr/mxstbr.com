import {
  CLI_ACTOR_ID,
  PRE_RENAME_NOTIFICATION_PATH,
} from '../app/lib/chores/compatibility'
import nextEnv from '@next/env'
import { randomBytes, createHash, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { Client } from '@upstash/qstash'
import {
  PREFIX,
  RedisRepository,
  redisClient,
} from '../app/lib/chores/repository'
import { ChoresService } from '../app/lib/chores/service'
import { pacificDay } from '../app/lib/chores/time'

nextEnv.loadEnvConfig(process.cwd())
async function main() {
  const [action, arg, option] = process.argv.slice(2)
  const actor = { kind: 'parent' as const, id: CLI_ACTOR_ID }
  if (!action || action === 'help') {
    console.log(
      'chores status | catalog | day YYYY-MM-DD | approvals | command FILE.json [REQUEST_ID] | invite [LABEL] | notifications-setup',
    )
    return
  }
  const redis = redisClient(),
    repository = new RedisRepository(redis),
    service = new ChoresService(repository)
  if (action === 'status') {
    const core = await repository.readCore()
    console.log(
      JSON.stringify(
        {
          version: core.version,
          revision: core.revision,
          migration: core.migration,
          kids: core.kids.map((k) => ({
            id: k.id,
            name: k.name,
            balance: core.balances[k.id],
          })),
          pendingApprovals: Object.keys(core.pending).length,
          notificationVariables: {
            telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN),
            qstash: Boolean(process.env.QSTASH_TOKEN),
            currentSigningKey: Boolean(process.env.QSTASH_CURRENT_SIGNING_KEY),
            nextSigningKey: Boolean(process.env.QSTASH_NEXT_SIGNING_KEY),
          },
        },
        null,
        2,
      ),
    )
    return
  }
  if (action === 'catalog') {
    console.log(JSON.stringify(await service.catalog(actor), null, 2))
    return
  }
  if (action === 'day') {
    console.log(
      JSON.stringify(
        await service.inspect(actor, arg || pacificDay(new Date())),
        null,
        2,
      ),
    )
    return
  }
  if (action === 'approvals') {
    console.log(JSON.stringify(await service.approvals(actor), null, 2))
    return
  }
  if (action === 'command') {
    if (!arg) throw new Error('Pass a JSON file containing one typed command.')
    const requestId = option || randomUUID()
    console.log(
      JSON.stringify(
        {
          requestId,
          result: await service.execute(
            actor,
            requestId,
            JSON.parse(await readFile(arg, 'utf8')),
          ),
        },
        null,
        2,
      ),
    )
    return
  }
  if (action === 'invite') {
    const core = await repository.readCore()
    const code = randomBytes(32).toString('hex')
    await redis.set(
      `${PREFIX}:invite:${createHash('sha256').update(code).digest('hex')}`,
      JSON.stringify({
        label: arg || 'Shared iPad',
        kidIds: core.kids.map((k) => k.id),
      }),
      { ex: 86400 },
    )
    console.log(`https://mxstbr.com/chores/activate#code=${code}`)
    return
  }
  if (action === 'notifications-setup') {
    for (const name of [
      'QSTASH_TOKEN',
      'QSTASH_CURRENT_SIGNING_KEY',
      'QSTASH_NEXT_SIGNING_KEY',
      'TELEGRAM_BOT_TOKEN',
    ])
      if (!process.env[name]) throw new Error(`${name} is not configured.`)
    const client = new Client({ token: process.env.QSTASH_TOKEN! })
    const destination = 'https://mxstbr.com/api/chores/notifications'
    const schedules = await client.schedules.list()
    const retired = schedules.filter(
      (s) =>
        s.destination === `https://mxstbr.com${PRE_RENAME_NOTIFICATION_PATH}`,
    )
    // Create/update the canonical schedule before removing its retired destination.
    const result = await client.schedules.create({
      destination,
      cron: '* * * * *',
      retries: 3,
      timeout: 55,
      scheduleId: 'chores-notification-drain',
    })
    for (const schedule of retired)
      await client.schedules.delete(schedule.scheduleId)
    console.log(
      JSON.stringify(
        {
          scheduleId: result.scheduleId,
          destination,
          reusesExistingAccount: true,
          interval: 'every minute',
        },
        null,
        2,
      ),
    )
    return
  }
  throw new Error('Unknown command. Run chores help.')
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : 'Chores operation failed',
  )
  process.exitCode = 1
})
