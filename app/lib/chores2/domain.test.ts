import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { fixture } from './fixtures'
import { MemoryRepository } from './repository'
import { ChoresService } from './service'
import { migrateLegacy } from './migration'
import { currentTime, pacificDay, pacificInstant } from './time'
import { ChoresError, type Actor, type Board } from './types'

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

test('Pacific windows are exclusive at every boundary and handle DST and midnight', () => {
  for (const [iso, expected] of [
    ['2026-09-09T13:59:59Z', null],
    ['2026-09-09T14:00:00Z', 'morning'],
    ['2026-09-09T18:59:59Z', 'morning'],
    ['2026-09-09T19:00:00Z', 'afternoon'],
    ['2026-09-10T00:00:00Z', 'evening'],
    ['2026-09-10T03:15:00Z', 'night'],
    ['2026-09-10T05:00:00Z', null],
  ] as const)
    assert.equal(currentTime(new Date(iso)).period, expected)
  assert.equal(pacificInstant('2026-03-08', 420), '2026-03-08T14:00:00.000Z')
  assert.equal(pacificInstant('2026-11-01', 420), '2026-11-01T15:00:00.000Z')
  assert.equal(pacificInstant('2026-03-08', 1440), '2026-03-09T07:00:00.000Z')
  assert.equal(pacificDay(new Date('2026-09-10T06:59:59Z')), '2026-09-09')
})
test('only the current group reaches the kid payload; real order and weekend filtering survive', async () => {
  const t = setup(),
    b = await t.board()
  assert.deepEqual(
    kid(b, 'kid-1').chores.map((c) => c.choreId),
    [
      'bed',
      'school-clothes',
      'morning-teeth',
      'morning-inhaler',
      'face-lotion',
    ].map((s) => `routine-2026-09-09-${s}`),
  )
  assert(!JSON.stringify(b).includes('Bring your lunch bag'))
  assert.equal(kid(b).bonus[0].choreId, 'bonus')
  t.clock('2026-09-12T15:00:00Z')
  assert(
    !kid(await t.board(), 'kid-1').chores.some((c) =>
      c.choreId.includes('school-clothes'),
    ),
  )
  t.clock('2026-09-12T20:00:00Z')
  assert.equal(kid(await t.board(), 'kid-1').periodProgress.total, 0)
})
test('late, early, forged-date and unauthorized child submissions are rejected on the service', async () => {
  const t = setup(),
    b = await t.board(),
    id = kid(b).chores[0].occurrenceId
  await assert.rejects(
    t.run(
      { action: 'submit', occurrenceId: id },
      { kind: 'kid', id: 'other', kidIds: ['kid-1'] },
    ),
    rejected('FORBIDDEN'),
  )
  await assert.rejects(
    t.run({
      action: 'submit',
      occurrenceId: '2026-09-09:kid-1:routine-2026-09-09-lunch',
    }),
    rejected('WINDOW_CLOSED'),
  )
  t.clock('2026-09-09T19:00:00Z')
  await assert.rejects(
    t.run({ action: 'submit', occurrenceId: id }),
    rejected('WINDOW_CLOSED'),
  )
  t.clock('2026-09-10T15:00:00Z')
  await assert.rejects(
    t.run({ action: 'submit', occurrenceId: id }),
    rejected('WINDOW_CLOSED'),
  )
})
test('period bonus is exactly two; duplicate requests and concurrent child actions cannot duplicate credit', async () => {
  const t = setup(),
    b = await t.board(),
    [a, z] = kid(b).chores
  const requestId = randomUUID()
  const results = await Promise.all([
    t.run({ action: 'submit', occurrenceId: a.occurrenceId }, child, requestId),
    t.run({ action: 'submit', occurrenceId: a.occurrenceId }, child, requestId),
    t.run({ action: 'submit', occurrenceId: z.occurrenceId }),
  ])
  assert.equal(results[0].id, results[1].id)
  const after = kid(await t.board())
  assert.equal(after.balance, 30)
  assert.equal(after.periodProgress.earned, true)
  assert.equal(after.dailyProgress.earned, false)
  assert.equal(
    t.repo.notifications.filter((n) => n.text.includes('bonus stars')).length,
    1,
  )
  await assert.rejects(
    t.run({ action: 'submit', occurrenceId: z.occurrenceId }, child, requestId),
    rejected('REQUEST_CONFLICT'),
  )
})
test('nonempty single-task period earns two, empty periods earn nothing', async () => {
  const t = setup('2026-09-10T04:00:00Z'),
    b = await t.board()
  assert.equal(kid(b).periodProgress.total, 0)
  const one = kid(b, 'kid-1')
  const result = await t.run({
    action: 'submit',
    occurrenceId: one.chores[0].occurrenceId,
  })
  assert.equal(result.periodBonus, 2)
  assert.equal(kid(await t.board(), 'kid-1').balance, 45)
})
test('on-time approval survives midnight, edits and notification failure; retry after cutoff returns accepted result', async () => {
  const t = setup()
  // Create before materializing the day, so its rules are snapshotted in the plan.
  t.repo.core.chores.find((c) =>
    c.id.endsWith('morning-teeth'),
  )!.requiresApproval = true
  t.repo.days['2026-09-09'].occurrences.find(
    (o) => o.kidId === 'kid-3' && o.choreId.endsWith('morning-teeth'),
  )!.chore.requiresApproval = true
  const b = await t.board(),
    [a, z] = kid(b).chores
  await t.run({ action: 'submit', occurrenceId: a.occurrenceId })
  const requestId = randomUUID(),
    request = await t.run(
      { action: 'submit', occurrenceId: z.occurrenceId },
      child,
      requestId,
    )
  assert.equal(request.status, 'pending')
  assert.equal(kid(await t.board()).balance, 27)
  assert.equal((await t.service.approvals(parent)).length, 1)
  await t.run(
    {
      action: 'update_chore',
      choreId: z.choreId,
      patch: { stars: 99, title: 'Edited title' },
    },
    parent,
  )
  t.clock('2026-09-10T15:00:00Z')
  assert.equal(
    (
      await t.run(
        { action: 'submit', occurrenceId: z.occurrenceId },
        child,
        requestId,
      )
    ).id,
    request.id,
  )
  const review = await t.run(
    { action: 'review', submissionId: request.id, decision: 'approve' },
    parent,
  )
  assert.equal(review.stars, 1)
  assert.equal(review.periodBonus, 2)
  assert.equal(
    (
      await t.run(
        { action: 'review', submissionId: request.id, decision: 'approve' },
        parent,
      )
    ).status,
    'already_processed',
  )
  assert.equal(kid(await t.board()).balance, 30)
  assert(
    !kid(await t.board()).completed.some((c) => c.submissionId === request.id),
  )
})
test('kid undo targets the exact displayed record; bonus reversal and re-earning preserve one net award', async () => {
  const t = setup(),
    b = await t.board()
  const first = await t.run({
    action: 'submit',
    occurrenceId: kid(b).chores[0].occurrenceId,
  })
  await t.run({ action: 'submit', occurrenceId: kid(b).chores[1].occurrenceId })
  await t.run({ action: 'undo', submissionId: first.id })
  assert.equal(kid(await t.board()).balance, 27)
  assert.equal(kid(await t.board()).periodProgress.earned, false)
  await t.run({ action: 'submit', occurrenceId: kid(b).chores[0].occurrenceId })
  assert.equal(kid(await t.board()).balance, 30)
  assert.equal(
    (await t.run({ action: 'undo', submissionId: first.id })).status,
    'already_processed',
  )
  t.clock('2026-09-09T20:00:00Z')
  await assert.rejects(
    t.run({ action: 'undo', submissionId: first.id }),
    rejected('WINDOW_CLOSED'),
  )
})
test('finishing the whole day earns only two stars per period; undo and re-earn cannot add a daily bonus', async () => {
  const t = setup()
  for (const c of kid(await t.board()).chores)
    await t.run({ action: 'submit', occurrenceId: c.occurrenceId })
  t.clock('2026-09-10T01:00:00Z')
  let last: string | undefined
  for (const c of kid(await t.board()).chores)
    last = (await t.run({ action: 'submit', occurrenceId: c.occurrenceId })).id
  assert.equal(kid(await t.board()).balance, 34)
  const daily = kid(await t.board()).dailyProgress
  assert.equal(daily.completed, daily.total)
  assert.equal(daily.stars, 0)
  assert.equal(daily.earned, false)
  assert.equal(
    t.repo.days['2026-09-09'].ledger.filter((e) => e.kind === 'daily-bonus')
      .length,
    0,
  )
  assert.equal(
    t.repo.notifications.filter((n) => n.text.includes('bonus stars')).length,
    2,
  )
  await t.run({ action: 'undo', submissionId: last })
  assert.equal(kid(await t.board()).balance, 31)
  for (const c of kid(await t.board()).chores)
    await t.run({ action: 'submit', occurrenceId: c.occurrenceId })
  assert.equal(kid(await t.board()).balance, 34)
  assert.equal(
    t.repo.days['2026-09-09'].ledger.filter((e) => e.kind === 'daily-bonus')
      .length,
    0,
  )
})
test('approving the final on-time chore after midnight awards only its period bonus', async () => {
  const t = setup()
  for (const c of kid(await t.board()).chores)
    await t.run({ action: 'submit', occurrenceId: c.occurrenceId })
  t.clock('2026-09-10T01:00:00Z')
  const evening = kid(await t.board()).chores
  t.repo.days['2026-09-09'].occurrences.find(
    (o) => o.id === evening[evening.length - 1].occurrenceId,
  )!.chore.requiresApproval = true
  let last: string | undefined
  for (const c of evening)
    last = (await t.run({ action: 'submit', occurrenceId: c.occurrenceId })).id
  t.clock('2026-09-10T15:00:00Z')
  const result = await t.run(
    { action: 'review', submissionId: last, decision: 'approve' },
    parent,
  )
  assert.equal(result.periodBonus, 2)
  assert(!('dailyBonus' in result))
  assert.equal(kid(await t.board()).balance, 34)
  assert.equal(
    t.repo.days['2026-09-09'].ledger.filter((e) => e.kind === 'daily-bonus')
      .length,
    0,
  )
})
test('historical daily awards remain recorded without granting new ones or changing existing balances', async () => {
  const t = setup()
  const day = t.repo.days['2026-09-09']
  day.awards['kid-3:daily'] = 'historical-daily-award'
  day.ledger.push({
    id: 'historical-daily-award',
    kidId: 'kid-3',
    amount: 10,
    kind: 'daily-bonus',
    sourceId: 'historical-day',
    timestamp: '2026-09-09T14:00:00Z',
    actor: 'legacy',
    note: 'Previously awarded daily bonus',
  })
  t.repo.core.balances['kid-3'] += 10
  assert.equal(kid(await t.board()).balance, 36)
  assert.equal(kid(await t.board()).dailyProgress.earned, false)
  const first = await t.run({
    action: 'submit',
    occurrenceId: kid(await t.board()).chores[0].occurrenceId,
  })
  await t.run({ action: 'undo', submissionId: first.id })
  assert.equal(kid(await t.board()).balance, 36)
  assert.equal(day.ledger.filter((e) => e.kind === 'daily-bonus').length, 1)
  assert(
    !t.repo.days['2026-09-09'].ledger.some(
      (e) => e.reverses === 'historical-daily-award',
    ),
  )
})
test('expired, paused and removed started work cannot disappear from bonus targets', async () => {
  const t = setup(),
    b = await t.board()
  await t.run(
    { action: 'archive_chore', choreId: kid(b).chores[0].choreId },
    parent,
  )
  await t.run({ action: 'submit', occurrenceId: kid(b).chores[1].occurrenceId })
  assert.equal(kid(await t.board()).periodProgress.total, 2)
  assert.equal(kid(await t.board()).periodProgress.earned, false)
  t.clock('2026-09-10T01:00:00Z')
  for (const c of kid(await t.board()).chores)
    await t.run({ action: 'submit', occurrenceId: c.occurrenceId })
  assert.equal(kid(await t.board()).dailyProgress.earned, false)
  assert.equal(kid(await t.board()).dailyProgress.missed, 1)
})
test('untimed repeatable work is available overnight, obeys cooldown, and does not grow bonus targets', async () => {
  const t = setup('2026-09-10T06:00:00Z'),
    b = await t.board(),
    c = kid(b).bonus[0]
  assert.equal(b.period, null)
  const before = kid(b).dailyProgress.total
  await t.run({ action: 'submit', occurrenceId: c.occurrenceId })
  await assert.rejects(
    t.run({ action: 'submit', occurrenceId: c.occurrenceId }),
    rejected('COOLDOWN'),
  )
  t.clock('2026-09-10T06:00:06Z')
  await t.run({ action: 'submit', occurrenceId: c.occurrenceId })
  assert.equal(kid(await t.board()).balance, 28)
  assert.equal(kid(await t.board()).dailyProgress.total, before)
})
test('competing reward purchases cannot overspend; one-off entitlements and historical prices persist', async () => {
  const t = setup()
  const results = await Promise.allSettled([
    t.run({
      action: 'redeem',
      kidId: 'kid-3',
      rewardId: 'movie',
      expectedCost: 20,
    }),
    t.run({
      action: 'redeem',
      kidId: 'kid-3',
      rewardId: 'movie',
      expectedCost: 20,
    }),
  ])
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1)
  assert.equal(kid(await t.board()).balance, 6)
  await t.run(
    {
      action: 'adjust_stars',
      kidId: 'kid-3',
      delta: 100,
      note: 'Test adjustment',
    },
    parent,
  )
  await t.run({
    action: 'redeem',
    kidId: 'kid-3',
    rewardId: 'lego',
    expectedCost: 50,
  })
  await assert.rejects(
    t.run({
      action: 'redeem',
      kidId: 'kid-3',
      rewardId: 'lego',
      expectedCost: 50,
    }),
    rejected('ALREADY_REDEEMED'),
  )
  await t.run(
    { action: 'update_reward', rewardId: 'lego', patch: { cost: 1 } },
    parent,
  )
  assert.equal(
    t.repo.days['2026-09-09'].redemptions.find((r) => r.reward.id === 'lego')!
      .reward.cost,
    50,
  )
  await assert.rejects(
    t.run({
      action: 'redeem',
      kidId: 'kid-3',
      rewardId: 'movie',
      expectedCost: 10,
    }),
    rejected('PRICE_CHANGED'),
  )
})
test('parent commands are denied to kids; color and packing changes remain independent', async () => {
  const t = setup()
  await assert.rejects(
    t.run({ action: 'adjust_stars', kidId: 'kid-3', delta: 100, note: 'No' }),
    rejected('FORBIDDEN'),
  )
  await assert.rejects(t.service.catalog(child), rejected('FORBIDDEN'))
  await t.run({ action: 'set_color', kidId: 'kid-3', color: '#ff55aa' })
  await t.run({
    action: 'packing',
    kidId: 'kid-3',
    itemId: 'pillow',
    checked: true,
  })
  assert.equal(kid(await t.board()).packing.pillow, true)
  assert.equal(kid(await t.board(), 'kid-1').packing.pillow, undefined)
  await t.run({ action: 'packing', checked: false }, parent)
  assert.equal(kid(await t.board()).packing.pillow, false)
})
test('migration preserves exact balances and catalogs without double-counting legacy reward debits', () => {
  const { source } = fixture()
  source.completions.push({
    id: 'debit',
    kidId: 'kid-3',
    choreId: 'reward:lego',
    timestamp: '2026-09-08T16:00:00Z',
    starsAwarded: -20,
  })
  source.rewardRedemptions.push({
    id: 'redemption',
    kidId: 'kid-3',
    rewardId: 'lego',
    timestamp: '2026-09-08T16:00:00Z',
    cost: 20,
  })
  const { core, days } = migrateLegacy(source, new Date('2026-09-09T15:00:00Z'))
  assert.equal(core.balances['kid-3'], 6)
  assert.deepEqual(core.chores, source.chores)
  assert.deepEqual(core.rewards, source.rewards)
  assert.equal(days['2026-09-08'].redemptions[0].reward.cost, 20)
  assert(core.oneOffRedemptions['kid-3:lego'])
  assert.equal(
    Object.values(days)
      .flatMap((d) => d.ledger)
      .reduce((sum, e) => sum + e.amount, 0),
    Object.values(core.balances).reduce((a, b) => a + b, 0),
  )
})

test('undated legacy credit stays exact and is explicitly identified instead of inventing a completion', () => {
  const { source } = fixture()
  source.completions.push({
    kidId: 'kid-1',
    starsAwarded: 1,
  } as (typeof source.completions)[number])
  const { core, days } = migrateLegacy(source, new Date('2026-09-09T15:00:00Z'))
  assert.equal(core.balances['kid-1'], 43)
  const day = days['2026-09-09']
  assert.equal(day.submissions.length, 0)
  assert.equal(day.ledger[0].legacySource?.timestampMissing, true)
})

test('one-off opportunities are date and child specific; a missed opportunity never rolls forward', async () => {
  const t = setup()
  const created = await t.run(
    {
      action: 'create_chore',
      chore: {
        title: 'Special job',
        emoji: '🧩',
        stars: 3,
        kidIds: ['kid-1', 'kid-3'],
        type: 'one-off',
        timeOfDay: 'morning',
      },
    },
    parent,
  )
  const b = await t.board(),
    c = kid(b).chores.find((c) => c.choreId === created.id)!
  assert(c.isNew)
  await t.run({ action: 'submit', occurrenceId: c.occurrenceId })
  assert(!kid(await t.board()).chores.some((c) => c.choreId === created.id))
  assert(
    kid(await t.board(), 'kid-1').chores.some((c) => c.choreId === created.id),
  )
  t.clock('2026-09-10T15:00:00Z')
  assert(
    !kid(await t.board(), 'kid-1').chores.some((c) => c.choreId === created.id),
  )
  await assert.rejects(
    t.run({ action: 'submit', occurrenceId: c.occurrenceId }),
    rejected('WINDOW_CLOSED'),
  )
})

test('parent order changes persist while per-child pause, resume and exclusive reappear dates are respected', async () => {
  const t = setup(),
    b = await t.board(),
    [bed, teeth] = kid(b).chores
  await t.run(
    {
      action: 'set_order',
      kidId: 'kid-3',
      group: 'morning',
      choreIds: [teeth.choreId, bed.choreId],
    },
    parent,
  )
  assert.equal(kid(await t.board()).chores[0].choreId, teeth.choreId)
  await t.run(
    {
      action: 'update_chore',
      choreId: bed.choreId,
      patch: { snoozedForKids: { 'kid-3': '2026-09-10' } },
    },
    parent,
  )
  assert(!kid(await t.board()).chores.some((c) => c.choreId === bed.choreId))
  assert(
    kid(await t.board(), 'kid-1').chores.some((c) => c.choreId === bed.choreId),
  )
  t.clock('2026-09-10T15:00:00Z')
  assert(kid(await t.board()).chores.some((c) => c.choreId === bed.choreId))
  await t.run({ action: 'pause_all', until: '2026-09-11' }, parent)
  t.clock('2026-09-11T01:00:00Z')
  await t.run({ action: 'pause_all', until: null }, parent)
  assert(kid(await t.board()).chores.some((c) => c.choreId.endsWith('pyjama')))
  assert.equal(kid(await t.board()).dailyProgress.earned, false)
})

test('rejected approval earns nothing and can only be resubmitted while still on time', async () => {
  const t = setup()
  const result = await t.run(
    {
      action: 'create_chore',
      chore: {
        title: 'Parent checks',
        emoji: '🔎',
        stars: 4,
        kidIds: ['kid-3'],
        type: 'repeated',
        timeOfDay: 'morning',
        requiresApproval: true,
      },
    },
    parent,
  )
  const c = kid(await t.board()).chores.find((c) => c.choreId === result.id)!
  const submission = await t.run({
    action: 'submit',
    occurrenceId: c.occurrenceId,
  })
  await t.run(
    { action: 'review', submissionId: submission.id, decision: 'reject' },
    parent,
  )
  assert.equal(kid(await t.board()).balance, 26)
  assert.equal((await t.service.approvals(parent)).length, 0)
  const retried = await t.run({
    action: 'submit',
    occurrenceId: c.occurrenceId,
  })
  assert.notEqual(retried.id, submission.id)
  t.clock('2026-09-09T20:00:00Z')
  await t.run(
    { action: 'review', submissionId: retried.id, decision: 'reject' },
    parent,
  )
  await assert.rejects(
    t.run({ action: 'submit', occurrenceId: c.occurrenceId }),
    rejected('WINDOW_CLOSED'),
  )
})

test('summary browsing exposes counts only; parent metadata and reward archival keep historical identity', async () => {
  const t = setup()
  await t.run({ action: 'update_kid', kidId: 'kid-3', name: 'Vina' }, parent)
  await t.run({ action: 'archive_reward', rewardId: 'movie' }, parent)
  assert.equal(kid(await t.board()).name, 'Vina')
  assert(!kid(await t.board()).rewards.some((r) => r.id === 'movie'))
  const summary = await t.service.kidSummary(child, '2026-09-10')
  assert(!JSON.stringify(summary).includes('title'))
  assert(!JSON.stringify(summary).includes('pyjama'))
  await assert.rejects(
    t.run({ action: 'skip', kidId: 'kid-3' }),
    rejected('INVALID_INPUT'),
  )
})
