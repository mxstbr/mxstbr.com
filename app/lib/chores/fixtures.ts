import type { Chore, Core, Kid, Period, Reward } from './types'
import { emptyDay, ensurePlan, updateOrders } from './domain'
import { pacificDay } from './time'

export function fixture(now = new Date('2026-09-09T14:15:00Z')) {
  const catalog: { kids: Kid[]; chores: Chore[]; rewards: Reward[] } = {
    kids: [
      { id: 'kid-1', name: 'Dilan', color: '#2870c6' },
      { id: 'kid-2', name: 'Darian', color: '#af4f13' },
      { id: 'kid-3', name: 'Devina', color: '#9250b3' },
    ],
    chores: [],
    rewards: [],
  }
  const all = catalog.kids.map((k) => k.id)
  const add = (
    id: string,
    title: string,
    emoji: string,
    timeOfDay: Period | undefined,
    kidIds = all,
    weekdays = false,
  ) =>
    catalog.chores.push({
      id: `routine-2026-09-09-${id}`,
      title,
      emoji,
      timeOfDay,
      kidIds,
      stars: 1,
      type: 'repeated',
      schedule: {
        cadence: 'daily',
        ...(weekdays ? { daysOfWeek: [1, 2, 3, 4, 5] } : {}),
      },
      scheduledFor: '2026-09-01',
      createdAt: '2026-09-01T14:00:00Z',
    })
  add('bed', 'Make your bed', '🛏️', 'morning')
  add(
    'school-clothes',
    'Change into your school clothes including socks',
    '👕',
    'morning',
    all.slice(0, 2),
    true,
  )
  add('morning-teeth', 'Brush your teeth and your tongue', '🪥', 'morning')
  add('morning-inhaler', 'Do your inhaler', '🫁', 'morning', ['kid-1'])
  add('face-lotion', 'Put lotion on your face', '🧴', 'morning', ['kid-1'])
  add('meds', 'Take your meds', '💊', 'morning', ['kid-2'])
  add(
    'lunch',
    'Bring your lunch bag to the kitchen',
    '👜',
    'afternoon',
    all.slice(0, 2),
    true,
  )
  add(
    'backpack',
    'Put your backpack in the white bin',
    '🎒',
    'afternoon',
    all.slice(0, 2),
    true,
  )
  add(
    'homework',
    'Finish your homework for the day',
    '📝',
    'afternoon',
    all.slice(0, 2),
    true,
  )
  add('pyjama', 'Change into your pyjama', '😴', 'evening')
  add('evening-teeth', 'Brush your teeth and your tongue', '🪥', 'evening')
  add('evening-inhaler', 'Do your inhaler', '🫁', 'evening', ['kid-1'])
  add('body-lotion', 'Put lotion on your whole body', '🧴', 'night', ['kid-1'])
  catalog.chores.push({
    id: 'bonus',
    kidIds: all,
    title: 'Do six pull-ups',
    emoji: '💪',
    stars: 1,
    type: 'perpetual',
    createdAt: '2026-09-01T14:00:00Z',
    scheduledFor: '2026-09-01',
  })
  catalog.rewards.push(
    {
      id: 'movie',
      kidIds: all,
      title: 'Choose a movie',
      emoji: '🎬',
      cost: 20,
      type: 'perpetual',
      createdAt: '2026-09-01T14:00:00Z',
    },
    {
      id: 'lego',
      kidIds: all,
      title: 'A small LEGO set',
      emoji: '🧱',
      cost: 50,
      type: 'one-off',
      createdAt: '2026-09-01T14:00:00Z',
    },
  )
  const timestamp = now.toISOString()
  const core: Core = {
    version: 2,
    revision: 1,
    initializedAt: timestamp,
    ...catalog,
    balances: Object.fromEntries(all.map((id, i) => [id, [42, 38, 26][i]])),
    orders: {},
    pending: {},
    oneOffCompletions: {},
    oneOffRedemptions: {},
    lastCompleted: {},
    packing: {},
    packingImported: false,
    notificationsEnabled: true,
    migration: {
      sourceKey: 'test-fixture',
      timestamp,
      counts: {},
      openingBalances: {},
    },
  }
  updateOrders(core)
  const day = emptyDay(pacificDay(now))
  ensurePlan(core, day)
  return { core, days: { [day.day]: day } }
}
