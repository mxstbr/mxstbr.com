import { choreTools } from 'app/lib/chores'
import { createMcpHandler } from 'mcp-handler'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { scheduleLabel } from 'app/(os)/chores/utils'

const timeOfDayLabels = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
} as const

function siteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

function outputTemplateUrl(pathname: string) {
  return new URL(pathname, siteUrl()).toString()
}

function toChoresTodayMetadata(snapshot: any) {
  if (!snapshot || typeof snapshot !== 'object') return undefined
  if (!Array.isArray(snapshot.kids) || !Array.isArray(snapshot.chores)) return undefined

  const openByKid: Record<string, any[]> = snapshot.openChoresByKid ?? {}
  const doneByKid: Record<string, any[]> = snapshot.completedTodayByKid ?? {}

  const kidById = new Map(
    snapshot.kids
      .filter((kid: any) => kid && typeof kid.id === 'string')
      .map((kid: any) => [kid.id, kid]),
  )

  const openChoreIds = new Set<string>()
  for (const chores of Object.values(openByKid)) {
    for (const chore of chores ?? []) {
      if (chore?.id) openChoreIds.add(chore.id)
    }
  }

  const doneChoreIds = new Set<string>()
  for (const entries of Object.values(doneByKid)) {
    for (const entry of entries ?? []) {
      if (entry?.chore?.id) doneChoreIds.add(entry.chore.id)
    }
  }

  const relevant = snapshot.chores.filter(
    (chore: any) => chore?.id && (openChoreIds.has(chore.id) || doneChoreIds.has(chore.id)),
  )

  const choresToday = relevant.map((chore: any) => {
    const kids = (Array.isArray(chore.kidIds) ? chore.kidIds : [])
      .map((kidId: any) => {
        const kid = kidById.get(kidId)
        if (!kid) return null

        const isOpen = (openByKid[kidId] ?? []).some((entry: any) => entry?.id === chore.id)
        const isDone = (doneByKid[kidId] ?? []).some((entry: any) => entry?.chore?.id === chore.id)
        const status = isDone ? 'done' : isOpen ? 'due' : 'closed'
        return { kid, status }
      })
      .filter(Boolean)

    const timeOfDay =
      chore?.timeOfDay && chore.timeOfDay in timeOfDayLabels
        ? timeOfDayLabels[chore.timeOfDay as keyof typeof timeOfDayLabels]
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

  return {
    todayIso: snapshot?.ctx?.todayIso,
    choresToday,
  }
}

export const maxDuration = 60

type ChoreToolName = keyof typeof choreTools

function toTitle(name: string) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function isAsyncIterable<T>(value: unknown): value is AsyncIterable<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    Symbol.asyncIterator in (value as Record<symbol, unknown>)
  )
}

async function resolveToolResult(output: unknown) {
  if (isAsyncIterable(output)) {
    const items: unknown[] = []
    for await (const item of output) {
      items.push(item)
    }
    return items.length === 1 ? items[0] : items
  }
  return output
}

function toStructuredContent(value: unknown) {
  if (!value || typeof value !== 'object') return undefined
  if (Array.isArray(value)) return undefined
  if (isAsyncIterable(value)) return undefined

  return value as Record<string, unknown>
}

function formatCompletionMessage(result: any) {
  const choreTitle = result?.choreTitle ?? 'chore'
  const kidName = result?.kidName ? ` for ${result.kidName}` : ''
  const awarded =
    typeof result?.awarded === 'number' && result.awarded > 0
      ? ` (+${result.awarded} stars)`
      : ''

  switch (result?.status) {
    case 'completed':
      return `Marked "${choreTitle}"${kidName} complete${awarded}`
    case 'skipped':
      return `Skipped "${choreTitle}"${kidName} (already handled)`
    case 'unauthorized':
      return 'Not authorized to complete this chore'
    default:
      return 'Could not complete chore'
  }
}

function formatUndoMessage(result: any) {
  const choreTitle = result?.choreTitle ?? 'chore'
  const kidName = result?.kidName ? ` for ${result.kidName}` : ''
  const stars =
    typeof result?.delta === 'number' && result.delta !== 0
      ? ` (${Math.abs(result.delta)} stars restored)`
      : ''

  switch (result?.status) {
    case 'undone':
      return `Undid "${choreTitle}"${kidName}${stars}`
    case 'not_found':
      return 'No completion found to undo'
    default:
      return 'Could not undo completion'
  }
}

function formatChoreMessage(name: ChoreToolName, result: any) {
  if (result && typeof result.message === 'string' && result.message.trim()) {
    return result.message
  }

  switch (name) {
    case 'read_chore_board':
      return `Loaded chore board for ${result?.ctx?.todayIso ?? 'today'}`
    case 'complete_chore':
      return formatCompletionMessage(result)
    case 'undo_chore_completion':
      return formatUndoMessage(result)
    case 'redeem_reward':
      return result?.success ? 'Reward redeemed' : 'Could not redeem reward'
    default:
      return `${toTitle(name)} executed`
  }
}

const handler = createMcpHandler(
  (server) => {
    const registerChoreTool = (
      name: ChoreToolName,
      options: { annotations?: { readOnlyHint?: boolean } } = {},
    ) => {
      const tool = choreTools[name]
      if (!tool) return

      server.registerTool(
        name,
        {
          title: toTitle(name),
          description: tool.description,
          inputSchema: tool.inputSchema as any,
          annotations: options.annotations,
          _meta:
            name === 'read_chore_board'
              ? {
                  'openai/outputTemplate': outputTemplateUrl('/chores/today'),
                  'openai/widgetAccessible': true,
                }
              : undefined,
        },
        async (args, extra) => {
          const execute = tool.execute
          if (!execute) {
            throw new Error(`Tool "${name}" is missing an execute function`)
          }

          const rawResult = await execute((args ?? {}) as any, {
            toolCallId: crypto.randomUUID ? crypto.randomUUID() : `${name}-${Date.now()}`,
            messages: [],
            abortSignal: extra.signal,
          })
          const result = await resolveToolResult(rawResult)

          return {
            content: [
              {
                type: 'text' as const,
                text: formatChoreMessage(name, result),
              },
            ],
            structuredContent: toStructuredContent(result),
            _meta: name === 'read_chore_board' ? toChoresTodayMetadata(result) : undefined,
          }
        },
      )
    }

    registerChoreTool('read_chore_board', {
      annotations: { readOnlyHint: true },
    })
    registerChoreTool('create_chore')
    registerChoreTool('complete_chore')
    registerChoreTool('undo_chore_completion')
    registerChoreTool('set_chore_schedule')
    registerChoreTool('pause_chore')
    registerChoreTool('pause_all_chores')
    registerChoreTool('set_chore_assignments')
    registerChoreTool('set_one_off_date')
    registerChoreTool('archive_chore')
    registerChoreTool('rename_kid')
    registerChoreTool('adjust_kid_stars')
    registerChoreTool('add_reward')
    registerChoreTool('set_reward_kids')
    registerChoreTool('archive_reward')
    registerChoreTool('redeem_reward')
  },
  {},
  {
    basePath: '/api', // this needs to match where the [transport] is located.
    maxDuration: 60,
    verboseLogs: true,
  },
)

const routeWithAuth = (req: NextRequest) => {
  if (
    !(new URL(req.url).searchParams.get('pwd') === process.env.CAL_PASSWORD)
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  return handler(req)
}

export { routeWithAuth as GET, routeWithAuth as POST }
