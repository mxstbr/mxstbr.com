import { test } from 'node:test'
import assert from 'node:assert/strict'
import { blackoutWindow, currentTime, windowFor, TIME_WINDOWS } from './time'

test('Morning closes at 7:30 and Before lunch fills the gap to noon in both DST seasons', () => {
  for (const [day, start, boundary, noon] of [
    ['2026-09-23', '14:00', '14:30', '19:00'],
    ['2026-12-23', '15:00', '15:30', '20:00'],
  ]) {
    const at = (time: string) => `${day}T${time}:00.000Z`
    assert.deepEqual(windowFor(day, 'morning'), {
      opensAt: at(start),
      closesAt: at(boundary),
    })
    assert.deepEqual(windowFor(day, 'before-lunch'), {
      opensAt: at(boundary),
      closesAt: at(noon),
    })
    assert.deepEqual(currentTime(new Date(Date.parse(at(boundary)) - 1)), {
      day,
      period: 'morning',
      boundary: at(boundary),
    })
    assert.deepEqual(currentTime(new Date(at(boundary))), {
      day,
      period: 'before-lunch',
      boundary: at(noon),
    })
    assert.equal(currentTime(new Date(at(noon))).period, 'afternoon')
  }
  assert.deepEqual(TIME_WINDOWS.slice(0, 2), [
    { id: 'morning', name: 'Morning', opensAt: '07:00', closesAt: '07:30' },
    {
      id: 'before-lunch',
      name: 'Before lunch',
      opensAt: '07:30',
      closesAt: '12:00',
    },
  ])
})

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
