import type { ChoreState } from '../../(os)/chores2/data'
import { migrateLegacy } from './migration'

export function fixture(now = new Date('2026-09-09T15:00:00Z')) {
  const source: ChoreState = {
    kids: [
      { id: 'kid-1', name: 'Dilan', color: '#2870c6' },
      { id: 'kid-2', name: 'Darian', color: '#af4f13' },
      { id: 'kid-3', name: 'Devina', color: '#9250b3' },
    ],
    chores: [],
    completions: [],
    rewards: [],
    rewardRedemptions: [],
  }
  const all = source.kids.map((k) => k.id)
  const add = (
    id: string,
    title: string,
    emoji: string,
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | undefined,
    kidIds = all,
    weekdays = false,
  ) =>
    source.chores.push({
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
  source.chores.push({
    id: 'bonus',
    kidIds: all,
    title: 'Do six pull-ups',
    emoji: '💪',
    stars: 1,
    type: 'perpetual',
    createdAt: '2026-09-01T14:00:00Z',
    scheduledFor: '2026-09-01',
  })
  source.rewards.push(
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
  all.forEach((id, i) =>
    source.completions.push({
      id: `opening-${id}`,
      choreId: 'manual-adjustment',
      kidId: id,
      starsAwarded: [42, 38, 26][i],
      timestamp: '2026-09-08T15:00:00Z',
    }),
  )
  return { source, ...migrateLegacy(source, now) }
}
