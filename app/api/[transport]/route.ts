import { choreTools } from 'app/lib/chores'
import { createMcpHandler } from 'mcp-handler'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

type ChoreToolName = keyof typeof choreTools

function toTitle(name: string) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

const handler = createMcpHandler(
  (server) => {
    const registerChoreTool = (
      name: ChoreToolName,
      options: { annotations?: { readOnlyHint?: boolean } } = {},
    ) => {
      const tool = choreTools[name]
      if (!tool) return

      // Extract tool registration metadata if present
      const toolMeta = (tool as any)._meta

      server.registerTool(
        name,
        {
          title: toTitle(name),
          description: tool.description,
          inputSchema: tool.inputSchema as any,
          annotations: options.annotations,
          _meta: toolMeta,
        },
        async (args: any, extra: any) => {
          const execute = tool.execute
          if (!execute) {
            throw new Error(`Tool "${name}" is missing an execute function`)
          }

          // Pass mcp: true to get MCP-style response from tool wrapper
          const result = await execute(args, {
            mcp: true,
            toolCallId:
              (extra.toolCallId ?? crypto.randomUUID)
                ? crypto.randomUUID()
                : `${name}-${Date.now()}`,
            messages: extra.messages ?? [],
            abortSignal: extra.signal,
          } as any)

          // The tool wrapper already returns MCP-style response, so return it directly
          return result as unknown as {
            content: Array<{ type: 'text'; text: string }>
            structuredContent: Record<string, unknown> | undefined
            _meta?: Record<string, unknown>
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
    process.env.NODE_ENV !== 'development' &&
    !(new URL(req.url).searchParams.get('pwd') === process.env.CAL_PASSWORD)
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  return handler(req)
}

export { routeWithAuth as GET, routeWithAuth as POST }
