import nextEnv from '@next/env'
import { Redis } from '@upstash/redis'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import type {
  Chore,
  ChoreState,
  ChoreType,
  Completion,
  Kid,
  Reward,
  RewardType,
} from '../app/(os)/chores/data'

const CHORES_KEY = 'chores:mxstbr:family-board'
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

type Collection = 'kids' | 'chores' | 'rewards'
type Operation = Record<string, any>

const DEFAULT_KIDS: Kid[] = [
  { id: 'kid-1', name: 'Kid One', color: '#0ea5e9' },
  { id: 'kid-2', name: 'Kid Two', color: '#8b5cf6' },
  { id: 'kid-3', name: 'Kid Three', color: '#f59e0b' },
]

nextEnv.loadEnvConfig(process.cwd())

let redis: Redis | null = null

function getRedis(): Redis {
  redis ??= Redis.fromEnv()
  return redis
}

async function main() {
  const { command, args, flags } = parseArgs(process.argv.slice(2))

  if (!command || command === 'help' || flags.has('help')) {
    printHelp()
    return
  }

  if (command === 'dump') {
    printJson(await loadState())
    return
  }

  if (command === 'summary') {
    const state = await loadState()
    flags.has('json') ? printJson(summarize(state)) : printSummary(state)
    return
  }

  if (command === 'search') {
    const state = await loadState()
    const collection = parseCollection(args[0] ?? 'chores')
    const query = args.slice(1).join(' ').trim().toLowerCase()
    const rows = searchRows(state, collection, query)
    flags.has('json') ? printJson(rows) : printTable(rows)
    return
  }

  if (command === 'apply') {
    const operations = await readOperations(args, flags)
    const state = await loadState()
    const messages = operations.map((operation) =>
      applyOperation(state, operation),
    )
    validateState(state)

    if (!flags.has('dry-run')) {
      await getRedis().json.set(CHORES_KEY, '$', state)
    }

    const result = {
      ok: true,
      dryRun: flags.has('dry-run'),
      messages,
      summary: summarize(state),
    }
    flags.has('json') ? printJson(result) : console.log(messages.join('\n'))
    return
  }

  fail(`Unknown command "${command}". Run: pnpm chores help`)
}

function parseArgs(argv: string[]) {
  const [command = '', ...rest] = argv
  const args: string[] = []
  const flags = new Map<string, string>()

  for (let index = 0; index < rest.length; index += 1) {
    const item = rest[index]
    if (!item.startsWith('--')) {
      args.push(item)
      continue
    }

    const rawFlag = item.slice(2)
    const equalsIndex = rawFlag.indexOf('=')
    const key = equalsIndex === -1 ? rawFlag : rawFlag.slice(0, equalsIndex)
    const inlineValue =
      equalsIndex === -1 ? undefined : rawFlag.slice(equalsIndex + 1)
    const next = rest[index + 1]
    if (inlineValue !== undefined) {
      flags.set(key, inlineValue)
    } else if (next && !next.startsWith('--')) {
      flags.set(key, next)
      index += 1
    } else {
      flags.set(key, 'true')
    }
  }

  return { command, args, flags }
}

async function loadState(): Promise<ChoreState> {
  const stored = await getRedis().json.get<ChoreState>(CHORES_KEY)
  return normalizeState(stored)
}

function normalizeState(state: Partial<ChoreState> | null): ChoreState {
  const kids = ensureKids(state?.kids)
  return {
    kids,
    chores: ensureChores(state?.chores, kids),
    completions: Array.isArray(state?.completions) ? state.completions : [],
    rewards: ensureRewards(state?.rewards, kids),
    rewardRedemptions: Array.isArray(state?.rewardRedemptions)
      ? state.rewardRedemptions
      : [],
  }
}

function ensureKids(kids: Kid[] | undefined): Kid[] {
  if (!kids?.length) return [...DEFAULT_KIDS]
  const filled = [...kids]
  for (let index = filled.length; index < 3; index += 1) {
    filled.push({ ...DEFAULT_KIDS[index], id: `kid-${index + 1}` })
  }
  return filled.slice(0, 3).map((kid, index) => ({
    ...kid,
    color: kid.color || DEFAULT_KIDS[index]?.color || '#0ea5e9',
  }))
}

function ensureChores(chores: Chore[] | undefined, kids: Kid[]): Chore[] {
  if (!Array.isArray(chores)) return []
  return chores.map((chore) => {
    const legacyKidId = (chore as any).kidId
    const kidIds = Array.isArray((chore as any).kidIds)
      ? (chore as any).kidIds.filter(Boolean)
      : legacyKidId
        ? [legacyKidId]
        : [kids[0]?.id ?? 'kid-1']

    return {
      ...chore,
      kidIds: kidIds.length ? kidIds : [kids[0]?.id ?? 'kid-1'],
      requiresApproval: chore.requiresApproval ?? false,
      scheduledFor:
        chore.scheduledFor ??
        (typeof chore.createdAt === 'string'
          ? chore.createdAt.slice(0, 10)
          : todayPacific()),
      snoozedForKids: chore.snoozedForKids ?? {},
    }
  })
}

function ensureRewards(rewards: Reward[] | undefined, kids: Kid[]): Reward[] {
  if (!Array.isArray(rewards)) return []
  return rewards.map((reward) => {
    const kidIds = Array.isArray((reward as any).kidIds)
      ? (reward as any).kidIds.filter(Boolean)
      : [kids[0]?.id ?? 'kid-1']
    return {
      ...reward,
      kidIds: kidIds.length ? kidIds : [kids[0]?.id ?? 'kid-1'],
    }
  })
}

async function readOperations(
  args: string[],
  flags: Map<string, string>,
): Promise<Operation[]> {
  const source = flags.get('file')
    ? await readFile(flags.get('file')!, 'utf8')
    : args.length
      ? args.join(' ')
      : await readStdin()
  const parsed = JSON.parse(source)
  const operations = Array.isArray(parsed)
    ? parsed
    : (parsed.operations ?? [parsed])
  if (!Array.isArray(operations))
    fail(
      'Expected one operation, an operations array, or { "operations": [...] }',
    )
  return operations
}

async function readStdin(): Promise<string> {
  let data = ''
  for await (const chunk of process.stdin) data += chunk
  return data
}

function applyOperation(state: ChoreState, operation: Operation): string {
  switch (operation.op) {
    case 'add':
      return addItem(
        state,
        parseCollection(operation.collection),
        operation.value,
      )
    case 'update':
      return updateItem(
        state,
        parseCollection(operation.collection),
        required(operation.id, 'id'),
        operation.patch,
      )
    case 'delete':
      return deleteItem(
        state,
        parseCollection(operation.collection),
        required(operation.id, 'id'),
      )
    case 'add-completion':
      return addCompletion(state, operation)
    case 'adjust-stars':
      return adjustStars(state, operation)
    case 'redeem-reward':
      return redeemReward(state, operation)
    case 'pause-all':
      return pauseAll(state, operation.until ?? null)
    case 'replace-state':
      Object.assign(state, normalizeState(operation.state))
      return 'Replaced chores state'
    default:
      fail(`Unknown operation: ${operation.op}`)
  }
}

function addItem(
  state: ChoreState,
  collection: Collection,
  value: Operation,
): string {
  if (collection === 'kids')
    fail('Kids are fixed columns; use update on kids instead')
  if (collection === 'chores') {
    const chore = normalizeNewChore(state, value)
    state.chores.unshift(chore)
    return `Added chore "${chore.title}" (${chore.id})`
  }

  const reward = normalizeNewReward(state, value)
  state.rewards.unshift(reward)
  return `Added reward "${reward.title}" (${reward.id})`
}

function updateItem(
  state: ChoreState,
  collection: Collection,
  id: string,
  patch: Operation,
): string {
  if (!patch || typeof patch !== 'object')
    fail('update requires a patch object')
  const item = findById(collectionItems(state, collection), id)
  Object.assign(item, patch)
  if ('kidIds' in patch) item.kidIds = validKidIds(state, patch.kidIds)
  return `Updated ${collection.slice(0, -1)} ${id}`
}

function deleteItem(
  state: ChoreState,
  collection: Collection,
  id: string,
): string {
  if (collection === 'kids') fail('Kid columns cannot be deleted')
  if (collection === 'chores') {
    findById(state.chores, id)
    state.chores = state.chores.filter((chore) => chore.id !== id)
    return `Deleted chore ${id}`
  }

  findById(state.rewards, id)
  state.rewards = state.rewards.filter((reward) => reward.id !== id)
  state.rewardRedemptions = state.rewardRedemptions.filter(
    (entry) => entry.rewardId !== id,
  )
  return `Deleted reward ${id}`
}

function addCompletion(state: ChoreState, operation: Operation): string {
  const chore = findById(state.chores, required(operation.choreId, 'choreId'))
  const kid = findById(state.kids, required(operation.kidId, 'kidId'))
  if (!chore.kidIds.includes(kid.id))
    fail(`Chore "${chore.title}" is not assigned to ${kid.name}`)
  const day = parseIsoDay(operation.day) ?? todayPacific()
  const duplicate = state.completions.some(
    (entry) =>
      entry.choreId === chore.id &&
      entry.kidId === kid.id &&
      pacificDateFromTimestamp(entry.timestamp) === day,
  )
  if (duplicate && !operation.allowDuplicate)
    return `Skipped duplicate completion for "${chore.title}" / ${kid.name}`

  const completion: Completion = {
    id: operation.id ?? randomUUID(),
    choreId: chore.id,
    kidId: kid.id,
    timestamp: completionTimestamp(day),
    starsAwarded: Number.isFinite(operation.starsAwarded)
      ? operation.starsAwarded
      : chore.stars,
  }
  state.completions.unshift(completion)

  if (chore.type === 'one-off') {
    const allDone = chore.kidIds.every((kidId) =>
      state.completions.some(
        (entry) => entry.choreId === chore.id && entry.kidId === kidId,
      ),
    )
    if (allDone) chore.completedAt = completion.timestamp
  }

  return `Added completion for "${chore.title}" / ${kid.name}`
}

function adjustStars(state: ChoreState, operation: Operation): string {
  const kid = findById(state.kids, required(operation.kidId, 'kidId'))
  const delta = Number(operation.delta)
  if (!Number.isFinite(delta) || delta === 0)
    fail('adjust-stars requires a non-zero delta')
  state.completions.unshift({
    id: randomUUID(),
    choreId: `manual-${Date.now()}`,
    kidId: kid.id,
    timestamp: new Date().toISOString(),
    starsAwarded: Math.round(delta),
  })
  return `Adjusted ${kid.name} by ${Math.round(delta)} stars`
}

function redeemReward(state: ChoreState, operation: Operation): string {
  const reward = findById(
    state.rewards,
    required(operation.rewardId, 'rewardId'),
  )
  const kid = findById(state.kids, required(operation.kidId, 'kidId'))
  if (!reward.kidIds.includes(kid.id))
    fail(`Reward "${reward.title}" is not available to ${kid.name}`)
  const balance = starsForKid(state.completions, kid.id)
  if (balance < reward.cost)
    fail(
      `${kid.name} has ${balance} stars; "${reward.title}" costs ${reward.cost}`,
    )

  const timestamp = new Date().toISOString()
  state.completions.unshift({
    id: randomUUID(),
    choreId: `reward:${reward.id}`,
    kidId: kid.id,
    timestamp,
    starsAwarded: -Math.max(0, Math.round(reward.cost)),
  })
  state.rewardRedemptions.unshift({
    id: randomUUID(),
    rewardId: reward.id,
    kidId: kid.id,
    timestamp,
    cost: reward.cost,
  })
  return `Redeemed "${reward.title}" for ${kid.name}`
}

function pauseAll(state: ChoreState, until: string | null): string {
  const pausedUntil = parseNullableDay(until)
  for (const chore of state.chores) {
    chore.pausedUntil = pausedUntil
    chore.snoozedUntil = pausedUntil
  }
  return pausedUntil
    ? `Paused all chores until ${pausedUntil}`
    : 'Resumed all chores'
}

function normalizeNewChore(state: ChoreState, value: Operation): Chore {
  const type = parseEnum<ChoreType>(
    value.type ?? 'one-off',
    ['one-off', 'repeated', 'perpetual'],
    'type',
  )
  const createdAt = value.createdAt ?? new Date().toISOString()
  const chore: Chore = {
    id: value.id ?? randomUUID(),
    kidIds: validKidIds(state, value.kidIds),
    title: required(value.title, 'title'),
    emoji: value.emoji ?? '*',
    stars: nonNegativeInt(value.stars ?? 1, 'stars'),
    type,
    createdAt,
    requiresApproval: Boolean(value.requiresApproval),
    timeOfDay: value.timeOfDay,
    scheduledFor:
      parseIsoDay(value.scheduledFor) ??
      (type === 'one-off' ? todayPacific() : undefined),
    archivedFrom: parseIsoDay(value.archivedFrom) ?? undefined,
  }
  if (type === 'repeated') {
    chore.schedule = {
      cadence: parseEnum(
        value.schedule?.cadence ?? value.cadence ?? 'daily',
        ['daily', 'weekly'],
        'cadence',
      ),
      daysOfWeek: value.schedule?.daysOfWeek ?? value.daysOfWeek,
    }
  }
  return chore
}

function normalizeNewReward(state: ChoreState, value: Operation): Reward {
  return {
    id: value.id ?? randomUUID(),
    kidIds: validKidIds(state, value.kidIds),
    title: required(value.title, 'title'),
    emoji: value.emoji ?? 'gift',
    cost: nonNegativeInt(value.cost ?? 1, 'cost'),
    type: parseEnum<RewardType>(
      value.type ?? 'perpetual',
      ['one-off', 'perpetual'],
      'type',
    ),
    createdAt: value.createdAt ?? new Date().toISOString(),
  }
}

function validateState(state: ChoreState) {
  const kidIds = new Set(state.kids.map((kid) => kid.id))
  if (kidIds.size !== state.kids.length)
    fail('Duplicate kid IDs are not allowed')
  for (const chore of state.chores) {
    required(chore.id, 'chore.id')
    required(chore.title, `chore ${chore.id} title`)
    parseEnum(
      chore.type,
      ['one-off', 'repeated', 'perpetual'],
      `chore ${chore.id} type`,
    )
    if (
      !Array.isArray(chore.kidIds) ||
      chore.kidIds.some((kidId) => !kidIds.has(kidId))
    ) {
      fail(`Chore "${chore.title}" has invalid kidIds`)
    }
  }
  for (const reward of state.rewards) {
    required(reward.id, 'reward.id')
    required(reward.title, `reward ${reward.id} title`)
    if (
      !Array.isArray(reward.kidIds) ||
      reward.kidIds.some((kidId) => !kidIds.has(kidId))
    ) {
      fail(`Reward "${reward.title}" has invalid kidIds`)
    }
  }
}

function searchRows(state: ChoreState, collection: Collection, query: string) {
  return collectionItems(state, collection)
    .filter(
      (item) => !query || JSON.stringify(item).toLowerCase().includes(query),
    )
    .map((item) => {
      if (collection === 'kids') {
        return {
          id: item.id,
          name: item.name,
          stars: starsForKid(state.completions, item.id),
        }
      }
      if (collection === 'chores') {
        return {
          id: item.id,
          title: item.title,
          kids: item.kidIds.join(','),
          stars: item.stars,
          type: item.type,
          scheduledFor: item.scheduledFor ?? '',
          archivedFrom: item.archivedFrom ?? '',
          pausedUntil: item.pausedUntil ?? '',
        }
      }
      return {
        id: item.id,
        title: item.title,
        kids: item.kidIds.join(','),
        cost: item.cost,
        type: item.type,
      }
    })
}

function summarize(state: ChoreState) {
  return {
    key: CHORES_KEY,
    kids: state.kids.map((kid) => ({
      id: kid.id,
      name: kid.name,
      stars: starsForKid(state.completions, kid.id),
    })),
    counts: {
      chores: state.chores.length,
      rewards: state.rewards.length,
      completions: state.completions.length,
      rewardRedemptions: state.rewardRedemptions.length,
    },
  }
}

function collectionItems(state: ChoreState, collection: Collection): any[] {
  return collection === 'kids'
    ? state.kids
    : collection === 'chores'
      ? state.chores
      : state.rewards
}

function parseCollection(value: string): Collection {
  if (value === 'kids' || value === 'chores' || value === 'rewards')
    return value
  fail(`Invalid collection "${value}". Use kids, chores, or rewards`)
}

function validKidIds(state: ChoreState, value: unknown): string[] {
  const ids = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []
  const normalized = ids.map((id) => String(id).trim()).filter(Boolean)
  if (!normalized.length) fail('Expected at least one kid ID')
  const valid = new Set(state.kids.map((kid) => kid.id))
  const invalid = normalized.filter((id) => !valid.has(id))
  if (invalid.length) fail(`Unknown kid ID(s): ${invalid.join(', ')}`)
  return normalized
}

function findById<T extends { id: string }>(items: T[], id: string): T {
  const item = items.find((entry) => entry.id === id)
  if (!item) fail(`No item found with id "${id}"`)
  return item
}

function required(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) fail(`Missing ${label}`)
  return value.trim()
}

function parseEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): T {
  if (allowed.includes(value as T)) return value as T
  fail(`Invalid ${label}: ${value}. Expected ${allowed.join(', ')}`)
}

function parseIsoDay(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'string' && ISO_DAY.test(value)) return value
  fail(`Invalid date "${value}". Expected YYYY-MM-DD`)
}

function parseNullableDay(value: unknown): string | null {
  if (value === null || value === undefined || value === '' || value === 'none')
    return null
  return parseIsoDay(value) ?? null
}

function nonNegativeInt(value: unknown, label: string): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) fail(`Invalid ${label}: ${value}`)
  return Math.max(0, Math.round(parsed))
}

function todayPacific(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function completionTimestamp(day: string): string {
  return day === todayPacific()
    ? new Date().toISOString()
    : new Date(`${day}T12:00:00Z`).toISOString()
}

function pacificDateFromTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return todayPacific()
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function starsForKid(completions: Completion[], kidId: string): number {
  return completions
    .filter((completion) => completion.kidId === kidId)
    .reduce((sum, completion) => sum + completion.starsAwarded, 0)
}

function printSummary(state: ChoreState) {
  const summary = summarize(state)
  console.log(`Redis key: ${summary.key}`)
  console.log(
    `Chores: ${summary.counts.chores}; rewards: ${summary.counts.rewards}; completions: ${summary.counts.completions}`,
  )
  printTable(summary.kids)
}

function printTable(rows: Record<string, unknown>[]) {
  if (!rows.length) {
    console.log('No rows')
    return
  }
  const columns = Object.keys(rows[0])
  const widths = columns.map((column) =>
    Math.max(
      column.length,
      ...rows.map((row) => String(row[column] ?? '').length),
    ),
  )
  console.log(
    columns.map((column, index) => column.padEnd(widths[index])).join('  '),
  )
  console.log(columns.map((_, index) => '-'.repeat(widths[index])).join('  '))
  for (const row of rows) {
    console.log(
      columns
        .map((column, index) => String(row[column] ?? '').padEnd(widths[index]))
        .join('  '),
    )
  }
}

function printJson(value: unknown) {
  console.log(JSON.stringify(value, null, 2))
}

function printHelp() {
  console.log(`Manage the Redis-backed kids chores document.

Storage:
  RedisJSON key: ${CHORES_KEY}
  Shape: { kids, chores, completions, rewards, rewardRedemptions }

Commands:
  pnpm chores summary
  pnpm chores dump
  pnpm chores search chores "brush"
  pnpm chores search rewards
  pnpm chores apply '{"op":"add","collection":"chores","value":{"title":"Brush teeth","kidIds":["kid-1"],"stars":2,"type":"repeated","cadence":"daily"}}'
  pnpm chores apply --file /tmp/chores-ops.json --dry-run

Apply operations:
  add/update/delete on chores or rewards
  update on kids
  add-completion, adjust-stars, redeem-reward, pause-all
  replace-state with { "state": ... } for full-document edits

Use --json for machine-readable output. The script reads Upstash credentials from the environment/.env.local; no secrets are stored here.
`)
}

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
