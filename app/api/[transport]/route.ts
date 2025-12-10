import { getChoreState } from 'app/(os)/chores/data'
import { choreTools } from 'app/lib/chores'
import { createMcpHandler } from 'mcp-handler'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const maxDuration = 60

type ChoreToolName = keyof typeof choreTools

function toTitle(name: string) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
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
        },
        async (args?: unknown) => {
          const result = await tool.execute((args ?? {}) as any)

          return {
            content: [
              {
                type: 'text' as const,
                text: formatChoreMessage(name, result),
              },
            ],
            structuredContent: result,
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
