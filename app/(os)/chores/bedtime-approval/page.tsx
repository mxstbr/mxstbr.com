import type { Metadata } from 'next'
import { BedtimeApprovalForm } from './form'
import { createBedtimeChores } from '../actions'
import { getChoreState } from '../data'
import { PACIFIC_TIMEZONE, getToday, pacificDateFromTimestamp } from '../utils'
import { BEDTIME_TEMPLATES, type BedtimeTemplateKey } from './constants'
import type { BedtimeActionState } from './types'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const friendlyDate = new Intl.DateTimeFormat('en-US', {
  timeZone: PACIFIC_TIMEZONE,
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

export const metadata: Metadata = {
  title: 'Bedtime approval',
  description: 'Log which kids earned bedtime stars for the morning chore board.',
}

async function handleBedtimeSubmission(
  _prevState: BedtimeActionState,
  formData: FormData,
): Promise<BedtimeActionState> {
  'use server'

  const hasSelection = BEDTIME_TEMPLATES.some(
    (template) => formData.getAll(template.key).length > 0,
  )

  if (!hasSelection) {
    return { status: 'error', message: 'Select at least one kid to create the chores.' }
  }

  try {
    const result = await createBedtimeChores(formData)
    if (!result.created.length && !result.skipped.length) {
      return {
        status: 'error',
        message: 'No kids matched your selections. Please try again.',
      }
    }
    return { status: 'success', result }
  } catch (error) {
    console.error('Failed to create bedtime chores', error)
    return {
      status: 'error',
      message: 'Could not create the bedtime chores. Please try again.',
    }
  }
}

function getDefaultSelections(): Record<BedtimeTemplateKey, string[]> {
  return BEDTIME_TEMPLATES.reduce<Record<BedtimeTemplateKey, string[]>>((acc, template) => {
    acc[template.key] = []
    return acc
  }, {} as Record<BedtimeTemplateKey, string[]>)
}

export default async function BedtimeApprovalPage() {
  const state = await getChoreState()
  const today = getToday()
  const dayLabel = friendlyDate.format(new Date(`${today.todayIso}T12:00:00Z`))

  const defaultSelections = getDefaultSelections()

  for (const chore of state.chores) {
    if (chore.type !== 'one-off' || chore.timeOfDay !== 'morning') continue
    if (chore.kidIds.length !== 1) continue

    const choreDay = chore.scheduledFor ?? pacificDateFromTimestamp(chore.createdAt)
    if (choreDay !== today.todayIso) continue

    const template = BEDTIME_TEMPLATES.find(
      (entry) => entry.title === chore.title && entry.stars === chore.stars,
    )
    if (!template) continue

    const kidId = chore.kidIds[0]
    if (!defaultSelections[template.key].includes(kidId)) {
      defaultSelections[template.key].push(kidId)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Chores · Bedtime approval
            </p>
            <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-slate-50">
              Bedtime approval
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Choose which kids earned their bedtime stars for {dayLabel} (Pacific). We will add
              morning chores for them today so they can claim their stars.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 shadow-inner dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100">
            <span className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Today
            </span>
            <span>{today.todayIso}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-inner dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 md:px-6">
          <p>
            This page creates one-off morning chores for {dayLabel} so Maxie or Minnie can reward
            the kids for bedtime last night.
          </p>
          <p className="mt-1">
            Keep the checkboxes selected to avoid duplicates—the form skips chores that already
            exist for today.
          </p>
        </div>

        <BedtimeApprovalForm
          action={handleBedtimeSubmission}
          dayIso={today.todayIso}
          defaultSelections={defaultSelections}
          kids={state.kids}
        />
      </div>
    </div>
  )
}
