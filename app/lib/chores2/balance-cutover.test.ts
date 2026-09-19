import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import nextEnv from '@next/env'
import { fixture } from './fixtures'
import { cutoverBalances, planBalanceCutover } from './balance-cutover'
import { redisClient, PREFIX } from './repository'
import { pacificDay } from './time'
import type { Day } from './types'
import type { ChoreState } from '../../(os)/chores2/data'

const sourceFor = (kids: ChoreState['kids']) => ({
  kids,
  completions: [
    { kidId: 'kid-1', starsAwarded: 50 },
    { kidId: 'kid-1', starsAwarded: -75 },
    { kidId: 'kid-2', starsAwarded: 400 },
    { kidId: 'kid-3', starsAwarded: 390 },
  ] as ChoreState['completions'],
})

test('cutover includes negative balances and reward debits exactly once; rejects mismatched kids or invalid stars', () => {
  const { core } = fixture()
  const source = sourceFor(core.kids)
  const plan = planBalanceCutover(source, core)
  assert.deepEqual(plan.sourceBalances, {
    'kid-1': -25,
    'kid-2': 400,
    'kid-3': 390,
  })
  assert.deepEqual(
    plan.kids.map((k) => k.after),
    [-25, 400, 390],
  )
  assert.throws(
    () => planBalanceCutover({ ...source, kids: source.kids.slice(1) }, core),
    /Kid IDs/,
  )
  source.completions[0].starsAwarded = NaN
  assert.throws(() => planBalanceCutover(source, core), /Invalid legacy/)
})

test(
  'Redis balance cutover is atomic and idempotent, preserving catalogs, history and new-board activity',
  { skip: process.env.CHORES2_REDIS_TEST !== '1' },
  async () => {
    nextEnv.loadEnvConfig(process.cwd())
    const redis = redisClient(),
      prefix = `${PREFIX}:verify:cutover:${randomUUID()}`
    const sourceKey = `${prefix}:legacy`,
      coreKey = `${prefix}:core`,
      dayKey = `${prefix}:day:${pacificDay(new Date())}`
    const { core } = fixture(),
      source = sourceFor(core.kids)
    const auditKeys = [
      `${prefix}:cutover:2026-09-19:initial`,
      `${prefix}:cutover:2026-09-19:final`,
    ]
    try {
      await redis.json.set(sourceKey, '$', source)
      await redis.set(coreKey, JSON.stringify(core))
      // RedisJSON can serialize identical objects in a different field order
      // on each read. Force that mismatch between our snapshot and Lua commit.
      const evaluate = redis.eval.bind(redis)
      redis.eval = (async (script, keys, args) => {
        const value = await evaluate(script, keys, args)
        if (script.includes("return {redis.call('JSON.GET'")) {
          const snapshot = value as (string | null)[]
          const parsed = JSON.parse(snapshot[0]!)
          snapshot[0] = JSON.stringify({
            completions: parsed.completions,
            kids: parsed.kids,
          })
        }
        return value
      }) as typeof redis.eval
      const options = { redis, prefix, sourceKey }
      const dry = await cutoverBalances({ ...options, phase: 'initial' })
      assert.equal('dryRun' in dry, true)
      assert.equal(await redis.get(coreKey), JSON.stringify(core))
      await assert.rejects(
        cutoverBalances({ ...options, phase: 'final', apply: true }),
        /initial snapshot/,
      )
      const results = await Promise.all(
        Array.from({ length: 3 }, () =>
          cutoverBalances({ ...options, phase: 'initial', apply: true }),
        ),
      )
      assert.equal(results.filter((r) => 'applied' in r).length, 1)
      const after = JSON.parse((await redis.get<string>(coreKey))!)
      assert.deepEqual(after, {
        ...core,
        revision: core.revision + 1,
        balances: dry.audit.sourceBalances,
      })
      const day: Day = JSON.parse((await redis.get<string>(dayKey))!)
      assert.equal(day.ledger.length, 3)
      assert.equal(day.submissions.length, 0)
      assert.equal(day.planned, false)
      // Simulate activity on both boards while the deployment finishes.
      after.balances['kid-1'] += 7
      after.revision++
      await redis.set(coreKey, JSON.stringify(after))
      source.completions.push({
        kidId: 'kid-2',
        starsAwarded: 5,
      } as ChoreState['completions'][number])
      await redis.json.set(sourceKey, '$', source)
      const final = await cutoverBalances({
        ...options,
        phase: 'final',
        apply: true,
      })
      assert.deepEqual(
        final.audit.kids.map((k) => k.after),
        [-18, 405, 390],
      )
      assert.deepEqual(
        final.audit.kids.map((k) => k.delta),
        [0, 5, 0],
      )
      const again = await cutoverBalances({
        ...options,
        phase: 'final',
        apply: true,
      })
      assert.equal('alreadyApplied' in again, true)
      assert.deepEqual(final.audit, again.audit)
      const finalDay: Day = JSON.parse((await redis.get<string>(dayKey))!)
      assert.deepEqual(finalDay.ledger.slice(0, 3), day.ledger)
      assert.equal(finalDay.ledger.length, 4)
      assert.deepEqual(
        JSON.parse((await redis.json.get(sourceKey)) as string),
        source,
      )
    } finally {
      await redis.del(sourceKey, coreKey, dayKey, ...auditKeys)
    }
  },
)
