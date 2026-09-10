import nextEnv from '@next/env'
import { randomBytes, createHash, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { Client } from '@upstash/qstash'
import type { ChoreState } from '../app/(os)/chores/data'
import { migrateLegacy } from '../app/lib/chores2/migration'
import {
  PREFIX,
  RedisRepository,
  redisClient,
} from '../app/lib/chores2/repository'
import { ChoresService } from '../app/lib/chores2/service'
import { pacificDay } from '../app/lib/chores2/time'

nextEnv.loadEnvConfig(process.cwd())
async function main() {
  const [action, arg, option] = process.argv.slice(2)
  const actor = { kind: 'parent' as const, id: 'chores2-cli' }
  if (!action || action === 'help') {
    console.log(
      'chores2 import [--apply] | status | catalog | day YYYY-MM-DD | approvals | command FILE.json [REQUEST_ID] | invite [LABEL] | notifications-setup',
    )
    return
  }
  const redis = redisClient(),
    repository = new RedisRepository(redis),
    service = new ChoresService(repository)
  if (action === 'import') {
    const raw = await redis.json.get('chores:mxstbr:family-board')
    const source = (
      typeof raw === 'string' ? JSON.parse(raw) : raw
    ) as ChoreState
    const imported = migrateLegacy(source, new Date())
    const recorded = Object.values(imported.days).flatMap((d) => d.ledger)
    for (const k of source.kids) {
      const old = source.completions
        .filter((c) => c.kidId === k.id)
        .reduce((sum, c) => sum + c.starsAwarded, 0)
      const next = recorded
        .filter((e) => e.kidId === k.id)
        .reduce((sum, e) => sum + e.amount, 0)
      if (old !== next || old !== imported.core.balances[k.id])
        throw new Error(`Balance mismatch for ${k.name}; import stopped.`)
    }
    const report = {
      ...imported.core.migration,
      historyDays: Object.keys(imported.days).length,
      snapshotBytes: Buffer.byteLength(JSON.stringify(source)),
      sameChores:
        JSON.stringify(source.chores) === JSON.stringify(imported.core.chores),
      sameRewards:
        JSON.stringify(source.rewards) ===
        JSON.stringify(imported.core.rewards),
      destination: PREFIX,
    }
    if (arg !== '--apply') {
      console.log(JSON.stringify({ dryRun: true, ...report }, null, 2))
      return
    }
    const keys = [
      `${PREFIX}:core`,
      `${PREFIX}:legacy-snapshot`,
      ...Object.keys(imported.days).map((d) => `${PREFIX}:day:${d}`),
    ]
    const values = [
      imported.core,
      { importedAt: imported.core.initializedAt, source },
      ...Object.values(imported.days),
    ].map((v) => JSON.stringify(v))
    const outcome = await redis.eval(
      `
if redis.call('EXISTS', KEYS[1]) == 1 then return 0 end
for i, key in ipairs(KEYS) do if redis.call('EXISTS', key) == 1 then return redis.error_reply('Import destination is not empty') end end
for i, key in ipairs(KEYS) do redis.call('SET', key, ARGV[i]) end
return 1`,
      keys,
      values,
    )
    if (Number(outcome) !== 1)
      throw new Error('Chores2 already exists; it was not overwritten.')
    const saved = await repository.readCore()
    if (
      JSON.stringify(saved.balances) !== JSON.stringify(imported.core.balances)
    )
      throw new Error('Post-import balance verification failed.')
    console.log(JSON.stringify({ imported: true, ...report }, null, 2))
    return
  }
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
    console.log(`https://mxstbr.com/chores2/activate#code=${code}`)
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
    const destination = 'https://mxstbr.com/api/chores2/notifications'
    const existing = (await client.schedules.list()).find(
      (s) => s.destination === destination,
    )
    const result = await client.schedules.create({
      destination,
      cron: '* * * * *',
      retries: 3,
      timeout: 55,
      scheduleId: existing?.scheduleId || 'chores2-notification-drain',
    })
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
  throw new Error('Unknown command. Run chores2 help.')
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : 'Chores2 operation failed',
  )
  process.exitCode = 1
})
