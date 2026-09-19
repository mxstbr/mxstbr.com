import type { ChoreState } from '../../(os)/chores2/data'
import {
  emptyDay,
  ensurePlan,
  entitlementKey,
  occurrenceId,
  orderKey,
  updateOrders,
} from './domain'
import { pacificDay, windowFor } from './time'
import {
  PERIODS,
  type Core,
  type Day,
  type Group,
  type Occurrence,
  type Submission,
} from './types'

// The written September 8 sequence is explicit. Later-added definitions append
// without changing that sequence (including the subsequently added foot cream).
const INITIAL_ORDER = {
  morning: [
    'routine-2026-09-09-bed',
    'routine-2026-09-09-school-clothes',
    'routine-2026-09-09-morning-teeth',
    'routine-2026-09-09-morning-inhaler',
    'routine-2026-09-09-face-lotion',
    'routine-2026-09-09-meds',
  ],
  afternoon: [
    'routine-2026-09-09-lunch',
    'routine-2026-09-09-backpack',
    'routine-2026-09-09-homework',
  ],
  evening: [
    'routine-2026-09-09-pyjama',
    'routine-2026-09-09-evening-teeth',
    'routine-2026-09-09-evening-inhaler',
  ],
  night: ['routine-2026-09-09-body-lotion'],
  bonus: [],
}
export function migrateLegacy(
  source: ChoreState,
  now: Date,
): { core: Core; days: Record<string, Day> } {
  if (
    !source?.kids?.length ||
    !Array.isArray(source.chores) ||
    !Array.isArray(source.completions) ||
    !Array.isArray(source.rewards) ||
    !Array.isArray(source.rewardRedemptions)
  )
    throw new Error('The legacy snapshot is incomplete; import stopped.')
  const timestamp = now.toISOString(),
    today = pacificDay(now)
  const core: Core = {
    version: 2,
    revision: 1,
    initializedAt: timestamp,
    kids: structuredClone(source.kids),
    chores: structuredClone(source.chores),
    rewards: structuredClone(source.rewards),
    balances: Object.fromEntries(source.kids.map((k) => [k.id, 0])),
    orders: {},
    pending: {},
    oneOffCompletions: {},
    oneOffRedemptions: {},
    lastCompleted: {},
    packing: {},
    packingImported: false,
    notificationsEnabled: true,
    migration: {
      sourceKey: 'chores:mxstbr:family-board',
      timestamp,
      counts: {
        kids: source.kids.length,
        chores: source.chores.length,
        rewards: source.rewards.length,
        completions: source.completions.length,
        redemptions: source.rewardRedemptions.length,
      },
      openingBalances: {},
    },
  }
  core.kids.forEach((kid, i) => {
    if (kid.color.toLowerCase() === '#ffffff')
      kid.color = ['#2870c6', '#af4f13', '#9250b3'][i % 3]
  })
  for (const kid of core.kids)
    for (const group of [...PERIODS, 'bonus'] as Group[]) {
      core.orders[orderKey(kid.id, group)] = INITIAL_ORDER[group].filter((id) =>
        core.chores.some((c) => c.id === id && c.kidIds.includes(kid.id)),
      )
    }
  updateOrders(core)
  const days: Record<string, Day> = {}
  const getDay = (day: string) => (days[day] ||= emptyDay(day))
  for (let index = 0; index < source.completions.length; index++) {
    const c = source.completions[index]
    if (
      !Number.isFinite(c.starsAwarded) ||
      !core.kids.some((k) => k.id === c.kidId)
    )
      throw new Error(
        `Invalid legacy credit at index ${index}; import stopped.`,
      )
    const timestampMissing = !Number.isFinite(Date.parse(c.timestamp))
    const recordedAt = timestampMissing ? timestamp : c.timestamp
    const day = getDay(
        timestampMissing ? today : pacificDay(new Date(c.timestamp)),
      ),
      id = `${day.day}:legacy:${c.id || `undated-${index}`}`
    core.balances[c.kidId] += c.starsAwarded
    const chore = core.chores.find((chore) => chore.id === c.choreId)
    const ledger = {
      id,
      kidId: c.kidId,
      amount: c.starsAwarded,
      kind: 'legacy' as const,
      sourceId: id,
      timestamp: recordedAt,
      actor: 'legacy-import',
      note: timestampMissing
        ? 'Undated legacy credit; original time was not recorded. Imported at the displayed time.'
        : chore
          ? chore.title
          : c.choreId,
      legacySource: {
        index,
        timestampMissing,
        ...(c.id ? { originalId: c.id } : {}),
      },
    }
    day.ledger.push(ledger)
    if (
      c.choreId === `daily-bonus:${day.day}` ||
      c.choreId === `daily-bonus-${day.day}`
    )
      day.awards[`${c.kidId}:daily`] = id
    if (!chore || c.starsAwarded < 0 || timestampMissing) continue
    const group = chore.timeOfDay || 'bonus'
    const oid = occurrenceId(day.day, c.kidId, chore.id)
    if (!day.occurrences.some((o) => o.id === oid)) {
      const o: Occurrence = {
        id: oid,
        day: day.day,
        kidId: c.kidId,
        choreId: chore.id,
        chore: structuredClone(chore),
        group,
        ...windowFor(day.day, group),
        required: group !== 'bonus' || chore.type !== 'perpetual',
        order: (core.orders[orderKey(c.kidId, group)] || []).indexOf(chore.id),
      }
      day.occurrences.push(o)
    }
    const s: Submission = {
      id,
      occurrenceId: oid,
      kidId: c.kidId,
      submittedAt: c.timestamp,
      stars: c.starsAwarded,
      status: 'approved',
      source: 'legacy',
      legacyId: c.id,
    }
    day.submissions.push(s)
    const key = entitlementKey(c.kidId, chore.id)
    if (!core.lastCompleted[key] || core.lastCompleted[key] < c.timestamp)
      core.lastCompleted[key] = c.timestamp
    if (chore.type === 'one-off') core.oneOffCompletions[key] = id
  }
  for (const r of source.rewardRedemptions) {
    const day = getDay(pacificDay(new Date(r.timestamp)))
    const reward = core.rewards.find((reward) => reward.id === r.rewardId)
    const id = `${day.day}:legacy:${r.id}`
    // Legacy balances already include a negative completion for each purchase.
    // Import redemption metadata/entitlements, never a second debit.
    core.oneOffRedemptions[entitlementKey(r.kidId, r.rewardId)] = id
    if (reward)
      day.redemptions.push({
        id,
        kidId: r.kidId,
        reward: { ...structuredClone(reward), cost: r.cost },
        timestamp: r.timestamp,
        ledgerId:
          day.ledger.find(
            (e) =>
              e.kidId === r.kidId &&
              e.timestamp === r.timestamp &&
              e.amount === -r.cost,
          )?.id || 'legacy-unlinked',
      })
  }
  core.migration.openingBalances = { ...core.balances }
  for (const day of Object.values(days)) {
    // Old history cannot establish past submission windows or catalog versions.
    // Preserve its recorded facts, without inventing historical missed targets.
    if (day.day < today) day.planned = true
  }
  ensurePlan(core, getDay(today))
  return { core, days }
}
