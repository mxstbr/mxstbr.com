import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Chore, Completion } from './data'
import {
  choreNeedsApproval,
  choreTimeDeadlineLabel,
  getDailyChoreProgress,
  getToday,
  hasChoreTimePassed,
  isChoreExpectedForDay,
  isChoreScheduledForDay,
  isOpenForKid,
  recurringStatus,
  scheduleLabel,
} from './utils'

const chore: Chore = {
  id: 'old-routine',
  kidIds: ['kid'],
  title: 'Morning chore',
  emoji: '*',
  stars: 1,
  type: 'repeated',
  timeOfDay: 'morning',
  createdAt: '2026-01-01T12:00:00Z',
  schedule: { cadence: 'daily' },
}

test('routine replacement switches on the Pacific day without altering history', () => {
  const old = { ...chore, archivedFrom: '2026-09-09' }
  const replacement = {
    ...chore,
    id: 'new-routine',
    scheduledFor: '2026-09-09',
  }
  for (const day of ['2026-01-01', '2026-09-08', '2026-09-09', '2026-09-10']) {
    const ctx = getToday(day)
    const newRoutine = day >= '2026-09-09'
    assert.equal(isOpenForKid(old, 'kid', [], ctx), !newRoutine)
    assert.equal(isOpenForKid(replacement, 'kid', [], ctx), newRoutine)
    assert.equal(isChoreExpectedForDay(old, 'kid', [], ctx), !newRoutine)
    assert.equal(isChoreExpectedForDay(replacement, 'kid', [], ctx), newRoutine)
    assert.equal(
      getDailyChoreProgress([old, replacement], [], 'kid', ctx).total,
      1,
    )
  }
  const completion: Completion = {
    id: 'completion',
    choreId: old.id,
    kidId: 'kid',
    timestamp: '2026-09-09T04:00:00Z',
    starsAwarded: 1,
  }
  assert.deepEqual(
    getDailyChoreProgress(
      [old, replacement],
      [completion],
      'kid',
      getToday('2026-09-08'),
    ),
    { total: 1, completed: 1, remaining: 0, skipped: 0 },
  )
  assert.equal(
    recurringStatus(old, 'kid', [], getToday('2026-09-09')).label,
    'Archived from 2026-09-09',
  )
  assert.equal(
    recurringStatus(replacement, 'kid', [], getToday('2026-09-08')).label,
    'Starts 2026-09-09',
  )
})

test('archived routines stay schedulable on pre-archive days the admin can back-fill, and stop at the boundary', () => {
  // The admin "Save completion" form posts a chosen `day`; applyCompletion gates
  // recording on isChoreScheduledForDay(chore, getToday(targetDay)). This locks the
  // day-context contract that makes dropping the client-side `archived` disabled-gate safe.
  const old = { ...chore, archivedFrom: '2026-09-10' }
  // last active Pacific day (archivedFrom − 1) is still recordable by the server
  assert.equal(isChoreScheduledForDay(old, getToday('2026-09-09')), true)
  // archivedFrom is the first inactive day; it and every later day are rejected
  assert.equal(isChoreScheduledForDay(old, getToday('2026-09-10')), false)
  assert.equal(isChoreScheduledForDay(old, getToday('2026-09-11')), false)
  // days before the routine started remain out of range
  assert.equal(isChoreScheduledForDay(old, getToday('2025-12-31')), false)

  // weekly archived routine: a pre-archive day must also fall on a scheduled weekday
  const weekly = {
    ...chore,
    schedule: { cadence: 'weekly' as const, daysOfWeek: [2] },
    archivedFrom: '2026-09-10',
  }
  // 2026-09-08 is a Tuesday → scheduled weekday, before archive → recordable
  assert.equal(isChoreScheduledForDay(weekly, getToday('2026-09-08')), true)
  // 2026-09-07 is a Monday → not a scheduled weekday → not recordable even pre-archive
  assert.equal(isChoreScheduledForDay(weekly, getToday('2026-09-07')), false)
})

test('school chores repeat once each weekday and do not count on weekends', () => {
  const school = {
    ...chore,
    scheduledFor: '2026-09-09',
    schedule: { cadence: 'daily' as const, daysOfWeek: [1, 2, 3, 4, 5] },
  }
  for (const day of [
    '2026-09-09',
    '2026-09-10',
    '2026-09-11',
    '2026-09-14',
    '2026-09-15',
  ]) {
    assert.equal(isOpenForKid(school, 'kid', [], getToday(day)), true)
  }
  for (const day of ['2026-09-08', '2026-09-12', '2026-09-13']) {
    assert.equal(isChoreScheduledForDay(school, getToday(day)), false)
    assert.equal(isOpenForKid(school, 'kid', [], getToday(day)), false)
    assert.equal(isChoreExpectedForDay(school, 'kid', [], getToday(day)), false)
  }
  const completions = [
    {
      id: 'done',
      choreId: school.id,
      kidId: 'kid',
      timestamp: '2026-09-09T17:00:00Z',
      starsAwarded: 1,
    },
  ]
  assert.equal(
    isOpenForKid(school, 'kid', completions, getToday('2026-09-09')),
    false,
  )
  assert.equal(
    isOpenForKid(school, 'kid', completions, getToday('2026-09-10')),
    true,
  )
  assert.equal(scheduleLabel(school), 'Daily · Mon, Tue, Wed, Thu, Fri')
})

test('date boundaries also apply to one-off and perpetual chores', () => {
  for (const type of ['one-off', 'perpetual'] as const) {
    const task = {
      ...chore,
      type,
      scheduledFor: '2026-09-09',
      archivedFrom: '2026-09-10',
    }
    assert.equal(isOpenForKid(task, 'kid', [], getToday('2026-09-08')), false)
    assert.equal(isOpenForKid(task, 'kid', [], getToday('2026-09-09')), true)
    assert.equal(isOpenForKid(task, 'kid', [], getToday('2026-09-10')), false)
  }
})

test('snooze return date remains inclusive for availability', () => {
  const task = { ...chore, snoozedForKids: { kid: '2026-09-09' } }
  assert.equal(isOpenForKid(task, 'kid', [], getToday('2026-09-08')), false)
  assert.equal(isOpenForKid(task, 'kid', [], getToday('2026-09-09')), true)
})

test('evening completion and skipping use the exact 8:15pm cutoff', () => {
  assert.equal(choreTimeDeadlineLabel('evening'), '8:15pm')
  assert.equal(hasChoreTimePassed('evening', 20 * 60 + 14), false)
  assert.equal(hasChoreTimePassed('evening', 20 * 60 + 15), true)
  const evening = { ...chore, timeOfDay: 'evening' as const }
  assert.equal(
    choreNeedsApproval(evening, '2026-09-09', new Date('2026-09-10T03:14:59Z')),
    false,
  )
  assert.equal(
    choreNeedsApproval(evening, '2026-09-09', new Date('2026-09-10T03:15:00Z')),
    true,
  )
  assert.equal(
    choreNeedsApproval(evening, '2026-09-08', new Date('2026-09-10T02:00:00Z')),
    true,
  )
  assert.equal(hasChoreTimePassed(undefined, 23 * 60), false)
  assert.equal(choreTimeDeadlineLabel('morning'), '12pm')
  assert.equal(choreTimeDeadlineLabel('afternoon'), '5pm')
  assert.equal(choreTimeDeadlineLabel('night'), '10pm')
})
