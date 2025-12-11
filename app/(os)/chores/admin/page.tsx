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
  type ChoreType,
  type Completion,
  type Kid,
  type Reward,
  type RewardRedemption,
  getChoreState,
} from '../data'
import { PasswordForm } from '../../components/password-form'
import { auth, isMax } from 'app/auth'
import { ParentalPinGate } from '../parental-pin-gate'
import {
  DAY_NAMES,
  getToday,
  hasCompletedTodayForKid,
  isOpenForKid,
  isPaused,
  rewardAvailableForKid,
  scheduleLabel,
  starsForKid,
  type TodayContext,
  withAlpha,
  pacificDateFromTimestamp,
} from '../utils'
import { ClippyChoresChat } from './clippy-chat'

async function handleCompleteChore(formData: FormData): Promise<void> {
  'use server'
  await completeChore(formData)
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Chores admin',
  description: 'Create chores, pause routines, and rename columns for the family chore board.',
}

type RewardColumnProps = {
  kid: Kid
  rewards: Reward[]
  completions: Completion[]
  redemptions: RewardRedemption[]
  allKids: Kid[]
}

type AdminSearchParams = {
  pwd?: string
  kid?: string
  type?: ChoreType
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | ''
  approval?: 'pin' | 'none'
  status?: 'open' | 'paused' | 'completed' | 'scheduled'
  sort?: 'created-desc' | 'created-asc' | 'stars-desc' | 'stars-asc' | 'title'
  page?: string
  q?: string
}

type AdminPageProps = {
  searchParams?: Promise<AdminSearchParams>
}

type ChoreStatus = 'open' | 'paused' | 'completed' | 'scheduled'

const PAGE_SIZE = 9
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function choreStatus(chore: Chore, kids: Kid[], completions: Completion[], ctx: TodayContext): ChoreStatus {
  if (isPaused(chore, ctx)) return 'paused'

  if (chore.type === 'one-off' && chore.completedAt) {
    return 'completed'
  }

  const openForKid = kids.some((kid) =>
    chore.kidIds.includes(kid.id) && isOpenForKid(chore, kid.id, completions, ctx),
  )

  if (openForKid) return 'open'

  return 'scheduled'
}

function sortChores(
  chores: Chore[],
  sort: AdminSearchParams['sort'] = 'created-desc',
): Chore[] {
  const sorted = [...chores]

  sorted.sort((a, b) => {
    if (sort === 'created-asc') return a.createdAt.localeCompare(b.createdAt)
    if (sort === 'stars-desc') return (b.stars ?? 0) - (a.stars ?? 0)
    if (sort === 'stars-asc') return (a.stars ?? 0) - (b.stars ?? 0)
    if (sort === 'title') return a.title.localeCompare(b.title)

    // Default: newest first
    return b.createdAt.localeCompare(a.createdAt)
  })

  return sorted
}

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

// Rebuilt admin components live below.

function KidSettingsCard({ kid, completions }: { kid: Kid; completions: Completion[] }) {
  const starTotal = starsForKid(completions, kid.id)
  const accent = kid.color ?? '#0ea5e9'
  const accentSoft = withAlpha(accent, 0.1)

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900"
      style={{ borderColor: accent, backgroundColor: accentSoft, boxShadow: `0 12px 40px -20px ${accentSoft}` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
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
      </div>

      <form action={adjustKidStars} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="kidId" value={kid.id} />
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Adjust stars</label>
        <input
          type="number"
          name="delta"
          min={1}
          defaultValue={1}
          className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
        />
        <button
          type="submit"
          name="mode"
          value="add"
          className="rounded-md border border-transparent bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Give
        </button>
        <button
          type="submit"
          name="mode"
          value="remove"
          className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
        >
          Remove
        </button>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">Handy for bonuses or quick deductions.</span>
      </form>
    </div>
  )
}

function StatusBadge({ status }: { status: ChoreStatus }) {
  const tones: Record<ChoreStatus, string> = {
    open: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100',
    paused: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100',
    scheduled: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  }

  const labels: Record<ChoreStatus, string> = {
    open: 'Open now',
    paused: 'Paused',
    completed: 'Completed',
    scheduled: 'Scheduled',
  }

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tones[status]}`}>
      {labels[status]}
    </span>
  )
}

function KidBadge({ kid, active }: { kid: Kid; active?: 'done' | 'open' }) {
  const accent = kid.color ?? '#0ea5e9'
  const accentSoft = withAlpha(accent, 0.18)
  const border = active === 'done' ? 'ring-2 ring-emerald-400' : active === 'open' ? 'ring-2 ring-amber-400' : ''

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm dark:text-slate-100 ${border}`}
      style={{ backgroundColor: accentSoft, borderColor: accent, color: accent }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
      {kid.name}
    </span>
  )
}

function ChoreCard({ chore, kids, completions, ctx }: { chore: Chore; kids: Kid[]; completions: Completion[]; ctx: TodayContext }) {
  const assignedKids = kids.filter((kid) => chore.kidIds.includes(kid.id))
  const dueLabel = scheduleLabel(chore)
  const status = choreStatus(chore, kids, completions, ctx)
  const doneToday = assignedKids.filter((kid) => hasCompletedTodayForKid(chore.id, kid.id, completions, ctx))
  const openKids = assignedKids.filter((kid) => isOpenForKid(chore, kid.id, completions, ctx))
  const timeLabel =
    chore.timeOfDay === 'afternoon'
      ? 'Afternoon'
      : chore.timeOfDay === 'evening'
        ? 'Evening'
        : chore.timeOfDay === 'morning'
          ? 'Morning'
          : 'Any time'
  const createdLabel = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(chore.createdAt))
  const scheduledDay = chore.scheduledFor ?? pacificDateFromTimestamp(chore.createdAt)
  const kidSelectOptions = assignedKids.length ? assignedKids : kids

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="text-2xl leading-none">{chore.emoji}</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold leading-tight text-slate-900 dark:text-slate-50">{chore.title}</h3>
              <StatusBadge status={status} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {chore.type === 'one-off' ? 'One-off' : chore.type === 'perpetual' ? 'Perpetual' : 'Repeated'}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {timeLabel}
              </span>
              <span className="rounded-md bg-white px-2 py-1 font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
                ⭐️ {chore.stars}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {chore.requiresApproval ? 'Parent pin required' : 'No pin needed'}
              </span>
              {status === 'paused' && chore.pausedUntil ? (
                <span className="font-semibold text-amber-700 dark:text-amber-300">Paused until {chore.pausedUntil}</span>
              ) : null}
              {chore.type === 'one-off' && chore.completedAt ? (
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">Finished</span>
              ) : null}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {dueLabel}
              {chore.type === 'one-off' ? ` • Scheduled for ${scheduledDay}` : ''}
              {doneToday.length && status !== 'paused' ? ` • Done today by ${doneToday.map((kid) => kid.name).join(', ')}` : ''}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Created {createdLabel}</p>
            <div className="flex flex-wrap gap-2">
              {assignedKids.map((kid) => (
                <KidBadge
                  key={kid.id}
                  kid={kid}
                  active={doneToday.some((k) => k.id === kid.id) ? 'done' : openKids.some((k) => k.id === kid.id) ? 'open' : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <form action={handleCompleteChore} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="choreId" value={chore.id} />
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Mark done</label>
            <select
              name="kidId"
              defaultValue={kidSelectOptions[0]?.id ?? ''}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              aria-label="Kid"
            >
              {kidSelectOptions.map((kid) => (
                <option key={kid.id} value={kid.id}>
                  {kid.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="day"
              defaultValue={ctx.todayIso}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
            />
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              disabled={status === 'paused'}
            >
              Save completion
            </button>
          </form>

          <form action={archiveChore}>
            <input type="hidden" name="choreId" value={chore.id} />
            <button
              type="submit"
              className="rounded-md border border-transparent px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Archive
            </button>
          </form>
        </div>

        {chore.type === 'one-off' ? (
          <form action={setOneOffDate} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="choreId" value={chore.id} />
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Day</label>
            <input
              type="date"
              name="scheduledFor"
              defaultValue={chore.scheduledFor ?? pacificDateFromTimestamp(chore.createdAt)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
            />
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
            >
              Set day
            </button>
          </form>
        ) : null}

        {chore.type === 'repeated' ? (
          <div className="space-y-2 rounded-md border border-dashed border-slate-300 p-3 text-sm dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Schedule</span>
              <SchedulePresetButton choreId={chore.id} label="Daily" cadence="daily" active={chore.schedule?.cadence !== 'weekly'} />
              <SchedulePresetButton
                choreId={chore.id}
                label="Weekdays"
                days={[1, 2, 3, 4, 5]}
                active={chore.schedule?.cadence === 'weekly' && (chore.schedule?.daysOfWeek ?? []).length === 5 && (chore.schedule?.daysOfWeek ?? []).every((day) => [1, 2, 3, 4, 5].includes(day))}
              />
              <SchedulePresetButton
                choreId={chore.id}
                label="Weekends"
                days={[0, 6]}
                active={chore.schedule?.cadence === 'weekly' && (chore.schedule?.daysOfWeek ?? []).length === 2 && (chore.schedule?.daysOfWeek ?? []).every((day) => [0, 6].includes(day))}
              />
              <SchedulePresetButton
                choreId={chore.id}
                label="Custom"
                cadence="weekly"
                active={chore.schedule?.cadence === 'weekly' && !!(chore.schedule?.daysOfWeek?.length && (chore.schedule?.daysOfWeek?.length ?? 0) !== 7)}
              />
            </div>
            <CustomScheduleForm choreId={chore.id} selectedDays={chore.schedule?.daysOfWeek ?? []} />
            <form action={setPause} className="flex flex-wrap items-center gap-2 text-xs">
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
              {chore.pausedUntil ? (
                <button
                  type="submit"
                  name="pausedUntil"
                  value=""
                  className="rounded-md border border-transparent bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Resume
                </button>
              ) : null}
            </form>
          </div>
        ) : null}

        <form action={setChoreKids} className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 text-xs dark:border-slate-800">
          <input type="hidden" name="choreId" value={chore.id} />
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Assignments</label>
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
          </div>

          <div className="flex flex-wrap gap-2">
            {kids.map((kid) => {
              const active = chore.kidIds.includes(kid.id)
              return (
                <label
                  key={kid.id}
                  className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-300 text-slate-700 hover:border-slate-500 dark:border-slate-700 dark:text-slate-200'
                  }`}
                >
                  <input type="checkbox" name="kidIds" value={kid.id} defaultChecked={active} className="sr-only" />
                  {kid.name}
                </label>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
            >
              Save changes
            </button>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Kid toggles save when you click this button.</span>
          </div>
        </form>
      </div>
    </div>
  )
}

type FilterState = {
  kid: string
  type: string
  timeOfDay: string
  approval: string
  status: string
  sort: AdminSearchParams['sort']
  q: string
}

function ChoreFilters({ kids, filters }: { kids: Kid[]; filters: FilterState }) {
  return (
    <form className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3 dark:border-slate-800 dark:bg-slate-900" method="get">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Kid</label>
        <select
          name="kid"
          defaultValue={filters.kid}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="all">All kids</option>
          {kids.map((kid) => (
            <option key={kid.id} value={kid.id}>
              {kid.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Type</label>
        <select
          name="type"
          defaultValue={filters.type}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="all">All types</option>
          <option value="one-off">One-off</option>
          <option value="repeated">Repeated</option>
          <option value="perpetual">Perpetual</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Time of day</label>
        <select
          name="timeOfDay"
          defaultValue={filters.timeOfDay}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="all">Any time</option>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Status</label>
        <select
          name="status"
          defaultValue={filters.status}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="all">Any status</option>
          <option value="open">Open</option>
          <option value="scheduled">Scheduled</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Approval</label>
        <select
          name="approval"
          defaultValue={filters.approval}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="all">Any</option>
          <option value="pin">Requires pin</option>
          <option value="none">No pin</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Sort</label>
        <select
          name="sort"
          defaultValue={filters.sort ?? 'created-desc'}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="created-desc">Newest first</option>
          <option value="created-asc">Oldest first</option>
          <option value="stars-desc">Most stars</option>
          <option value="stars-asc">Fewest stars</option>
          <option value="title">Title</option>
        </select>
      </div>

      <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Search</label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="Find chores by title or emoji"
            className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Apply
            </button>
            <a
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-200"
              href="/chores/admin"
            >
              Reset
            </a>
          </div>
        </div>
      </div>
    </form>
  )
}

function Pagination({ currentPage, totalPages, hrefForPage }: { currentPage: number; totalPages: number; hrefForPage: (page: number) => string }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
      <a
        href={hrefForPage(Math.max(1, currentPage - 1))}
        className={`rounded-md px-3 py-1 transition ${currentPage === 1 ? 'pointer-events-none text-slate-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
      >
        Previous
      </a>
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-slate-100 px-3 py-1 text-xs uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      <a
        href={hrefForPage(Math.min(totalPages, currentPage + 1))}
        className={`rounded-md px-3 py-1 transition ${currentPage === totalPages ? 'pointer-events-none text-slate-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
      >
        Next
      </a>
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
  const password = await auth()
  const isAuthorized = await isMax()

  if (!isAuthorized) {
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

  const rewardsByKid: Record<string, Reward[]> = {}
  for (const kid of state.kids) {
    rewardsByKid[kid.id] = []
  }
  for (const reward of state.rewards) {
    if (reward.archived) continue
    for (const kidId of reward.kidIds) {
      if (rewardsByKid[kidId]) {
        rewardsByKid[kidId]?.push(reward)
      }
    }
  }

  const allowedSorts: AdminSearchParams['sort'][] = [
    'created-asc',
    'created-desc',
    'stars-asc',
    'stars-desc',
    'title',
  ]

  const kidFilter = resolvedSearchParams?.kid ?? 'all'
  const typeFilter = resolvedSearchParams?.type ?? 'all'
  const timeFilter = resolvedSearchParams?.timeOfDay ? resolvedSearchParams.timeOfDay : 'all'
  const approvalFilter = resolvedSearchParams?.approval ?? 'all'
  const statusFilter = resolvedSearchParams?.status ?? 'all'
  const searchQuery = (resolvedSearchParams?.q ?? '').toLowerCase().trim()
  const sortParam: AdminSearchParams['sort'] = allowedSorts.includes(resolvedSearchParams?.sort ?? 'created-desc')
    ? (resolvedSearchParams?.sort as AdminSearchParams['sort'])
    : 'created-desc'

  const choresWithStatus = state.chores.map((chore) => ({
    chore,
    status: choreStatus(chore, state.kids, state.completions, ctx),
  }))

  const filteredChores = choresWithStatus
    .filter(({ chore, status }) => {
      if (kidFilter !== 'all' && !chore.kidIds.includes(kidFilter)) return false
      if (typeFilter !== 'all' && chore.type !== typeFilter) return false
      if (timeFilter !== 'all' && (chore.timeOfDay ?? 'all') !== timeFilter) return false
      if (approvalFilter === 'pin' && !chore.requiresApproval) return false
      if (approvalFilter === 'none' && chore.requiresApproval) return false
      if (statusFilter !== 'all' && status !== statusFilter) return false
      if (searchQuery && !chore.title.toLowerCase().includes(searchQuery) && !(chore.emoji ?? '').includes(searchQuery)) return false
      return true
    })
    .map(({ chore }) => chore)

  const sortedChores = sortChores(filteredChores, sortParam)
  const totalPages = Math.max(1, Math.ceil(sortedChores.length / PAGE_SIZE))
  const currentPage = Math.min(
    totalPages,
    Math.max(1, Number.parseInt(resolvedSearchParams?.page ?? '1', 10) || 1),
  )
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const visibleChores = sortedChores.slice(startIndex, startIndex + PAGE_SIZE)

  const filters: FilterState = {
    kid: kidFilter,
    type: typeFilter,
    timeOfDay: timeFilter,
    approval: approvalFilter,
    status: statusFilter,
    sort: sortParam,
    q: searchQuery,
  }

  const baseParams = new URLSearchParams()
  if (kidFilter !== 'all') baseParams.set('kid', kidFilter)
  if (typeFilter !== 'all') baseParams.set('type', typeFilter)
  if (timeFilter !== 'all') baseParams.set('timeOfDay', timeFilter)
  if (approvalFilter !== 'all') baseParams.set('approval', approvalFilter)
  if (statusFilter !== 'all') baseParams.set('status', statusFilter)
  if (sortParam && sortParam !== 'created-desc') baseParams.set('sort', sortParam)
  if (searchQuery) baseParams.set('q', searchQuery)

  const hrefForPage = (page: number) => {
    const params = new URLSearchParams(baseParams)
    params.set('page', page.toString())
    const query = params.toString()
    return `/chores/admin${query ? `?${query}` : ''}`
  }

  return (
    <ParentalPinGate>
      <>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Chore control center
              </p>
              <h1 className="text-2xl font-bold leading-tight">Manage chores</h1>
              <p className="text-slate-600 dark:text-slate-300">
                Set up new chores, pause routines during travel, archive old tasks, and keep every
                chore in one sortable, filterable list. All changes sync instantly to the kid-facing
                board.
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
                <KidSettingsCard key={kid.id} kid={kid} completions={state.completions} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Chores</p>
                <h2 className="text-xl font-bold leading-tight">One list to rule them all</h2>
                <p className="text-slate-600 dark:text-slate-300">
                  Browse every chore from the database, filter by kid, cadence, approval, or time of day, and sort however you
                  like. Cards show schedule, pin requirements, and assignments at a glance.
                </p>
              </div>
              <span className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                Showing {visibleChores.length} of {sortedChores.length} chore{sortedChores.length === 1 ? '' : 's'}
              </span>
            </div>

            <ChoreFilters kids={state.kids} filters={filters} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {visibleChores.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  No chores match these filters. Adjust the search or add a new task above.
                </div>
              ) : (
                visibleChores.map((chore) => (
                  <ChoreCard
                    key={chore.id}
                    chore={chore}
                    kids={state.kids}
                    completions={state.completions}
                    ctx={ctx}
                  />
                ))
              )}
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} hrefForPage={hrefForPage} />
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
        <ClippyChoresChat />
      </>
    </ParentalPinGate>
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
