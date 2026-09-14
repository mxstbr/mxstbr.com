import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { commandSchema } from './commands'
import { fixture } from './fixtures'
import { scheduled } from './domain'
import { MemoryRepository } from './repository'
import { ChoresService } from './service'
import { ChoresError, type Actor, type Board, type Chore } from './types'

const parent: Actor = { kind: 'parent', id: 'test-parent' }
const child: Actor = {
  kind: 'kid',
  id: 'test-device',
  kidIds: ['kid-1', 'kid-2', 'kid-3'],
}
function setup(iso = '2026-09-09T15:00:00Z') {
  let now = new Date(iso)
  const f = fixture(now),
    repo = new MemoryRepository(f.core, f.days)
  const service = new ChoresService(repo, () => now)
  const run = (command: unknown, actor = child, id = randomUUID()) =>
    service.execute(actor, id, command)
  return {
    f,
    repo,
    service,
    run,
    clock: (iso: string) => {
      now = new Date(iso)
    },
    board: () => service.getBoard(child),
  }
}
const kid = (b: Board, id = 'kid-3') => b.kids.find((k) => k.id === id)!
const rejected = (code: string) => (e: unknown) =>
  e instanceof ChoresError && e.code === code
function buildChore(over: Partial<Chore>): Chore {
  return {
    id: randomUUID(),
    title: 't',
    emoji: '📋',
    stars: 1,
    kidIds: ['kid-3'],
    type: 'repeated',
    createdAt: '2026-09-01T14:00:00Z',
    scheduledFor: '2026-09-01',
    ...over,
  }
}

test('commandSchema rejects a weekly schedule with omitted or empty daysOfWeek and surfaces the weekday requirement', () => {
  for (const schedule of [
    { cadence: 'weekly' },
    { cadence: 'weekly', daysOfWeek: [] },
  ] as const) {
    const r = commandSchema.safeParse({
      action: 'create_chore',
      chore: {
        title: 'Weekly',
        emoji: '📋',
        stars: 1,
        kidIds: ['kid-3'],
        type: 'repeated',
        timeOfDay: 'morning',
        schedule,
      },
    })
    assert.equal(r.success, false)
    if (!r.success)
      assert.match(
        r.error.issues.map((i) => i.message).join('; '),
        /weekday|at least 1/i,
      )
  }
})

test('commandSchema accepts a weekly schedule with valid daysOfWeek and a daily schedule with or without daysOfWeek', () => {
  for (const schedule of [
    { cadence: 'weekly', daysOfWeek: [3] },
    { cadence: 'daily', daysOfWeek: [1, 2, 3, 4, 5] },
    { cadence: 'daily' },
  ] as const) {
    const r = commandSchema.safeParse({
      action: 'create_chore',
      chore: {
        title: 'x',
        emoji: '📋',
        stars: 1,
        kidIds: ['kid-3'],
        type: 'repeated',
        timeOfDay: 'morning',
        schedule,
      },
    })
    assert.equal(r.success, true)
  }
})

test('create_chore and update_chore reject weekly cadence with empty/omitted daysOfWeek; a valid update succeeds', async () => {
  const t = setup()
  await assert.rejects(
    t.run(
      {
        action: 'create_chore',
        chore: {
          title: 'Weekly empty',
          emoji: '📋',
          stars: 5,
          kidIds: ['kid-3'],
          type: 'repeated',
          timeOfDay: 'morning',
          schedule: { cadence: 'weekly', daysOfWeek: [] },
        },
      },
      parent,
    ),
    (e: unknown) =>
      e instanceof ChoresError &&
      e.code === 'INVALID_INPUT' &&
      /weekday/i.test(e.message),
  )
  const created = await t.run(
    {
      action: 'create_chore',
      chore: {
        title: 'Weekly Wed',
        emoji: '🗓️',
        stars: 5,
        kidIds: ['kid-3'],
        type: 'repeated',
        timeOfDay: 'morning',
        schedule: { cadence: 'weekly', daysOfWeek: [3] },
      },
    },
    parent,
  )
  await assert.rejects(
    t.run(
      {
        action: 'update_chore',
        choreId: created.id,
        patch: { schedule: { cadence: 'weekly' } },
      },
      parent,
    ),
    rejected('INVALID_INPUT'),
  )
  assert.equal(
    (
      await t.run(
        {
          action: 'update_chore',
          choreId: created.id,
          patch: { schedule: { cadence: 'weekly', daysOfWeek: [4] } },
        },
        parent,
      )
    ).status,
    'updated',
  )
})

test('weekly chore with valid daysOfWeek appears only on selected weekdays (end-to-end)', async () => {
  const t = setup() // 2026-09-09 Wed (weekday 3)
  const created = await t.run(
    {
      action: 'create_chore',
      chore: {
        title: 'Weekly Wed-only',
        emoji: '🗓️',
        stars: 5,
        kidIds: ['kid-3'],
        type: 'repeated',
        timeOfDay: 'morning',
        schedule: { cadence: 'weekly', daysOfWeek: [3] },
      },
    },
    parent,
  )
  assert.ok(
    kid(await t.board()).chores.some((c) => c.choreId === created.id),
    'shows on the selected weekday (Wed)',
  )
  t.clock('2026-09-10T15:00:00Z') // Thu (weekday 4)
  assert.ok(
    !kid(await t.board()).chores.some((c) => c.choreId === created.id),
    'does NOT show on Thursday',
  )
  t.clock('2026-09-16T15:00:00Z') // next Wed (weekday 3)
  assert.ok(
    kid(await t.board()).chores.some((c) => c.choreId === created.id),
    'shows again the following Wednesday',
  )
})

test('scheduled(): weekly chore with empty or omitted daysOfWeek is never scheduled on any weekday', () => {
  const schedules: Chore['schedule'][] = [
    { cadence: 'weekly', daysOfWeek: [] },
    { cadence: 'weekly' },
  ]
  for (const schedule of schedules) {
    const chore = buildChore({ schedule })
    for (const day of [
      '2026-09-09',
      '2026-09-10',
      '2026-09-12',
      '2026-09-13',
      '2026-09-14',
      '2026-09-16',
    ])
      assert.equal(
        scheduled(chore, 'kid-3', day),
        false,
        `${JSON.stringify(schedule)} ${day}`,
      )
  }
})

test('scheduled(): weekly chore honors its selected weekdays and only those', () => {
  const wed = buildChore({ schedule: { cadence: 'weekly', daysOfWeek: [3] } })
  assert.equal(scheduled(wed, 'kid-3', '2026-09-09'), true, 'Wed')
  assert.equal(scheduled(wed, 'kid-3', '2026-09-10'), false, 'Thu')
  assert.equal(scheduled(wed, 'kid-3', '2026-09-12'), false, 'Sat')
  const multi = buildChore({
    schedule: { cadence: 'weekly', daysOfWeek: [1, 3, 6] },
  })
  assert.equal(scheduled(multi, 'kid-3', '2026-09-09'), true, 'Wed')
  assert.equal(scheduled(multi, 'kid-3', '2026-09-14'), true, 'Mon')
  assert.equal(scheduled(multi, 'kid-3', '2026-09-12'), true, 'Sat')
  assert.equal(scheduled(multi, 'kid-3', '2026-09-10'), false, 'Thu')
})

test('scheduled(): daily chore with a weekday filter still honors it; without one it runs every day (no regression)', () => {
  const weekdays = buildChore({
    schedule: { cadence: 'daily', daysOfWeek: [1, 2, 3, 4, 5] },
  })
  assert.equal(scheduled(weekdays, 'kid-3', '2026-09-09'), true, 'Wed')
  assert.equal(scheduled(weekdays, 'kid-3', '2026-09-12'), false, 'Sat')
  const everyday = buildChore({ schedule: { cadence: 'daily' } })
  assert.equal(scheduled(everyday, 'kid-3', '2026-09-09'), true, 'Wed')
  assert.equal(scheduled(everyday, 'kid-3', '2026-09-12'), true, 'Sat')
})

test('migrated weekly chore with empty/omitted daysOfWeek never appears; a valid weekly control does', async () => {
  const t = setup() // 2026-09-09 (already planned by the fixture)
  const badId = randomUUID(),
    goodId = randomUUID()
  const chores: { id: string; schedule: Chore['schedule'] }[] = [
    { id: badId, schedule: { cadence: 'weekly', daysOfWeek: [] } },
    { id: goodId, schedule: { cadence: 'weekly', daysOfWeek: [3] } },
  ]
  for (const c of chores) {
    t.repo.core.chores.push({
      id: c.id,
      title: 'Migrated weekly',
      emoji: '📋',
      stars: 1,
      kidIds: ['kid-3'],
      type: 'repeated',
      timeOfDay: 'morning',
      schedule: c.schedule,
      scheduledFor: '2026-09-09',
      createdAt: '2026-09-01T14:00:00Z',
    })
  }
  t.clock('2026-09-10T15:00:00Z') // Thursday — a fresh, unplanned day
  const thu = kid(await t.board()).chores.map((c) => c.choreId)
  assert.ok(!thu.includes(badId), 'empty weekly NOT on Thu')
  assert.ok(!thu.includes(goodId), 'Wed-only control NOT on Thu')
  t.clock('2026-09-16T15:00:00Z') // next Wednesday — a fresh, unplanned day
  const wed = kid(await t.board()).chores.map((c) => c.choreId)
  assert.ok(
    !wed.includes(badId),
    'empty weekly NEVER appears (even on a weekday)',
  )
  assert.ok(wed.includes(goodId), 'Wed-only control IS on Wed')
})
