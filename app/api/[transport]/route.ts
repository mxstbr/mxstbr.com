import { getChoreState } from 'app/chores/data'
import { createMcpHandler } from 'mcp-handler'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'load_chores',
      {
        title: "Loads the kids's chores",
        outputSchema: z.object({
          chores: z.array(
            z.object({
              id: z.string(),
              title: z.string(),
              kids: z.array(z.string()),
              emoji: z.string(),
              stars: z.number(),
              type: z.string(),
              requiresApproval: z.boolean(),
              schedule: z
                .object({
                  cadence: z.string().optional(),
                  daysOfWeek: z.array(z.number()).optional(),
                })
                .optional(),
              pausedUntil: z.string().optional(),
              snoozedUntil: z.string().optional(),
              createdAt: z.string(),
              completedAt: z.string().optional(),
              timeOfDay: z.string().optional(),
            }),
          ),
        }),
        annotations: { readOnlyHint: true },
      },
      async () => {
        const state = await getChoreState()

        return {
          content: [
            {
              type: 'text' as const,
              text: `Here are the kids's chores`,
            },
          ],
          structuredContent: {
            chores: state.chores.map((chore) => ({
              id: chore.id,
              kids: chore.kidIds.map(
                (kidId) => state.kids.find((kid) => kid.id === kidId)?.name,
              ),
              title: chore.title,
              emoji: chore.emoji,
              stars: chore.stars,
              type: chore.type,
              requiresApproval: chore.requiresApproval,
              schedule: chore.schedule,
              pausedUntil: chore.pausedUntil,
              snoozedUntil: chore.snoozedUntil,
              createdAt: chore.createdAt,
              completedAt: chore.completedAt,
              timeOfDay: chore.timeOfDay,
            })),
          },
        }
      },
    )
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
