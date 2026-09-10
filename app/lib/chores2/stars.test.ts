import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatStarLabel, starUnit } from './stars'

test('formatStarLabel singularizes only for 1', () => {
  assert.equal(formatStarLabel(1), '1 star')
  assert.equal(formatStarLabel(0), '0 stars')
  assert.equal(formatStarLabel(2), '2 stars')
  assert.equal(formatStarLabel(10), '10 stars')
})
test('starUnit singularizes only for 1', () => {
  assert.equal(starUnit(1), 'star')
  assert.equal(starUnit(0), 'stars')
  assert.equal(starUnit(2), 'stars')
  assert.equal(starUnit(10), 'stars')
})
