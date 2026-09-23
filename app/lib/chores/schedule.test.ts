import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { commandSchema } from './commands'
import { scheduled } from './domain'
import { fixture } from './fixtures'
import { MemoryRepository } from './repository'
import { ChoresService } from './service'
import { ChoresError, type Actor, type Chore } from './types'

const parent: Actor = { kind: 'parent', id: 'test-parent' }
const child: Actor = { kind: 'kid', id: 'test-device', kidIds: ['kid-3'] }
const dates = [
  '2026-09-13',
  '2026-09-14',
  '2026-09-15',
  '2026-09-16',
  '2026-09-17',
  '2026-09-18',
  '2026-09-19',
]
function chore(schedule?: Chore['schedule']): Chore {
  return {
    id: randomUUID(),
    title: 'Scheduled chore',
    emoji: '📋',
    stars: 1,
    kidIds: ['kid-3'],
    type: 'repeated',
    timeOfDay: 'morning',
    createdAt: '2026-09-01T14:15:00Z',
    scheduledFor: '2026-09-01',
    schedule,
  }
}
function setup() {
  let now = new Date('2026-09-09T14:15:00Z')
  const f = fixture(now)
  const repo = new MemoryRepository(f.core, f.days)
  const service = new ChoresService(repo, () => now)
  return {
    repo,
    service,
    run: (input: unknown) => service.execute(parent, randomUUID(), input),
    clock: (day: string) => {
      now = new Date(day + 'T14:15:00Z')
    },
    board: () => service.getBoard(child),
  }
}
const input = (schedule: Chore['schedule']) => ({
  title: 'Scheduled chore',
  emoji: '📋',
  stars: 1,
  kidIds: ['kid-3'],
  type: 'repeated',
  timeOfDay: 'morning',
  schedule,
})

test('weekly create and update require weekdays; daily empty and omitted weekdays stay valid', () => {
  const cases: [Chore['schedule'], boolean][] = [
    [{ cadence: 'weekly' }, false],
    [{ cadence: 'weekly', daysOfWeek: [] }, false],
    [{ cadence: 'weekly', daysOfWeek: [3] }, true],
    [{ cadence: 'weekly', daysOfWeek: [0, 6] }, true],
    [{ cadence: 'daily' }, true],
    [{ cadence: 'daily', daysOfWeek: [] }, true],
    [{ cadence: 'daily', daysOfWeek: [1, 2, 3, 4, 5] }, true],
    [undefined, true],
  ]
  for (const [schedule, valid] of cases)
    for (const command of [
      { action: 'create_chore', chore: input(schedule) },
      {
        action: 'update_chore',
        choreId: 'existing',
        patch: { schedule },
      },
    ]) {
      const result = commandSchema.safeParse(command)
      assert.equal(result.success, valid, JSON.stringify(command))
      if (!valid && !result.success)
        assert.match(result.error.issues[0].message, /weekday/i)
    }
})

test('weekly scheduling requires matching weekdays while daily and other chore types keep their behavior', () => {
  for (const schedule of [
    { cadence: 'weekly' },
    { cadence: 'weekly', daysOfWeek: [] },
  ] as Chore['schedule'][])
    for (const day of dates)
      assert.equal(scheduled(chore(schedule), 'kid-3', day), false)

  for (let index = 0; index < dates.length; index++) {
    const day = dates[index]
    assert.equal(
      scheduled(
        chore({ cadence: 'weekly', daysOfWeek: [0, 3, 6] }),
        'kid-3',
        day,
      ),
      [0, 3, 6].includes(index),
    )
    for (const schedule of [
      undefined,
      { cadence: 'daily' },
      { cadence: 'daily', daysOfWeek: [] },
    ] as Chore['schedule'][])
      assert.equal(scheduled(chore(schedule), 'kid-3', day), true)
    assert.equal(
      scheduled(
        chore({ cadence: 'daily', daysOfWeek: [1, 2, 3, 4, 5] }),
        'kid-3',
        day,
      ),
      index > 0 && index < 6,
    )
  }
  const weekly = chore({ cadence: 'weekly', daysOfWeek: [3] })
  assert.equal(scheduled(weekly, 'other-kid', '2026-09-16'), false)
  assert.equal(
    scheduled({ ...weekly, scheduledFor: '2026-09-17' }, 'kid-3', '2026-09-16'),
    false,
  )
  assert.equal(
    scheduled({ ...weekly, archivedFrom: '2026-09-16' }, 'kid-3', '2026-09-16'),
    false,
  )
  const oneOff = {
    ...weekly,
    type: 'one-off' as const,
    scheduledFor: '2026-09-15',
  }
  assert.equal(scheduled(oneOff, 'kid-3', '2026-09-15'), true)
  assert.equal(scheduled(oneOff, 'kid-3', '2026-09-16'), false)
  assert.equal(
    scheduled({ ...weekly, type: 'perpetual' }, 'kid-3', '2026-09-15'),
    true,
  )
})

test('service rejects malformed weekly writes without changing the saved chore', async () => {
  const t = setup()
  const created = await t.run({
    action: 'create_chore',
    chore: input({ cadence: 'weekly', daysOfWeek: [3] }),
  })
  const before = structuredClone(t.repo.core)
  for (const schedule of [
    { cadence: 'weekly' },
    { cadence: 'weekly', daysOfWeek: [] },
  ])
    for (const command of [
      { action: 'create_chore', chore: input(schedule as Chore['schedule']) },
      { action: 'update_chore', choreId: created.id, patch: { schedule } },
    ]) {
      await assert.rejects(
        t.run(command),
        (error: unknown) =>
          error instanceof ChoresError &&
          error.code === 'INVALID_INPUT' &&
          /weekday/i.test(error.message),
      )
      assert.deepEqual(t.repo.core, before)
    }
})

test('valid weekly and daily schedules keep their board visibility across a full week', async () => {
  const t = setup()
  const weekly = await t.run({
    action: 'create_chore',
    chore: input({ cadence: 'weekly', daysOfWeek: [3] }),
  })
  const daily = await t.run({
    action: 'create_chore',
    chore: input({ cadence: 'daily', daysOfWeek: [] }),
  })
  for (let index = 0; index < dates.length; index++) {
    const day = dates[index]
    t.clock(day)
    const cards = (await t.board()).kids[0].chores
    assert.equal(
      cards.some((c) => c.choreId === weekly.id),
      index === 3,
    )
    assert.equal(
      cards.some((c) => c.choreId === daily.id),
      true,
    )
  }
  await t.run({
    action: 'update_chore',
    choreId: weekly.id,
    patch: { schedule: { cadence: 'weekly', daysOfWeek: [0] } },
  })
  t.clock('2026-09-20')
  assert.equal(
    (await t.board()).kids[0].chores.some((c) => c.choreId === weekly.id),
    true,
  )
})

test('stored malformed weekly schedules never become daily work and existing history is preserved', async () => {
  const t = setup()
  const malformed = [
    chore({ cadence: 'weekly' }),
    chore({ cadence: 'weekly', daysOfWeek: [] }),
  ]
  t.repo.core.chores.push(...malformed)
  const originalDay = structuredClone(t.repo.days['2026-09-09'])
  const originalBalances = structuredClone(t.repo.core.balances)
  for (const day of dates) {
    t.clock(day)
    const board = await t.board()
    assert.equal(
      board.kids[0].chores.some((c) =>
        malformed.some((m) => m.id === c.choreId),
      ),
      false,
    )
    assert.equal(
      t.repo.days[day].occurrences.some((o) =>
        malformed.some((m) => m.id === o.choreId),
      ),
      false,
    )
  }
  assert.deepEqual(t.repo.days['2026-09-09'], originalDay)
  assert.deepEqual(t.repo.core.balances, originalBalances)
  assert.deepEqual(t.repo.core.chores.slice(-2), malformed)
})

test('already-planned malformed weekly work is waived without erasing accepted history', async () => {
  const t = setup()
  const cards = (await t.board()).kids[0].chores
  const [bed, teeth] = cards
  t.repo.days['2026-09-09'].occurrences.find(
    (o) => o.id === bed.occurrenceId,
  )!.chore.requiresApproval = true
  const accepted = await t.service.execute(child, randomUUID(), {
    action: 'submit',
    occurrenceId: bed.occurrenceId,
  })
  assert.equal(accepted.status, 'pending')
  t.repo.core.chores.find((c) => c.id === bed.choreId)!.schedule = {
    cadence: 'weekly',
    daysOfWeek: [],
  }
  t.repo.core.chores.find((c) => c.id === teeth.choreId)!.schedule = {
    cadence: 'weekly',
  }
  const before = structuredClone(t.repo.days['2026-09-09'])
  const balances = structuredClone(t.repo.core.balances)
  const board = await t.board()
  assert.equal(board.kids[0].chores.length, 0)
  assert.equal(board.kids[0].periodProgress.total, 0)
  for (const card of cards)
    assert.equal(
      t.repo.days['2026-09-09'].occurrences.find(
        (o) => o.id === card.occurrenceId,
      )!.waived,
      true,
    )
  await assert.rejects(
    t.service.execute(child, randomUUID(), {
      action: 'submit',
      occurrenceId: teeth.occurrenceId,
    }),
    (error: unknown) =>
      error instanceof ChoresError && error.code === 'UNAVAILABLE',
  )
  const after = t.repo.days['2026-09-09']
  assert.deepEqual(after.submissions, before.submissions)
  assert.deepEqual(after.ledger, before.ledger)
  assert.deepEqual(
    after.occurrences.map((o) => o.chore),
    before.occurrences.map((o) => o.chore),
  )
  assert.deepEqual(t.repo.core.balances, balances)
  assert.equal((await t.service.approvals(parent))[0].id, accepted.id)
})
