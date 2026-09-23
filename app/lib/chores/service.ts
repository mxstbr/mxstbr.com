import { createHash } from 'node:crypto'
import { commandSchema, type Command } from './commands'
import {
  adjust,
  amendPlan,
  board,
  configureChore,
  configureReward,
  ensurePlan,
  orderKey,
  progress,
  reconcileBonuses,
  redeem,
  requireKid,
  requireParent,
  review,
  setPacking,
  submit,
  undo,
} from './domain'
import { PACKING_ITEMS } from './packing'
import { pacificDay, validDay, TIME_ZONE, TIME_WINDOWS } from './time'
import {
  fail,
  type Actor,
  type CommandResult,
  type Repository,
  type Transaction,
} from './types'

export class ChoresService {
  constructor(
    public repository: Repository,
    private clock: () => Date = () => new Date(),
  ) {}
  async getBoard(actor: Actor) {
    const today = pacificDay(this.clock())
    return this.repository.transact([today], null, (tx) => {
      const now = this.clock()
      if (pacificDay(now) !== today)
        fail('REFRESH_REQUIRED', 'A new day has started. Please refresh.')
      ensurePlan(tx.core, tx.days[today])
      amendPlan(tx.core, tx.days[today], now)
      // Reconcile saved plans (including older hidden targets) and their period
      // bonuses atomically. Repeated reads cannot duplicate a credit or reversal.
      for (const kid of tx.core.kids)
        reconcileBonuses(
          tx,
          tx.days[today],
          { kind: 'parent', id: 'bonus-reconciliation' },
          kid.id,
          now,
        )
      return board(tx, actor, now)
    })
  }
  async execute(
    actor: Actor,
    requestId: string,
    input: unknown,
  ): Promise<CommandResult> {
    const parsed = commandSchema.safeParse(input)
    if (!parsed.success)
      fail(
        'INVALID_INPUT',
        parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; '),
      )
    if (requestId.length < 8 || requestId.length > 100)
      fail('INVALID_INPUT', 'A stable request ID is required.')
    const command = parsed.data
    const today = pacificDay(this.clock())
    const target =
      'submissionId' in command
        ? command.submissionId.slice(0, 10)
        : 'occurrenceId' in command
          ? command.occurrenceId.slice(0, 10)
          : today
    const fingerprint = createHash('sha256')
      .update(JSON.stringify(command))
      .digest('hex')
    return this.repository.transact(
      Array.from(new Set([today, target])),
      { id: requestId, actorId: actor.id, fingerprint },
      (tx) => {
        const now = this.clock()
        if (pacificDay(now) !== today)
          fail(
            'REFRESH_REQUIRED',
            'A new day has started. Retry this same action.',
          )
        ensurePlan(tx.core, tx.days[today])
        amendPlan(tx.core, tx.days[today], now)
        const result = this.apply(tx, actor, command, now)
        if (
          [
            'create_chore',
            'update_chore',
            'archive_chore',
            'pause_all',
          ].includes(command.action)
        )
          for (const kid of tx.core.kids)
            reconcileBonuses(tx, tx.days[today], actor, kid.id, now)
        return result
      },
    )
  }
  private apply(
    tx: Transaction,
    actor: Actor,
    c: Command,
    now: Date,
  ): CommandResult {
    const today = pacificDay(now)
    switch (c.action) {
      case 'submit':
        return submit(tx, actor, c.occurrenceId, now)
      case 'review':
        return review(tx, actor, c.submissionId, c.decision, now)
      case 'undo':
        return undo(tx, actor, c.submissionId, now)
      case 'redeem':
        return redeem(tx, actor, c.kidId, c.rewardId, now, c.expectedCost)
      case 'adjust_stars':
        return adjust(tx, actor, c.kidId, c.delta, c.note, now)
      case 'create_chore':
        return configureChore(
          tx,
          actor,
          { ...c.chore, timeOfDay: c.chore.timeOfDay || undefined },
          now,
        )
      case 'update_chore': {
        const { timeOfDay, ...rest } = c.patch
        const patch = {
          ...rest,
          ...('timeOfDay' in c.patch
            ? { timeOfDay: timeOfDay || undefined }
            : {}),
        }
        return configureChore(tx, actor, { ...patch, id: c.choreId }, now)
      }
      case 'archive_chore': {
        if (c.from && c.from < today)
          fail('PAST_DATE', 'Archive a chore from today or a future date.')
        return configureChore(
          tx,
          actor,
          { id: c.choreId, archivedFrom: c.from || today },
          now,
        )
      }
      case 'pause_all': {
        requireParent(actor)
        tx.core.chores.forEach((chore) => {
          chore.snoozedUntil = c.until
        })
        amendPlan(tx.core, tx.days[today], now)
        return {
          status: 'updated',
          message: c.until
            ? `Chores paused; they reappear on ${c.until}. Hidden chores are excluded from completion targets without awarding chore stars.`
            : 'Chores resumed subject to current eligibility.',
        }
      }
      case 'create_reward':
        return configureReward(tx, actor, c.reward, now)
      case 'update_reward':
        return configureReward(tx, actor, { ...c.patch, id: c.rewardId }, now)
      case 'archive_reward':
        return configureReward(
          tx,
          actor,
          { id: c.rewardId, archived: true },
          now,
        )
      case 'update_kid': {
        requireParent(actor)
        const kid = requireKid(tx.core, actor, c.kidId)
        if (c.name) kid.name = c.name
        if (c.color) kid.color = c.color
        return {
          status: 'updated',
          message: 'Child updated without changing their identity or history.',
        }
      }
      case 'set_color': {
        requireKid(tx.core, actor, c.kidId).color = c.color
        return { status: 'updated', message: 'Your color is saved.' }
      }
      case 'set_order': {
        requireParent(actor)
        requireKid(tx.core, actor, c.kidId)
        if (new Set(c.choreIds).size !== c.choreIds.length)
          fail('INVALID_ORDER', 'Each chore may appear only once.')
        for (const id of c.choreIds)
          if (
            !tx.core.chores.some(
              (chore) =>
                chore.id === id &&
                chore.kidIds.includes(c.kidId) &&
                (chore.timeOfDay || 'bonus') === c.group,
            )
          )
            fail(
              'INVALID_ORDER',
              'Only chores assigned to this child and group can be ordered here.',
            )
        const key = orderKey(c.kidId, c.group)
        tx.core.orders[key] = [
          ...c.choreIds,
          ...(tx.core.orders[key] || []).filter(
            (id) => !c.choreIds.includes(id),
          ),
        ]
        amendPlan(tx.core, tx.days[today], now)
        return {
          status: 'updated',
          message:
            'Routine order saved. Weekday filtering preserves this sequence.',
        }
      }
      case 'packing':
        return setPacking(tx, actor, c.kidId, c.itemId, c.checked, now)
      case 'import_packing': {
        if (tx.core.packingImported)
          return {
            status: 'already_processed',
            message: 'Packing is already stored on the shared board.',
          }
        for (const [kidId, values] of Object.entries(c.packed)) {
          requireKid(tx.core, actor, kidId)
          tx.core.packing[kidId] = Object.fromEntries(
            PACKING_ITEMS.map((i) => [i.id, values[i.id] === true]),
          )
        }
        tx.core.packingImported = true
        return {
          status: 'updated',
          message:
            'This device’s old packing progress is now shared with the family.',
        }
      }
    }
  }
  async inspect(actor: Actor, day: string) {
    requireParent(actor)
    if (!validDay(day)) fail('INVALID_INPUT', 'Use a real Pacific date.')
    const core = await this.repository.readCore()
    const stored = await this.repository.readDay(day)
    const view = stored || {
      day,
      occurrences: [],
      submissions: [],
      ledger: [],
      redemptions: [],
      awards: {},
      planned: false,
    }
    if (day >= pacificDay(this.clock())) {
      ensurePlan(core, view)
      amendPlan(core, view, this.clock())
    }
    return {
      historicalFacts:
        day < core.initializedAt.slice(0, 10)
          ? 'Legacy history preserves recorded credits; original approval times and catalog snapshots were not stored.'
          : undefined,
      kids: core.kids.map((k) => ({
        ...k,
        balance: core.balances[k.id],
        dailyProgress: progress(view, k.id, 'daily', this.clock()),
      })),
      ...view,
    }
  }
  async catalog(actor: Actor) {
    requireParent(actor)
    const c = await this.repository.readCore()
    return {
      kids: c.kids,
      chores: c.chores,
      rewards: c.rewards,
      balances: c.balances,
      orders: c.orders,
      packing: c.packing,
      packingItems: PACKING_ITEMS,
      timeZone: TIME_ZONE,
      timeWindows: TIME_WINDOWS,
      migration: c.migration,
    }
  }
  async kidSummary(actor: Actor, day: string) {
    if (!validDay(day)) fail('INVALID_INPUT', 'Use a real Pacific date.')
    const core = await this.repository.readCore()
    const data = (await this.repository.readDay(day)) || {
      day,
      occurrences: [],
      submissions: [],
      ledger: [],
      redemptions: [],
      awards: {},
      planned: false,
    }
    if (day >= pacificDay(this.clock())) {
      ensurePlan(core, data)
      amendPlan(core, data, this.clock())
    }
    return {
      day,
      kids: core.kids
        .filter((k) => actor.kind === 'parent' || actor.kidIds.includes(k.id))
        .map((k) => ({
          kidId: k.id,
          progress: progress(data, k.id, 'daily', this.clock()),
          earned: data.ledger
            .filter((e) => e.kidId === k.id && e.amount > 0)
            .reduce((a, e) => a + e.amount, 0),
          spent: -data.ledger
            .filter((e) => e.kidId === k.id && e.amount < 0)
            .reduce((a, e) => a + e.amount, 0),
        })),
    }
  }
  async approvals(actor: Actor) {
    requireParent(actor)
    const c = await this.repository.readCore()
    const days = await Promise.all(
      Array.from(new Set(Object.values(c.pending))).map((day) =>
        this.repository.readDay(day),
      ),
    )
    return days.flatMap(
      (day) =>
        day?.submissions
          .filter((s) => s.status === 'pending')
          .map((s) => ({
            ...s,
            occurrence: day.occurrences.find((o) => o.id === s.occurrenceId),
          })) || [],
    )
  }
}
