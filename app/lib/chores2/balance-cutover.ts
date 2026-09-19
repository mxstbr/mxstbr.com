import { createHash } from 'node:crypto'
import type { ChoreState } from '../../(os)/chores2/data'
import { emptyDay } from './domain'
import { PREFIX, redisClient } from './repository'
import { pacificDay } from './time'
import type { Core, Day } from './types'

type Phase = 'initial' | 'final'
type Audit = {
  phase: Phase
  timestamp: string
  sourceHash: string
  sourceBalances: Record<string, number>
  kids: {
    id: string
    name: string
    before: number
    delta: number
    after: number
  }[]
}

export function planBalanceCutover(
  source: Pick<ChoreState, 'kids' | 'completions'>,
  core: Core,
  baseline?: Audit,
) {
  const ids = source.kids.map((k) => k.id).sort()
  if (
    new Set(ids).size !== ids.length ||
    JSON.stringify(ids) !== JSON.stringify(core.kids.map((k) => k.id).sort())
  )
    throw new Error('Kid IDs differ; balance cutover stopped.')
  const sourceBalances: Record<string, number> = Object.fromEntries(
    ids.map((id) => [id, 0]),
  )
  for (const completion of source.completions) {
    if (!Number.isSafeInteger(completion.starsAwarded))
      throw new Error('Invalid legacy star entry; balance cutover stopped.')
    if (ids.includes(completion.kidId))
      sourceBalances[completion.kidId] += completion.starsAwarded
  }
  const kids = core.kids.map(({ id, name }) => {
    const before = core.balances[id]
    // After deployment, carry only legacy activity since the initial snapshot.
    // New-board stars earned in the meantime must not be overwritten.
    const delta =
      sourceBalances[id] - (baseline ? baseline.sourceBalances[id] : before)
    const after = before + delta
    if (![before, sourceBalances[id], delta, after].every(Number.isSafeInteger))
      throw new Error(
        `Invalid star total for ${name}; balance cutover stopped.`,
      )
    return { id, name, before, delta, after }
  })
  return { sourceBalances, kids }
}

export async function cutoverBalances({
  phase,
  apply = false,
  cutoverId = '2026-09-19',
  prefix = PREFIX,
  sourceKey = 'chores:mxstbr:family-board',
  redis = redisClient(),
}: {
  phase: Phase
  apply?: boolean
  cutoverId?: string
  prefix?: string
  sourceKey?: string
  redis?: ReturnType<typeof redisClient>
}) {
  if (phase !== 'initial' && phase !== 'final')
    throw new Error('Choose initial or final.')
  const now = new Date(),
    dayId = pacificDay(now)
  const auditPrefix = `${prefix}:cutover:${cutoverId}`
  const keys = [
    sourceKey,
    `${prefix}:core`,
    `${prefix}:day:${dayId}`,
    `${auditPrefix}:${phase}`,
    `${auditPrefix}:initial`,
  ]
  for (let attempt = 0; attempt < 12; attempt++) {
    const snapshot = (await redis.eval(
      `
return {redis.call('JSON.GET', KEYS[1]), redis.call('GET', KEYS[2]), redis.call('GET', KEYS[3]), redis.call('GET', KEYS[4]), redis.call('GET', KEYS[5])}
`,
      keys,
      [],
    )) as (string | null)[]
    const [sourceRaw, coreRaw, dayRaw, saved, initialRaw] = snapshot
    if (saved)
      return { alreadyApplied: true, audit: JSON.parse(saved) as Audit }
    if (!sourceRaw || !coreRaw)
      throw new Error('Both boards must exist before cutover.')
    if (phase === 'final' && !initialRaw)
      throw new Error('Apply the initial snapshot before final reconciliation.')
    const core: Core = JSON.parse(coreRaw),
      day: Day = dayRaw ? JSON.parse(dayRaw) : emptyDay(dayId)
    const audit: Audit = {
      phase,
      timestamp: now.toISOString(),
      sourceHash: createHash('sha256').update(sourceRaw).digest('hex'),
      ...planBalanceCutover(
        JSON.parse(sourceRaw),
        core,
        phase === 'final' ? JSON.parse(initialRaw!) : undefined,
      ),
    }
    if (!apply) return { dryRun: true, audit }
    for (const kid of audit.kids) {
      if (!kid.delta) continue
      core.balances[kid.id] = kid.after
      day.ledger.push({
        id: `cutover:${cutoverId}:${phase}:${kid.id}`,
        kidId: kid.id,
        amount: kid.delta,
        kind: 'adjustment',
        sourceId: `${auditPrefix}:${phase}`,
        timestamp: audit.timestamp,
        actor: 'balance-cutover',
        note: `Promote new /chores: ${phase} legacy balance reconciliation (${kid.before} → ${kid.after}).`,
      })
    }
    core.revision++
    const committed = await redis.eval(
      `
if redis.call('EXISTS', KEYS[4]) == 1 then return 0 end
-- RedisJSON object field order is not stable. Compare the source values
-- being transferred, not the serialization of unrelated catalog/history.
local source = cjson.decode(redis.call('JSON.GET', KEYS[1]))
local expected = cjson.decode(ARGV[1])
local actual = {}
local count = 0
for _, kid in ipairs(source.kids) do
  if expected[kid.id] == nil or actual[kid.id] ~= nil then return 0 end
  actual[kid.id] = 0
  count = count + 1
end
for _, _ in pairs(expected) do count = count - 1 end
if count ~= 0 then return 0 end
for _, completion in ipairs(source.completions) do
  if type(completion.starsAwarded) ~= 'number' then return 0 end
  if actual[completion.kidId] ~= nil then
    actual[completion.kidId] = actual[completion.kidId] + completion.starsAwarded
  end
end
for id, total in pairs(actual) do if total ~= expected[id] then return 0 end end
if redis.call('GET', KEYS[2]) ~= ARGV[2] then return 0 end
if (redis.call('GET', KEYS[3]) or '') ~= ARGV[3] then return 0 end
if (redis.call('GET', KEYS[5]) or '') ~= ARGV[4] then return 0 end
for i = 2, 4 do
  local t = redis.call('TYPE', KEYS[i]).ok
  if t ~= 'none' and t ~= 'string' then return redis.error_reply('Invalid cutover record type') end
end
redis.call('SET', KEYS[2], ARGV[5])
redis.call('SET', KEYS[3], ARGV[6])
redis.call('SET', KEYS[4], ARGV[7])
return 1
`,
      keys,
      [
        JSON.stringify(audit.sourceBalances),
        coreRaw,
        dayRaw || '',
        initialRaw || '',
        JSON.stringify(core),
        JSON.stringify(day),
        JSON.stringify(audit),
      ],
    )
    if (Number(committed) === 1) return { applied: true, audit }
  }
  throw new Error(
    'Concurrent changes prevented balance cutover. Retry the same phase.',
  )
}
