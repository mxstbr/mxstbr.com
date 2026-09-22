import { test } from 'node:test'
import assert from 'node:assert/strict'
import { blackoutWindow } from './time'

test('blackout is allowed only from 8:30pm through 5:59am Pacific, including DST changes', () => {
  for (const [now, active, boundary] of [
    ['2026-09-22T01:52:00Z', false, '2026-09-22T03:30:00.000Z'],
    ['2026-09-22T03:29:59Z', false, '2026-09-22T03:30:00.000Z'],
    ['2026-09-22T03:30:00Z', true, '2026-09-22T13:00:00.000Z'],
    ['2026-09-22T07:00:00Z', true, '2026-09-22T13:00:00.000Z'],
    ['2026-09-22T12:59:59Z', true, '2026-09-22T13:00:00.000Z'],
    ['2026-09-22T13:00:00Z', false, '2026-09-23T03:30:00.000Z'],
    ['2026-12-22T04:30:00Z', true, '2026-12-22T14:00:00.000Z'],
    ['2026-12-22T14:00:00Z', false, '2026-12-23T04:30:00.000Z'],
    ['2026-03-08T04:30:00Z', true, '2026-03-08T13:00:00.000Z'],
    ['2026-11-01T03:30:00Z', true, '2026-11-01T14:00:00.000Z'],
  ] as const)
    assert.deepEqual(blackoutWindow(new Date(now)), { active, boundary }, now)
})
