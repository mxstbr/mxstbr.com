import Link from 'next/link'
import type { Metadata } from 'next'
import { AddChoreForm } from '../add-chore-form'
import { AddRewardForm } from '../add-reward-form'
import {
  addChore,
  addReward,
  archiveChore,
  archiveReward,
  completeChore,
  renameKid,
  setPause,
  setChoreSchedule,
  pauseAllChores,
  adjustKidStars,
  setChoreKids,
  setRewardKids,
  setOneOffDate,
} from '../actions'
import {
  type Chore,
  type Completion,
  type Kid,
  type Reward,
  type RewardRedemption,
  getChoreState,
} from '../data'
import { PasswordForm } from 'app/cal/password-form'
import { auth, isMax } from 'app/auth'
import { ParentalPinGate } from '../parental-pin-gate'
import {
  DAY_NAMES,
  getToday,
  hasCompletedTodayForKid,
  isOpenForKid,
  isPaused,
  recurringStatus,
  rewardAvailableForKid,
  scheduleLabel,
  starsForKid,
  type TodayContext,
  sortByTimeOfDay,
  withAlpha,
  pacificDateFromTimestamp,
  PACIFIC_TIMEZONE,
} from '../utils'
import { ClippyChoresChat } from './clippy-chat'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Chores admin',
  description: 'Create chores, pause routines, and rename columns for the family chore board.',
}

type ColumnProps = {
  kid: Kid
  openChores: Chore[]
  recurringChores: Chore[]
  completions: Completion[]
  done: { chore: Chore; completionId: string; timestamp: string }[]
  ctx: TodayContext
  allKids: Kid[]
}

type RewardColumnProps = {
  kid: Kid
  rewards: Reward[]
  completions: Completion[]
  redemptions: RewardRedemption[]
  allKids: Kid[]
}

type AdminPageProps = {
  searchParams?: Promise<{ pwd?: string }>
}

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function SchedulePresetButton({
  choreId,
  label,
  days,
  cadence = 'weekly',
  active,
}: {
  choreId: string
  label: string
  days?: number[]
  cadence?: 'daily' | 'weekly'
  active?: boolean
}) {
  return (
    <form action={setChoreSchedule}>
      <input type="hidden" name="choreId" value={choreId} />
      <input type="hidden" name="cadence" value={cadence} />
      {cadence === 'weekly'
        ? (days ?? []).map((day) => (
            <input key={`${choreId}-${day}`} type="hidden" name="daysOfWeek" value={day} />
          ))
        : null}
      <button
        type="submit"
        className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
          active
            ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
            : 'border-slate-300 text-slate-700 hover:border-slate-500 dark:border-slate-700 dark:text-slate-200'
        }`}
      >
        {label}
      </button>
    </form>
  )
}

function CustomScheduleForm({
  choreId,
  selectedDays,
}: {
  choreId: string
  selectedDays: number[]
}) {
  return (
    <form action={setChoreSchedule} className="flex flex-wrap items-center gap-1">
      <input type="hidden" name="choreId" value={choreId} />
      <input type="hidden" name="cadence" value="weekly" />
      {DAY_LETTERS.map((label, index) => {
        const active = selectedDays.includes(index)
        return (
          <label
            key={`${choreId}-day-${index}`}
            className={`flex cursor-pointer items-center justify-center rounded-md border px-2 py-1 text-[10px] font-semibold transition ${
              active
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-300 text-slate-700 hover:border-slate-500 dark:border-slate-700 dark:text-slate-200'
            }`}
            title={DAY_NAMES[index]}
          >
            <input
              type="checkbox"
              name="daysOfWeek"
              value={index}
              defaultChecked={active}
              className="sr-only"
            />
            {label}
          </label>
        )
      })}
      <button
        type="submit"
        className="rounded-md border border-slate-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
      >
        Save days
      </button>
    </form>
  )
}

function CompletedChoreRow({
  entry,
}: {
  entry: { chore: Chore; timestamp: string }
}) {
  const timeLabel = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: PACIFIC_TIMEZONE,
  }).format(new Date(entry.timestamp))

  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
      <div className="flex items-center gap-3">
        <span className="text-xl leading-none">{entry.chore.emoji}</span>
        <div>
          <div className="font-semibold line-through decoration-2 decoration-slate-400">
            {entry.chore.title}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{timeLabel}</div>
        </div>
      </div>
      <div className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-900 dark:text-slate-100">
        ⭐️ {entry.chore.stars}
      </div>
    </div>
  )
}

function KidColumn({
  kid,
  openChores,
  recurringChores,
  completions,
  done,
  ctx,
  allKids,
}: ColumnProps) {
  const starTotal = starsForKid(completions, kid.id)
  const accent = kid.color ?? '#0ea5e9'
  const accentSoft = withAlpha(accent, 0.1)

  return (
    <div
      className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900"
      style={{
        borderColor: accent,
        backgroundColor: accentSoft,
        boxShadow: `0 12px 40px -20px ${accentSoft}, inset 0 1px 0 ${accentSoft}`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <form action={renameKid} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="kidId" value={kid.id} />
          <input
            name="name"
            defaultValue={kid.name}
            className="w-28 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
          />
          <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <span className="sr-only">Accent color</span>
            <input
              type="color"
              name="color"
              defaultValue={kid.color ?? '#0ea5e9'}
              className="h-9 w-9 cursor-pointer rounded-md border border-slate-300 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800"
              aria-label={`${kid.name} color`}
            />
          </label>
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
          >
            Save
          </button>
        </form>
        <div
          className="flex items-center gap-2 rounded-md px-3 py-1 text-sm font-semibold text-slate-800"
          style={{ backgroundColor: accentSoft, color: accent }}
        >
          ⭐️ <span className="tabular-nums">{starTotal}</span>
        </div>
        <form action={adjustKidStars} className="flex items-center gap-1">
          <input type="hidden" name="kidId" value={kid.id} />
          <input
            type="number"
            name="delta"
            min={1}
            defaultValue={1}
            className="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
          />
          <button
            type="submit"
            name="mode"
            value="add"
            className="rounded-md border border-transparent bg-slate-900 px-2 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Give
          </button>
          <button
            type="submit"
            name="mode"
            value="remove"
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
          >
            Remove
          </button>
        </form>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Open & upcoming
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {openChores.length} chore{openChores.length === 1 ? '' : 's'}
          </span>
        </div>

        {openChores.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Nothing pending. Celebrate the wins or add something new.
          </div>
        ) : (
          openChores.map((chore) => (
            <ChoreCard
              key={chore.id}
              chore={chore}
              ctx={ctx}
              completions={completions}
              kid={kid}
              allKids={allKids}
            />
          ))
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Completed today
          </h4>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {done.length} item{done.length === 1 ? '' : 's'}
          </span>
        </div>
        {done.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No completions yet. Celebrate open tasks as they get checked off.
          </div>
        ) : (
          <div className="space-y-2">
            {done.map((entry) => (
              <CompletedChoreRow key={entry.completionId} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {recurringChores.length > 0 ? (
        <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Recurring and pauses
          </h4>
          <div className="space-y-2">
            {recurringChores.map((chore) => {
              const status = recurringStatus(chore, kid.id, completions, ctx)
              const scheduleDays = chore.schedule?.daysOfWeek ?? []
              const scheduleCadence = chore.schedule?.cadence ?? 'daily'
              const matchesDays = (days: number[]) =>
                scheduleCadence === 'weekly' &&
                days.length === scheduleDays.length &&
                days.every((day) => scheduleDays.includes(day))
              const dailyActive =
                scheduleCadence === 'daily' ||
                scheduleDays.length === 7 ||
                (scheduleCadence === 'weekly' && scheduleDays.length === 0)
              return (
                <div
                  key={chore.id}
                  className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/60"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{chore.emoji}</span>
                      <div>
                        <div className="font-semibold">{chore.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {scheduleLabel(chore)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          status.tone === 'success'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100'
                            : status.tone === 'muted'
                              ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100'
                        }`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Schedule
                      </span>
                      <SchedulePresetButton
                        choreId={chore.id}
                        label="Daily"
                        cadence="daily"
                        active={dailyActive}
                      />
                      <SchedulePresetButton
                        choreId={chore.id}
                        label="Weekdays"
                        days={[1, 2, 3, 4, 5]}
                        active={matchesDays([1, 2, 3, 4, 5])}
                      />
                      <SchedulePresetButton
                        choreId={chore.id}
                        label="Sat & Sun"
                        days={[0, 6]}
                        active={matchesDays([0, 6])}
                      />
                      <SchedulePresetButton
                        choreId={chore.id}
                        label="Wed & Sun"
                        days={[0, 3]}
                        active={matchesDays([0, 3])}
                      />
                    </div>
                    <CustomScheduleForm choreId={chore.id} selectedDays={scheduleDays} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={setPause} className="flex items-center gap-2">
                      <input type="hidden" name="choreId" value={chore.id} />
                      <input
                        type="date"
                        name="pausedUntil"
                        defaultValue={chore.pausedUntil ?? ''}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
                      >
                        Pause
                      </button>
                    </form>
                    {chore.pausedUntil ? (
                      <form action={setPause}>
                        <input type="hidden" name="choreId" value={chore.id} />
                        <input type="hidden" name="pausedUntil" value="" />
                        <button
                          type="submit"
                          className="rounded-md border border-transparent bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                          Resume
                        </button>
                      </form>
                    ) : null}
                    <form action={archiveChore}>
                      <input type="hidden" name="choreId" value={chore.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-transparent px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Archive
                      </button>
                    </form>
                    <form action={setChoreKids} className="flex flex-wrap items-center gap-1">
                      <input type="hidden" name="choreId" value={chore.id} />
                      {allKids.map((k) => {
                        const active = chore.kidIds.includes(k.id)
                        return (
                          <label
                            key={k.id}
                            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                              active
                                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                                : 'border-slate-300 text-slate-700 hover:border-slate-500 dark:border-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              name="kidIds"
                              value={k.id}
                              defaultChecked={active}
                              className="sr-only"
                            />
                            {k.name}
                          </label>
                        )
                      })}
                      <button
                        type="submit"
                        className="rounded-md border border-slate-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
                      >
                        Save kids
                      </button>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Kid toggles save when you click this button.
                      </span>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ChoreCard({
  chore,
  ctx,
  completions,
  kid,
  allKids,
}: {
  chore: Chore
  ctx: TodayContext
  completions: Completion[]
  kid: Kid
  allKids: Kid[]
}) {
  const dueLabel = scheduleLabel(chore)
  const paused = isPaused(chore, ctx)
  const doneToday = hasCompletedTodayForKid(chore.id, kid.id, completions, ctx)
  const timeLabel =
    chore.timeOfDay === 'afternoon'
      ? 'Afternoon'
      : chore.timeOfDay === 'evening'
        ? 'Evening'
        : chore.timeOfDay === 'morning'
          ? 'Morning'
          : 'Any time'

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="text-2xl leading-none">{chore.emoji}</div>
          <div className="space-y-1">
            <div className="font-semibold leading-tight">{chore.title}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {timeLabel} • {dueLabel}
              {paused ? ` • Paused until ${chore.pausedUntil}` : null}
              {doneToday && !paused ? ' • Done for today' : null}
              {chore.requiresApproval ? ' • Parent pin required' : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow dark:bg-slate-900 dark:text-slate-100">
          ⭐️ {chore.stars}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <form action={completeChore}>
          <input type="hidden" name="choreId" value={chore.id} />
          <input type="hidden" name="kidId" value={kid.id} />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            disabled={doneToday && chore.type === 'repeated'}
          >
            Mark done
          </button>
        </form>
        {chore.type === 'repeated' ? (
          <form action={setPause} className="flex items-center gap-2">
            <input type="hidden" name="choreId" value={chore.id} />
            <input
              type="date"
              name="pausedUntil"
              defaultValue={chore.pausedUntil ?? ''}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
            />
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
            >
              Pause
            </button>
          </form>
        ) : null}
        <form action={archiveChore}>
          <input type="hidden" name="choreId" value={chore.id} />
          <button
            type="submit"
            className="rounded-md border border-transparent px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Archive
          </button>
        </form>
        {chore.type === 'one-off' ? (
          <form action={setOneOffDate} className="flex items-center gap-2">
            <input type="hidden" name="choreId" value={chore.id} />
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Day
            </label>
            <input
              type="date"
              name="scheduledFor"
              defaultValue={chore.scheduledFor ?? pacificDateFromTimestamp(chore.createdAt)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
            />
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
            >
              Set day
            </button>
          </form>
        ) : null}
        <form action={setChoreKids} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="choreId" value={chore.id} />
          <select
            name="timeOfDay"
            defaultValue={chore.timeOfDay ?? ''}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            aria-label="Time of day"
          >
            <option value="">Any time</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
          <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <input type="hidden" name="requiresApproval" value="false" />
            <input
              id={`${chore.id}-requires-approval`}
              type="checkbox"
              name="requiresApproval"
              value="true"
              defaultChecked={chore.requiresApproval}
              className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900"
            />
            <label htmlFor={`${chore.id}-requires-approval`} className="cursor-pointer">
              Parent pin
            </label>
          </div>
          <div className="flex flex-wrap gap-1">
            {allKids.map((k) => {
              const active = chore.kidIds.includes(k.id)
              return (
                <label
                  key={k.id}
                  className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-300 text-slate-700 hover:border-slate-500 dark:border-slate-700 dark:text-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="kidIds"
                    value={k.id}
                    defaultChecked={active}
                    className="sr-only"
                  />
                  {k.name}
                </label>
              )
            })}
          </div>
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
          >
            Save kids
          </button>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Kid selection updates after clicking Save kids.
          </span>
        </form>
      </div>
    </div>
  )
}

function RewardCard({
  reward,
  kid,
  redemptions,
  allKids,
  completions,
}: {
  reward: Reward
  kid: Kid
  redemptions: RewardRedemption[]
  allKids: Kid[]
  completions: Completion[]
}) {
  const redeemed = redemptions.some(
    (entry) => entry.rewardId === reward.id && entry.kidId === kid.id,
  )
  const available = rewardAvailableForKid(reward, kid.id, redemptions)
  const balance = starsForKid(completions, kid.id)
  const enough = balance >= reward.cost

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="text-2xl leading-none">{reward.emoji}</div>
          <div className="space-y-1">
            <div className="font-semibold leading-tight">{reward.title}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {reward.type === 'perpetual' ? 'Perpetual' : 'One-off'} • Cost {reward.cost}⭐️
              {redeemed && reward.type === 'one-off' ? ' • Redeemed' : null}
            </div>
          </div>
        </div>
        <div
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            available && enough
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100'
              : enough
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          {available ? (enough ? 'Available' : 'Too pricey') : 'Hidden'}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <form action={setRewardKids} className="flex flex-wrap items-center gap-1">
          <input type="hidden" name="rewardId" value={reward.id} />
          {allKids.map((k) => {
            const active = reward.kidIds.includes(k.id)
            return (
              <label
                key={k.id}
                className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-300 text-slate-700 hover:border-slate-500 dark:border-slate-700 dark:text-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  name="kidIds"
                  value={k.id}
                  defaultChecked={active}
                  className="sr-only"
                />
                {k.name}
              </label>
            )
          })}
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
          >
            Save kids
          </button>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Click Save kids to apply these toggles.
          </span>
        </form>
        <form action={archiveReward}>
          <input type="hidden" name="rewardId" value={reward.id} />
          <button
            type="submit"
            className="rounded-md border border-transparent px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Remove
          </button>
        </form>
      </div>
    </div>
  )
}

export default async function ChoreAdminPage({ searchParams }: AdminPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const password = auth()

  if (!isMax()) {
    return (
      <PasswordForm
        error={password ? 'Invalid password.' : undefined}
        defaultPassword={resolvedSearchParams?.pwd}
      />
    )
  }

  const state = await getChoreState()
  const ctx = getToday()
  const globalPauseUntil = state.chores.reduce<string | null>((latest, chore) => {
    if (!chore.pausedUntil) return latest
    if (!latest || chore.pausedUntil > latest) return chore.pausedUntil
    return latest
  }, null)
  const globalPauseActive = state.chores.some((chore) => chore.pausedUntil)

  const openChoresByKid: Record<string, Chore[]> = {}
  const recurringByKid: Record<string, Chore[]> = {}
  const doneByKid: Record<
    string,
    { chore: Chore; completionId: string; timestamp: string }[]
  > = {}
  const rewardsByKid: Record<string, Reward[]> = {}

  for (const kid of state.kids) {
    openChoresByKid[kid.id] = []
    recurringByKid[kid.id] = []
    doneByKid[kid.id] = []
    rewardsByKid[kid.id] = []
  }

  for (const chore of state.chores) {
    for (const kid of state.kids) {
      const scheduledDay =
        chore.scheduledFor ?? pacificDateFromTimestamp(chore.createdAt)
      const doneForKid = state.completions.some(
        (completion) => completion.choreId === chore.id && completion.kidId === kid.id,
      )
      const isFutureOneOff =
        chore.type === 'one-off' && scheduledDay > ctx.todayIso && !doneForKid

      if (isOpenForKid(chore, kid.id, state.completions, ctx) || isFutureOneOff) {
        openChoresByKid[kid.id]?.push(chore)
      }

      if (chore.type === 'repeated' && chore.kidIds.includes(kid.id)) {
        recurringByKid[kid.id]?.push(chore)
      }
    }
  }

  for (const reward of state.rewards) {
    if (reward.archived) continue
    for (const kid of state.kids) {
      if (reward.kidIds.includes(kid.id)) {
        rewardsByKid[kid.id]?.push(reward)
      }
    }
  }

  for (const completion of state.completions) {
    if (pacificDateFromTimestamp(completion.timestamp) !== ctx.todayIso) continue
    const chore = state.chores.find((c) => c.id === completion.choreId)
    if (!chore) continue
    if (!chore.kidIds.includes(completion.kidId)) continue
    doneByKid[completion.kidId]?.push({
      chore,
      completionId: completion.id,
      timestamp: completion.timestamp,
    })
  }

  return (
    <>
      <ParentalPinGate>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Chore control center
              </p>
              <h1 className="text-2xl font-bold leading-tight">Manage chores</h1>
              <p className="text-slate-600 dark:text-slate-300">
                Set up new chores, pause routines during travel, archive old tasks, and rename each
                column. All changes sync instantly to the kid-facing board.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Today is {DAY_NAMES[ctx.weekday]}, {ctx.todayIso}.
              </p>
            </div>
            <Link
              href="/chores"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              Open kid board
            </Link>
            <Link
              href="/chores/rewards"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              Open rewards
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Pause everything
                </p>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Pause all chores for every kid
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Hide all chores until a chosen date. Handy for travel or school breaks.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Status: {globalPauseActive ? `Paused until ${globalPauseUntil}` : 'Active'}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
                <form action={pauseAllChores} className="flex items-center gap-2">
                  <input
                    type="date"
                    name="pausedUntil"
                    defaultValue={globalPauseUntil ?? ''}
                    className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                  />
                  <button
                    type="submit"
                    className="rounded-md border border-transparent bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    Pause all
                  </button>
                </form>
                {globalPauseActive ? (
                  <form action={pauseAllChores}>
                    <input type="hidden" name="pausedUntil" value="" />
                    <button
                      type="submit"
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
                    >
                      Resume now
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </div>

          <AddChoreForm kids={state.kids} addChoreAction={addChore} />

          <div className="full-bleed">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 md:px-4">
              {state.kids.map((kid) => (
                <KidColumn
                  key={kid.id}
                  kid={kid}
                  openChores={sortByTimeOfDay(openChoresByKid[kid.id] ?? [])}
                  recurringChores={sortByTimeOfDay(recurringByKid[kid.id] ?? [])}
                  done={[...(doneByKid[kid.id] ?? [])].sort((a, b) =>
                    b.timestamp.localeCompare(a.timestamp),
                  )}
                  completions={state.completions}
                  ctx={ctx}
                  allKids={state.kids}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Rewards
              </p>
              <h2 className="text-xl font-bold leading-tight">Manage rewards</h2>
              <p className="text-slate-600 dark:text-slate-300">
                Add perks the kids can unlock and assign them to one or many columns.
              </p>
            </div>
            <AddRewardForm kids={state.kids} addRewardAction={addReward} />
          </div>

          <div className="full-bleed">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 md:px-4">
              {state.kids.map((kid) => (
                <RewardColumn
                  key={kid.id}
                  kid={kid}
                  rewards={rewardsByKid[kid.id] ?? []}
                  completions={state.completions}
                  redemptions={state.rewardRedemptions}
                  allKids={state.kids}
                />
              ))}
            </div>
          </div>
        </div>
      </ParentalPinGate>
      <ClippyChoresChat />
    </>
  )
}

function RewardColumn({
  kid,
  rewards,
  completions,
  redemptions,
  allKids,
}: RewardColumnProps) {
  const accent = kid.color ?? '#0ea5e9'
  const accentSoft = withAlpha(accent, 0.1)

  return (
    <div
      className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900"
      style={{
        borderColor: accent,
        backgroundColor: accentSoft,
        boxShadow: `0 12px 40px -20px ${accentSoft}, inset 0 1px 0 ${accentSoft}`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {kid.name} rewards
        </div>
        <div
          className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          style={{ borderColor: accent }}
        >
          {rewards.length} item{rewards.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="space-y-3">
        {rewards.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No rewards assigned. Add one above or toggle kids on an existing reward.
          </div>
        ) : (
          rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              kid={kid}
              redemptions={redemptions}
              allKids={allKids}
              completions={completions}
            />
          ))
        )}
      </div>
    </div>
  )
}
