'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge, type BadgeProps } from '@openai/apps-sdk-ui/components/Badge'
import { Avatar } from '@openai/apps-sdk-ui/components/Avatar'
import { Button } from '@openai/apps-sdk-ui/components/Button'
import { EmptyMessage } from '@openai/apps-sdk-ui/components/EmptyMessage'
import {
  ArrowRotateCw,
  Calendar,
  Clock,
  Members,
} from '@openai/apps-sdk-ui/components/Icon'
import type { Chore, Kid } from 'app/(os)/chores/data'
import { scheduleLabel } from 'app/(os)/chores/utils'
import { useOpenAiGlobal, useWidgetState } from 'app/(chatgpt)/openai-hooks'

type KidStatus = {
  kid: Kid
  status: 'due' | 'done' | 'closed'
}

type WidgetChore = {
  id: string
  title: string
  emoji: string
  stars: number
  schedule: string
  timeOfDay: string
  requiresApproval: boolean
  kids: KidStatus[]
}

type ChoreBoardSnapshot = {
  ctx?: { todayIso: string }
  kids?: Kid[]
  chores?: Chore[]
  openChoresByKid?: Record<string, Chore[]>
  completedTodayByKid?: Record<
    string,
    { chore: Chore; completionId: string; timestamp: string }[]
  >
}

const timeOfDayLabels: Record<NonNullable<Chore['timeOfDay']>, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
}

export default function TodaysChoresPage() {
  const toolOutput = useOpenAiGlobal<ChoreBoardSnapshot>('toolOutput')
  const toolResponseMetadata = useOpenAiGlobal<any>('toolResponseMetadata')
  const callTool = useOpenAiGlobal<
    ((name: string, args?: Record<string, unknown>) => Promise<unknown>) | null
  >('callTool')

  const [selectedChoreId, setSelectedChoreId] = useWidgetState<string | null>(
    'selectedChoreId',
    null,
  )
  const [refreshing, setRefreshing] = useState(false)

  const todayIso = toolResponseMetadata?.todayIso ?? toolOutput?.ctx?.todayIso

  const chores: WidgetChore[] = useMemo(() => {
    const fromMeta = toolResponseMetadata?.choresToday
    if (Array.isArray(fromMeta)) return fromMeta as WidgetChore[]

    const snapshot = toolOutput
    if (!snapshot?.kids?.length || !snapshot?.chores?.length) return []

    const openByKid = snapshot.openChoresByKid ?? {}
    const doneByKid = snapshot.completedTodayByKid ?? {}
    const kidById = new Map(snapshot.kids.map((kid) => [kid.id, kid]))

    const openChoreIds = new Set<string>()
    for (const chores of Object.values(openByKid)) {
      for (const chore of chores) openChoreIds.add(chore.id)
    }

    const doneChoreIds = new Set<string>()
    for (const entries of Object.values(doneByKid)) {
      for (const entry of entries) doneChoreIds.add(entry.chore.id)
    }

    const relevant = snapshot.chores.filter(
      (chore) => openChoreIds.has(chore.id) || doneChoreIds.has(chore.id),
    )

    return relevant.map((chore) => {
      const kids = chore.kidIds
        .map((kidId) => {
          const kid = kidById.get(kidId)
          if (!kid) return null

          const isOpen = (openByKid[kidId] ?? []).some(
            (entry) => entry.id === chore.id,
          )
          const isDone = (doneByKid[kidId] ?? []).some(
            (entry) => entry.chore.id === chore.id,
          )
          const status: KidStatus['status'] = isDone
            ? 'done'
            : isOpen
              ? 'due'
              : 'closed'
          return { kid, status }
        })
        .filter(Boolean) as KidStatus[]

      const timeOfDay = chore.timeOfDay
        ? timeOfDayLabels[chore.timeOfDay]
        : 'Any time'

      return {
        id: chore.id,
        title: chore.title,
        emoji: chore.emoji,
        stars: chore.stars,
        schedule: scheduleLabel(chore),
        timeOfDay,
        requiresApproval: !!chore.requiresApproval,
        kids,
      }
    })
  }, [toolOutput, toolResponseMetadata])

  const onRefresh = useCallback(async () => {
    if (!callTool || refreshing) return
    setRefreshing(true)
    try {
      await callTool(
        'read_chore_board',
        todayIso ? { day: todayIso } : undefined,
      )
    } finally {
      setRefreshing(false)
    }
  }, [callTool, refreshing, todayIso])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/90 via-white to-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="rounded-3xl border border-default bg-surface px-6 py-5 shadow-xl sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-secondary">Chores</p>
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                Today{todayIso ? ` · ${todayIso}` : ''}
              </h1>
            </div>
            <Button
              variant="outline"
              color="secondary"
              size="md"
              onClick={onRefresh}
              disabled={!callTool || refreshing}
            >
              <ArrowRotateCw className="size-4" />
              Refresh
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-secondary">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-3 py-1">
              <Calendar className="size-3.5" />
              Open chores + completions
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-3 py-1">
              <Members className="size-3.5" />
              Status per kid
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-3 py-1">
              <Clock className="size-3.5" />
              Time of day
            </span>
          </div>
        </header>

        {!toolOutput ? (
          <EmptyMessage className="rounded-3xl border border-default bg-surface px-6 py-10 shadow-xl sm:px-8">
            <EmptyMessage.Icon>🧹</EmptyMessage.Icon>
            <EmptyMessage.Title>No chore board loaded</EmptyMessage.Title>
            <EmptyMessage.Description>
              Ask ChatGPT to run the <code>read_chore_board</code> tool to
              populate today&apos;s chores here.
            </EmptyMessage.Description>
          </EmptyMessage>
        ) : chores.length === 0 ? (
          <EmptyMessage className="rounded-3xl border border-default bg-surface px-6 py-10 shadow-xl sm:px-8">
            <EmptyMessage.Icon>🎉</EmptyMessage.Icon>
            <EmptyMessage.Title>All clear</EmptyMessage.Title>
            <EmptyMessage.Description>
              No open chores found for today.
            </EmptyMessage.Description>
          </EmptyMessage>
        ) : (
          <div className="grid gap-4">
            {chores.map((chore) => (
              <ChoreRow
                key={chore.id}
                chore={chore}
                selected={selectedChoreId === chore.id}
                onSelect={() => setSelectedChoreId(chore.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ChoreRow({
  chore,
  selected,
  onSelect,
}: {
  chore: WidgetChore
  selected: boolean
  onSelect: () => void
}) {
  const dueCount = chore.kids.filter((entry) => entry.status === 'due').length
  const doneCount = chore.kids.filter((entry) => entry.status === 'done').length

  const summaryBadge: { color: BadgeProps['color']; label: string } =
    dueCount > 0
      ? { color: 'info', label: `${dueCount} due` }
      : doneCount > 0
        ? { color: 'success', label: 'Done' }
        : { color: 'secondary', label: 'Not due' }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'group w-full text-left rounded-3xl border bg-surface p-5 shadow-xl transition sm:p-6',
        selected
          ? 'border-slate-400 ring-2 ring-slate-300'
          : 'border-default hover:border-slate-300',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-secondary text-2xl shadow-inner ring-1 ring-slate-200">
          {chore.emoji}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge color="discovery" variant="solid" size="md" pill>
              +{chore.stars} stars
            </Badge>
            <Badge color="info" variant="soft">
              {chore.schedule}
            </Badge>
            <Badge color="secondary" variant="outline">
              {chore.timeOfDay}
            </Badge>
            {chore.requiresApproval ? (
              <Badge color="warning" variant="soft" pill>
                Parent approval needed
              </Badge>
            ) : null}
            <Badge color={summaryBadge.color} variant="soft" pill>
              {summaryBadge.label}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-secondary">Chore</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold leading-tight sm:text-xl">
                {chore.title}
              </h2>
              <Link
                href={`/chores/${encodeURIComponent(chore.id)}`}
                className="text-sm font-semibold text-secondary underline decoration-transparent transition group-hover:decoration-current"
                onClick={(event) => event.stopPropagation()}
              >
                Open card
              </Link>
            </div>
          </div>

          {chore.kids.length ? (
            <ul className="flex flex-wrap gap-2">
              {chore.kids.map(({ kid, status }) => (
                <li
                  key={kid.id}
                  className="flex items-center gap-2 rounded-2xl border border-subtle bg-white/70 px-3 py-2 shadow-sm"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: kid.color }}
                    aria-hidden
                  />
                  <Avatar name={kid.name} size={28} variant="soft" />
                  <span className="text-sm font-semibold">{kid.name}</span>
                  <Badge
                    color={
                      status === 'done'
                        ? 'success'
                        : status === 'due'
                          ? 'info'
                          : 'secondary'
                    }
                    variant="soft"
                    pill
                  >
                    {status === 'done'
                      ? 'Done'
                      : status === 'due'
                        ? 'Due'
                        : 'Closed'}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-secondary">No kids assigned.</p>
          )}
        </div>
      </div>
    </button>
  )
}
