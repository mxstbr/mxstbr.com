import { randomUUID } from 'node:crypto'
import { PACKING_ITEMS } from './packing'
import { currentTime, pacificDay, weekday, windowFor } from './time'
import {
  fail,
  PERIODS,
  type Actor,
  type Board,
  type Chore,
  type ChoreCard,
  type CommandResult,
  type Core,
  type Day,
  type Group,
  type LedgerEntry,
  type Occurrence,
  type Progress,
  type Reward,
  type Submission,
  type Transaction,
} from './types'

export const orderKey = (kidId: string, group: Group) => `${kidId}:${group}`
export const entitlementKey = (kidId: string, id: string) => `${kidId}:${id}`
export const occurrenceId = (day: string, kidId: string, choreId: string) =>
  `${day}:${kidId}:${choreId}`
export const emptyDay = (day: string): Day => ({
  day,
  occurrences: [],
  submissions: [],
  ledger: [],
  redemptions: [],
  awards: {},
  planned: false,
})

export function requireParent(actor: Actor) {
  if (actor.kind !== 'parent')
    fail('FORBIDDEN', 'Only a parent can do that through ChatGPT.')
}
export function requireKid(core: Core, actor: Actor, kidId: string) {
  if (actor.kind === 'kid' && !actor.kidIds.includes(kidId))
    fail('FORBIDDEN', 'This device cannot change that child’s board.')
  return (
    core.kids.find((k) => k.id === kidId) ??
    fail('KID_NOT_FOUND', 'That child no longer exists.')
  )
}
export function scheduled(chore: Chore, kidId: string, day: string) {
  if (!chore.kidIds.includes(kidId)) return false
  const starts = chore.scheduledFor || pacificDay(new Date(chore.createdAt))
  if (starts > day || (chore.archivedFrom && chore.archivedFrom <= day))
    return false
  if (chore.type === 'one-off' && starts !== day) return false
  if (
    chore.type === 'repeated' &&
    chore.schedule?.daysOfWeek?.length &&
    !chore.schedule.daysOfWeek.includes(weekday(day))
  )
    return false
  return true
}
export function paused(chore: Chore, kidId: string, day: string) {
  return Boolean(
    (chore.pausedUntil && chore.pausedUntil >= day) ||
      (chore.snoozedUntil && chore.snoozedUntil > day) ||
      (chore.snoozedForKids?.[kidId] && chore.snoozedForKids[kidId]! > day),
  )
}
function makeOccurrence(
  core: Core,
  chore: Chore,
  kidId: string,
  day: string,
): Occurrence {
  const group = chore.timeOfDay || 'bonus'
  const position = (core.orders[orderKey(kidId, group)] || []).indexOf(chore.id)
  return {
    id: occurrenceId(day, kidId, chore.id),
    day,
    kidId,
    choreId: chore.id,
    chore: structuredClone(chore),
    group,
    ...windowFor(day, group),
    required: group !== 'bonus' || chore.type !== 'perpetual',
    order: position < 0 ? 100000 : position,
  }
}
export function ensurePlan(core: Core, day: Day) {
  if (day.planned) return
  for (const kid of core.kids)
    for (const chore of core.chores) {
      if (!scheduled(chore, kid.id, day.day) || paused(chore, kid.id, day.day))
        continue
      const prior = core.oneOffCompletions[entitlementKey(kid.id, chore.id)]
      if (chore.type === 'one-off' && prior && prior.slice(0, 10) < day.day)
        continue
      if (
        !day.occurrences.some(
          (o) => o.id === occurrenceId(day.day, kid.id, chore.id),
        )
      )
        day.occurrences.push(makeOccurrence(core, chore, kid.id, day.day))
    }
  day.planned = true
}
// A catalog edit may amend future work, but it cannot erase an obligation that
// has already opened. Keeping the plan is what prevents a pause from earning stars.
export function amendPlan(core: Core, day: Day, now: Date) {
  for (const o of day.occurrences) {
    const definition = core.chores.find((c) => c.id === o.choreId)
    o.order = (core.orders[orderKey(o.kidId, o.group)] || []).indexOf(o.choreId)
    if (o.order < 0) o.order = 100000
    if (day.submissions.some((s) => s.occurrenceId === o.id)) continue
    // A future pause may have withdrawn this opportunity before it opened.
    // Resuming during its window must make it available again.
    if (
      o.withdrawn &&
      definition &&
      scheduled(definition, o.kidId, day.day) &&
      !paused(definition, o.kidId, day.day)
    ) {
      const restored = makeOccurrence(core, definition, o.kidId, day.day)
      if (Date.parse(restored.closesAt) > now.getTime())
        Object.assign(o, restored, { withdrawn: false })
    }
    if (Date.parse(o.opensAt) <= now.getTime()) continue
    if (
      !definition ||
      !scheduled(definition, o.kidId, day.day) ||
      paused(definition, o.kidId, day.day)
    )
      o.withdrawn = true
    else
      Object.assign(o, makeOccurrence(core, definition, o.kidId, day.day), {
        withdrawn: false,
      })
  }
  for (const kid of core.kids)
    for (const chore of core.chores) {
      if (!scheduled(chore, kid.id, day.day) || paused(chore, kid.id, day.day))
        continue
      if (
        day.occurrences.some(
          (o) => o.id === occurrenceId(day.day, kid.id, chore.id),
        )
      )
        continue
      const o = makeOccurrence(core, chore, kid.id, day.day)
      if (Date.parse(o.closesAt) > now.getTime()) day.occurrences.push(o)
    }
}
export const approved = (day: Day, id: string) =>
  day.submissions.filter(
    (s) => s.occurrenceId === id && s.status === 'approved',
  )
export const pending = (day: Day, id: string) =>
  day.submissions.find((s) => s.occurrenceId === id && s.status === 'pending')
export function progress(
  day: Day,
  kidId: string,
  group: Group | 'daily',
  now: Date,
): Progress {
  const entries = day.occurrences.filter(
    (o) =>
      o.kidId === kidId &&
      o.required &&
      !o.withdrawn &&
      (group === 'daily' || o.group === group),
  )
  const completed = entries.filter((o) => approved(day, o.id).length).length
  const waiting = entries.filter(
    (o) => !approved(day, o.id).length && pending(day, o.id),
  ).length
  const missed = entries.filter(
    (o) =>
      !approved(day, o.id).length &&
      !pending(day, o.id) &&
      Date.parse(o.closesAt) <= now.getTime(),
  ).length
  return {
    total: entries.length,
    completed,
    pending: waiting,
    missed,
    stars: group === 'daily' ? 10 : 2,
    earned: Boolean(day.awards[orderKey(kidId, group as Group)]),
  }
}
function post(
  tx: Transaction,
  day: Day,
  actor: Actor,
  kidId: string,
  amount: number,
  kind: LedgerEntry['kind'],
  sourceId: string,
  note: string,
  now: Date,
  reverses?: string,
) {
  const entry: LedgerEntry = {
    id: `${day.day}:${randomUUID()}`,
    kidId,
    amount,
    kind,
    sourceId,
    timestamp: now.toISOString(),
    actor: actor.id,
    note,
    ...(reverses ? { reverses } : {}),
  }
  day.ledger.push(entry)
  tx.core.balances[kidId] = (tx.core.balances[kidId] || 0) + amount
  return entry
}
export function notify(
  tx: Transaction,
  text: string,
  now: Date,
  day?: string,
  submissionId?: string,
) {
  tx.notifications.push({
    id: randomUUID(),
    text: `[Chores] ${text}`,
    status: 'pending',
    createdAt: now.toISOString(),
    attempts: 0,
    nextAttemptAt: now.getTime(),
    day,
    submissionId,
  })
}
export function reconcileBonuses(
  tx: Transaction,
  day: Day,
  actor: Actor,
  kidId: string,
  now: Date,
  reverseUnearned = true,
) {
  let periodBonus = 0,
    dailyBonus = 0
  for (const group of [...PERIODS, 'daily'] as const) {
    const p = progress(day, kidId, group, now)
    const key = `${kidId}:${group}`
    const earned = p.total > 0 && p.total === p.completed
    const current = day.awards[key]
    if (earned && !current) {
      const entry = post(
        tx,
        day,
        actor,
        kidId,
        p.stars,
        group === 'daily' ? 'daily-bonus' : 'period-bonus',
        `${day.day}:${key}`,
        `${group} completion bonus`,
        now,
      )
      day.awards[key] = entry.id
      if (group === 'daily') dailyBonus += p.stars
      else periodBonus += p.stars
      const kid = tx.core.kids.find((k) => k.id === kidId)!
      notify(
        tx,
        `${kid.name} earned ${p.stars} bonus stars for completing every task in ${group === 'daily' ? 'the day' : `the ${group}`} (${day.day}).`,
        now,
        day.day,
      )
    } else if (!earned && current && reverseUnearned) {
      const original = day.ledger.find((e) => e.id === current)
      post(
        tx,
        day,
        actor,
        kidId,
        -(original?.amount ?? p.stars),
        'reversal',
        `${day.day}:${key}`,
        `${group} bonus reversed because required work is incomplete`,
        now,
        current,
      )
      day.awards[key] = null
    }
  }
  return { periodBonus, dailyBonus }
}
function actionable(tx: Transaction, actor: Actor, id: string, now: Date) {
  const day = tx.days[id.slice(0, 10)]
  const o =
    day?.occurrences.find((o) => o.id === id) ??
    fail('OCCURRENCE_NOT_FOUND', 'Refresh to see the chores available now.')
  requireKid(tx.core, actor, o.kidId)
  if (
    o.day !== pacificDay(now) ||
    now.getTime() < Date.parse(o.opensAt) ||
    now.getTime() >= Date.parse(o.closesAt)
  )
    fail(
      'WINDOW_CLOSED',
      'That chore is outside its time window. Refresh to see what is available now.',
    )
  const definition = tx.core.chores.find((c) => c.id === o.choreId)
  if (
    o.withdrawn ||
    !definition ||
    !scheduled(definition, o.kidId, o.day) ||
    paused(definition, o.kidId, o.day) ||
    (definition.timeOfDay || 'bonus') !== o.group
  )
    fail('UNAVAILABLE', 'That chore is no longer available now.')
  return { day, o }
}
export function submit(
  tx: Transaction,
  actor: Actor,
  id: string,
  now: Date,
): CommandResult {
  const { day, o } = actionable(tx, actor, id, now)
  const existing =
    pending(day, id) ||
    (o.chore.type !== 'perpetual' ? approved(day, id)[0] : undefined)
  if (existing)
    return {
      status: 'already_processed',
      id: existing.id,
      message:
        existing.status === 'pending'
          ? 'Your request is already saved.'
          : 'That chore is already complete.',
      balance: tx.core.balances[o.kidId],
    }
  const key = entitlementKey(o.kidId, o.choreId)
  if (o.chore.type === 'one-off' && tx.core.oneOffCompletions[key])
    fail('ALREADY_COMPLETED', 'This one-off chore is already complete.')
  if (
    o.chore.type === 'perpetual' &&
    now.getTime() - Date.parse(tx.core.lastCompleted[key] || '1970-01-01') <
      5000
  )
    fail('COOLDOWN', 'Wait a moment before doing that repeatable chore again.')
  const s: Submission = {
    id: `${day.day}:${randomUUID()}`,
    occurrenceId: id,
    kidId: o.kidId,
    submittedAt: now.toISOString(),
    stars: o.chore.stars,
    status: o.chore.requiresApproval ? 'pending' : 'approved',
    source: 'chores2',
  }
  day.submissions.push(s)
  const kid = tx.core.kids.find((k) => k.id === o.kidId)!
  if (s.status === 'pending') {
    tx.core.pending[s.id] = day.day
    notify(
      tx,
      `${kid.name} asks for approval: ${o.chore.emoji} ${o.chore.title} (+${s.stars} stars). Occurrence: ${day.day}, ${o.group}. Submitted on time at ${s.submittedAt}. Request: ${s.id}. Ask ChatGPT to approve this exact Chores2 request.`,
      now,
      day.day,
      s.id,
    )
    return {
      status: 'pending',
      id: s.id,
      stars: 0,
      balance: tx.core.balances[o.kidId],
      message: 'Request saved. Your parent will be notified.',
    }
  }
  post(
    tx,
    day,
    actor,
    o.kidId,
    s.stars,
    'chore',
    s.id,
    `${o.chore.emoji} ${o.chore.title}`,
    now,
  )
  tx.core.lastCompleted[key] = s.submittedAt
  if (o.chore.type === 'one-off') tx.core.oneOffCompletions[key] = s.id
  const bonuses = reconcileBonuses(tx, day, actor, o.kidId, now)
  notify(
    tx,
    `${kid.name} completed ${o.chore.emoji} ${o.chore.title} (+${s.stars} stars; ${tx.core.balances[o.kidId]} total). Completion: ${s.id}.`,
    now,
    day.day,
  )
  return {
    status: 'completed',
    id: s.id,
    stars: s.stars,
    ...bonuses,
    balance: tx.core.balances[o.kidId],
    message: `+${s.stars} ${s.stars === 1 ? 'star' : 'stars'}. Nice work!`,
  }
}
export function review(
  tx: Transaction,
  actor: Actor,
  id: string,
  decision: 'approve' | 'reject',
  now: Date,
): CommandResult {
  requireParent(actor)
  const day = tx.days[id.slice(0, 10)]
  const s =
    day?.submissions.find((s) => s.id === id) ??
    fail('SUBMISSION_NOT_FOUND', 'That exact submission does not exist.')
  if (s.status !== 'pending')
    return {
      status: 'already_processed',
      id,
      message: `This submission is already ${s.status}.`,
    }
  const o = day.occurrences.find((o) => o.id === s.occurrenceId)!
  // Approval checks the immutable accepted submission, never today's window.
  if (
    s.source !== 'chores2' ||
    Date.parse(s.submittedAt) < Date.parse(o.opensAt) ||
    Date.parse(s.submittedAt) >= Date.parse(o.closesAt)
  )
    fail('INVALID_SUBMISSION', 'This is not an accepted on-time submission.')
  s.reviewedAt = now.toISOString()
  s.reviewedBy = actor.id
  delete tx.core.pending[id]
  if (decision === 'reject') {
    s.status = 'rejected'
    return {
      status: 'rejected',
      id,
      stars: 0,
      message: 'Submission rejected; no stars awarded.',
    }
  }
  s.status = 'approved'
  post(
    tx,
    day,
    actor,
    s.kidId,
    s.stars,
    'chore',
    id,
    `${o.chore.emoji} ${o.chore.title} (approved)`,
    now,
  )
  const key = entitlementKey(s.kidId, o.choreId)
  tx.core.lastCompleted[key] = now.toISOString()
  if (o.chore.type === 'one-off') tx.core.oneOffCompletions[key] = id
  const bonuses = reconcileBonuses(tx, day, actor, s.kidId, now)
  notify(
    tx,
    `${tx.core.kids.find((k) => k.id === s.kidId)!.name}'s ${o.chore.title} was approved (+${s.stars} stars). Submitted ${s.submittedAt}; approved ${s.reviewedAt}; occurrence ${day.day}, ${o.group}.`,
    now,
    day.day,
  )
  return {
    status: 'approved',
    id,
    stars: s.stars,
    ...bonuses,
    balance: tx.core.balances[s.kidId],
    message: 'The on-time submission is approved.',
  }
}
export function undo(
  tx: Transaction,
  actor: Actor,
  id: string,
  now: Date,
): CommandResult {
  const day = tx.days[id.slice(0, 10)]
  const s =
    day?.submissions.find((s) => s.id === id) ??
    fail('SUBMISSION_NOT_FOUND', 'That exact completion does not exist.')
  const o = day.occurrences.find((o) => o.id === s.occurrenceId)!
  requireKid(tx.core, actor, s.kidId)
  const clock = currentTime(now)
  if (
    actor.kind === 'kid' &&
    (day.day !== clock.day || (o.group !== 'bonus' && o.group !== clock.period))
  )
    fail(
      'WINDOW_CLOSED',
      'Only your currently displayed completions can be undone here.',
    )
  if (s.status === 'undone')
    return {
      status: 'already_processed',
      id,
      message: 'That exact completion was already undone.',
    }
  if (s.status !== 'approved')
    fail('NOT_COMPLETED', 'Only a completed submission can be undone.')
  const original =
    day.ledger.find(
      (e) => e.sourceId === id && e.amount === s.stars && e.kind !== 'reversal',
    ) ??
    fail(
      'LEDGER_NOT_FOUND',
      'The recorded credit could not be found; no changes made.',
    )
  s.status = 'undone'
  s.undoneAt = now.toISOString()
  post(
    tx,
    day,
    actor,
    s.kidId,
    -original.amount,
    'reversal',
    id,
    `Undo: ${o.chore.title}`,
    now,
    original.id,
  )
  const key = entitlementKey(s.kidId, o.choreId)
  if (tx.core.oneOffCompletions[key] === id)
    delete tx.core.oneOffCompletions[key]
  const before = tx.core.balances[s.kidId] + original.amount
  reconcileBonuses(tx, day, actor, s.kidId, now)
  notify(
    tx,
    `${tx.core.kids.find((k) => k.id === s.kidId)!.name}'s completion of ${o.chore.title} was undone. Exact completion: ${id}; balance change ${tx.core.balances[s.kidId] - before}.`,
    now,
    day.day,
  )
  return {
    status: 'undone',
    id,
    stars: tx.core.balances[s.kidId] - before,
    balance: tx.core.balances[s.kidId],
    message: 'Completion and any unearned bonuses undone.',
  }
}
export function redeem(
  tx: Transaction,
  actor: Actor,
  kidId: string,
  rewardId: string,
  now: Date,
  expectedCost?: number,
): CommandResult {
  const kid = requireKid(tx.core, actor, kidId)
  const reward =
    tx.core.rewards.find((r) => r.id === rewardId) ??
    fail('REWARD_NOT_FOUND', 'That reward no longer exists.')
  if (reward.archived || !reward.kidIds.includes(kidId))
    fail('UNAVAILABLE', 'That reward is not available to you.')
  if (actor.kind === 'kid' && expectedCost === undefined)
    fail('INVALID_INPUT', 'Open the reward to confirm its current price.')
  if (expectedCost !== undefined && expectedCost !== reward.cost)
    fail(
      'PRICE_CHANGED',
      'This reward’s price changed. Check the updated price before spending stars.',
    )
  const key = entitlementKey(kidId, rewardId)
  if (reward.type === 'one-off' && tx.core.oneOffRedemptions[key])
    fail('ALREADY_REDEEMED', 'You have already taken this one-off reward.')
  if (tx.core.balances[kidId] < reward.cost)
    fail(
      'INSUFFICIENT_STARS',
      `You need ${reward.cost - tx.core.balances[kidId]} more stars.`,
    )
  const day = tx.days[pacificDay(now)],
    id = `${day.day}:${randomUUID()}`
  const entry = post(
    tx,
    day,
    actor,
    kidId,
    -reward.cost,
    'reward',
    id,
    `${reward.emoji} ${reward.title}`,
    now,
  )
  day.redemptions.push({
    id,
    kidId,
    reward: structuredClone(reward),
    timestamp: now.toISOString(),
    ledgerId: entry.id,
  })
  if (reward.type === 'one-off') tx.core.oneOffRedemptions[key] = id
  notify(
    tx,
    `${kid.name} redeemed ${reward.emoji} ${reward.title} for ${reward.cost} stars (${tx.core.balances[kidId]} remaining). Redemption: ${id}.`,
    now,
    day.day,
  )
  return {
    status: 'redeemed',
    id,
    stars: -reward.cost,
    balance: tx.core.balances[kidId],
    message: `${reward.title} is yours!`,
  }
}
export function adjust(
  tx: Transaction,
  actor: Actor,
  kidId: string,
  delta: number,
  note: string,
  now: Date,
): CommandResult {
  requireParent(actor)
  requireKid(tx.core, actor, kidId)
  const entry = post(
    tx,
    tx.days[pacificDay(now)],
    actor,
    kidId,
    delta,
    'adjustment',
    randomUUID(),
    note,
    now,
  )
  return {
    status: 'updated',
    id: entry.id,
    stars: delta,
    balance: tx.core.balances[kidId],
    message: 'Manual star adjustment recorded.',
  }
}
export function updateOrders(core: Core) {
  for (const kid of core.kids)
    for (const group of [...PERIODS, 'bonus'] as Group[]) {
      const key = orderKey(kid.id, group)
      const ids = core.chores
        .filter(
          (c) =>
            c.kidIds.includes(kid.id) && (c.timeOfDay || 'bonus') === group,
        )
        .map((c) => c.id)
      core.orders[key] = [
        ...(core.orders[key] || []).filter((id) => ids.includes(id)),
        ...ids.filter((id) => !core.orders[key]?.includes(id)),
      ]
    }
}
export function configureChore(
  tx: Transaction,
  actor: Actor,
  input: Partial<Chore> & { id?: string },
  now: Date,
): CommandResult {
  requireParent(actor)
  const existing = input.id
    ? (tx.core.chores.find((c) => c.id === input.id) ??
      fail('CHORE_NOT_FOUND', 'Unknown chore ID.'))
    : null
  const chore = {
    ...(existing || {
      id: randomUUID(),
      createdAt: now.toISOString(),
      scheduledFor: pacificDay(now),
    }),
    ...input,
  } as Chore
  chore.kidIds.forEach((id) => requireKid(tx.core, actor, id))
  if (
    chore.scheduledFor &&
    chore.scheduledFor < pacificDay(now) &&
    (!existing || chore.scheduledFor !== existing.scheduledFor)
  )
    fail(
      'PAST_DATE',
      'Schedule a current or future opportunity; past dates cannot create credit.',
    )
  if (existing) Object.assign(existing, chore)
  else tx.core.chores.push(chore)
  updateOrders(tx.core)
  amendPlan(tx.core, tx.days[pacificDay(now)], now)
  return {
    status: 'updated',
    id: chore.id,
    message:
      'Chore saved. Recorded submissions and opened obligations keep their original facts.',
  }
}
export function configureReward(
  tx: Transaction,
  actor: Actor,
  input: Partial<Reward> & { id?: string },
  now: Date,
): CommandResult {
  requireParent(actor)
  const existing = input.id
    ? (tx.core.rewards.find((r) => r.id === input.id) ??
      fail('REWARD_NOT_FOUND', 'Unknown reward ID.'))
    : null
  const reward = {
    ...(existing || { id: randomUUID(), createdAt: now.toISOString() }),
    ...input,
  } as Reward
  reward.kidIds.forEach((id) => requireKid(tx.core, actor, id))
  if (existing) Object.assign(existing, reward)
  else tx.core.rewards.push(reward)
  return {
    status: 'updated',
    id: reward.id,
    message: 'Reward saved; earlier purchases retain their recorded prices.',
  }
}
export function setPacking(
  tx: Transaction,
  actor: Actor,
  kidId: string | undefined,
  itemId: string | undefined,
  checked: boolean,
  now: Date,
): CommandResult {
  const ids = kidId ? [kidId] : tx.core.kids.map((k) => k.id)
  if (itemId && !PACKING_ITEMS.some((i) => i.id === itemId))
    fail('ITEM_NOT_FOUND', 'Unknown packing item.')
  for (const id of ids) {
    requireKid(tx.core, actor, id)
    const state = (tx.core.packing[id] ||= {})
    for (const item of itemId ? [itemId] : PACKING_ITEMS.map((i) => i.id))
      state[item] = checked
  }
  tx.core.packingImported = true
  return {
    status: 'updated',
    message: checked ? 'Packing saved.' : 'Packing cleared.',
  }
}
function card(core: Core, o: Occurrence, now: Date): ChoreCard {
  const last = core.lastCompleted[entitlementKey(o.kidId, o.choreId)]
  const cooldown =
    o.chore.type === 'perpetual' &&
    last &&
    Date.parse(last) + 5000 > now.getTime()
      ? new Date(Date.parse(last) + 5000).toISOString()
      : undefined
  return {
    occurrenceId: o.id,
    choreId: o.choreId,
    title: o.chore.title,
    emoji: o.chore.emoji,
    stars: o.chore.stars,
    requiresApproval: Boolean(o.chore.requiresApproval),
    repeatable: o.chore.type === 'perpetual',
    group: o.group,
    isNew: now.getTime() - Date.parse(o.chore.createdAt) < 86400000,
    ...(cooldown ? { availableAt: cooldown } : {}),
  }
}
export function board(tx: Transaction, actor: Actor, now: Date): Board {
  const clock = currentTime(now),
    day = tx.days[clock.day]
  const kids = tx.core.kids
    .filter((k) => actor.kind === 'parent' || actor.kidIds.includes(k.id))
    .map((k) => {
      const visible = day.occurrences.filter(
        (o) =>
          o.kidId === k.id &&
          !o.withdrawn &&
          (o.group === 'bonus' || o.group === clock.period),
      )
      const open = visible
        .filter((o) => {
          const definition = tx.core.chores.find((c) => c.id === o.choreId)
          return (
            definition &&
            scheduled(definition, k.id, clock.day) &&
            !paused(definition, k.id, clock.day) &&
            (definition.timeOfDay || 'bonus') === o.group &&
            !pending(day, o.id) &&
            (o.chore.type === 'perpetual' || !approved(day, o.id).length) &&
            !(
              o.chore.type === 'one-off' &&
              tx.core.oneOffCompletions[entitlementKey(k.id, o.choreId)]
            )
          )
        })
        .sort((a, b) => a.order - b.order)
      const completed = day.submissions
        .filter(
          (s) => s.kidId === k.id && ['approved', 'pending'].includes(s.status),
        )
        .flatMap((s) => {
          const o = visible.find((o) => o.id === s.occurrenceId)
          return o
            ? [
                {
                  ...card(tx.core, o, now),
                  stars: s.stars,
                  submissionId: s.id,
                  status: s.status,
                  submittedAt: s.submittedAt,
                  notificationStatus: s.notifiedAt
                    ? ('delivered' as const)
                    : s.notificationRetrying
                      ? ('retrying' as const)
                      : ('queued' as const),
                },
              ]
            : []
        })
      return {
        ...k,
        balance: tx.core.balances[k.id] || 0,
        chores: open
          .filter((o) => o.group !== 'bonus')
          .map((o) => card(tx.core, o, now)),
        bonus: open
          .filter((o) => o.group === 'bonus')
          .map((o) => card(tx.core, o, now)),
        completed,
        periodProgress: clock.period
          ? progress(day, k.id, clock.period, now)
          : {
              total: 0,
              completed: 0,
              pending: 0,
              missed: 0,
              stars: 2,
              earned: false,
            },
        dailyProgress: progress(day, k.id, 'daily', now),
        rewards: tx.core.rewards
          .filter((r) => !r.archived && r.kidIds.includes(k.id))
          .sort((a, b) => a.cost - b.cost)
          .map((r) => ({
            ...r,
            redeemed:
              r.type === 'one-off' &&
              Boolean(tx.core.oneOffRedemptions[entitlementKey(k.id, r.id)]),
          })),
        packing: tx.core.packing[k.id] || {},
      }
    })
  return {
    revision: tx.core.revision,
    serverNow: now.toISOString(),
    ...clock,
    kids,
    packingImported: tx.core.packingImported,
  }
}
