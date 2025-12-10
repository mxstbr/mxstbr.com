import type React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Badge, type BadgeProps } from '@openai/apps-sdk-ui/components/Badge'
import { Avatar } from '@openai/apps-sdk-ui/components/Avatar'
import { EmptyMessage } from '@openai/apps-sdk-ui/components/EmptyMessage'
import {
  Calendar,
  Category,
  CheckCircle,
  Clock,
  Members,
  Shield,
  Star,
} from '@openai/apps-sdk-ui/components/Icon'
import { type Chore, getChoreState } from 'app/(os)/chores/data'
import {
  getToday,
  hasCompletedTodayForKid,
  isOpenForKid,
  recurringStatus,
  scheduleLabel,
} from 'app/(os)/chores/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Chore card',
  description: 'Single chore view for the ChatGPT app.',
}

type PageProps = {
  params: Promise<{ choreId: string }>
  searchParams?: Promise<{ day?: string }>
}

const timeOfDayLabels: Record<NonNullable<Chore['timeOfDay']>, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
}

export default async function ChoreCardPage({ params, searchParams }: PageProps) {
  const { choreId } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const ctx = getToday(resolvedSearchParams?.day)
  const state = await getChoreState()
  const chore = state.chores.find((entry) => entry.id === choreId)

  if (!chore) {
    notFound()
  }

  const assignedKids = state.kids.filter((kid) => chore.kidIds.includes(kid.id))
  const kidStatuses = assignedKids.map((kid) => {
    const openToday = isOpenForKid(chore, kid.id, state.completions, ctx)
    const doneToday = hasCompletedTodayForKid(chore.id, kid.id, state.completions, ctx)
    const status = recurringStatus(chore, kid.id, state.completions, ctx)
    return { kid, openToday, doneToday, status }
  })

  const timeOfDayLabel = chore.timeOfDay ? timeOfDayLabels[chore.timeOfDay] : 'Any time'
  const createdOn = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
    new Date(chore.createdAt),
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/90 via-white to-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-3xl border border-default bg-surface p-6 shadow-xl sm:p-8">
          <header className="flex flex-wrap items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-secondary text-3xl shadow-inner ring-1 ring-slate-200">
              {chore.emoji}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge color="discovery" variant="solid" size="md" pill>
                  +{chore.stars} stars
                </Badge>
                <Badge color="info" variant="soft">
                  {scheduleLabel(chore)}
                </Badge>
                <Badge color="secondary" variant="outline">
                  {timeOfDayLabel}
                </Badge>
                {chore.requiresApproval ? (
                  <Badge color="warning" variant="soft" pill>
                    Parent approval needed
                  </Badge>
                ) : null}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-secondary">Chore</p>
                <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                  {chore.title}
                </h1>
              </div>
            </div>
          </header>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6">
            <section className="rounded-2xl border border-subtle bg-surface-secondary p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
                <Members className="size-4" />
                Assigned kids
              </div>
              {kidStatuses.length === 0 ? (
                <EmptyMessage className="mt-4">
                  <EmptyMessage.Icon>🤷‍♀️</EmptyMessage.Icon>
                  <EmptyMessage.Title>No kids linked</EmptyMessage.Title>
                  <EmptyMessage.Description>
                    This chore is not assigned to anyone yet.
                  </EmptyMessage.Description>
                </EmptyMessage>
              ) : (
                <ul className="mt-4 space-y-3">
                  {kidStatuses.map(({ kid, openToday, doneToday, status }) => {
                    const badgeColor: BadgeProps['color'] =
                      doneToday ? 'success' : openToday ? 'info' : status.tone === 'muted' ? 'secondary' : 'discovery'
                    const label = doneToday ? 'Done today' : openToday ? 'Due today' : status.label
                    return (
                      <li
                        key={kid.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-subtle bg-white/70 px-3 py-2 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: kid.color }}
                            aria-hidden
                          />
                          <Avatar name={kid.name} size={36} variant="soft" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold leading-tight">{kid.name}</p>
                            <p className="text-xs text-secondary">
                              {status.tone === 'muted' ? 'Resting' : 'Active'}
                            </p>
                          </div>
                        </div>
                        <Badge color={badgeColor} variant="soft" pill>
                          {label}
                        </Badge>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-subtle bg-surface-secondary p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
                <CheckCircle className="size-4" />
                Details
              </div>
              <DetailRow icon={<Star className="size-4" />} label="Stars">
                +{chore.stars} for each kid
              </DetailRow>
              <DetailRow icon={<Category className="size-4" />} label="Type">
                {chore.type === 'perpetual'
                  ? 'Perpetual'
                  : chore.type === 'one-off'
                    ? 'One-off'
                    : 'Repeated'}
              </DetailRow>
              <DetailRow icon={<Calendar className="size-4" />} label="Schedule">
                {scheduleLabel(chore)}
              </DetailRow>
              <DetailRow icon={<Clock className="size-4" />} label="Time of day">
                {timeOfDayLabel}
              </DetailRow>
              <DetailRow icon={<Shield className="size-4" />} label="Approval">
                {chore.requiresApproval ? 'Requires parent approval' : 'No approval needed'}
              </DetailRow>
              <DetailRow icon={<Calendar className="size-4" />} label="Created">
                {createdOn}
              </DetailRow>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-secondary">{icon}</span>
        <span className="text-sm font-semibold text-secondary">{label}</span>
      </div>
      <div className="text-sm font-semibold text-default text-right">{children}</div>
    </div>
  )
}
