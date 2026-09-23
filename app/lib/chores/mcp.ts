import z from 'zod/v3'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { after } from 'next/server'
import { inviteDevice, listDevices, parentActor, revokeDevice } from './auth'
import { commandSchema, daySchema } from './commands'
import { choresService, developmentFixture } from './runtime'
import { drainAllNotifications, notificationStatus } from './notifications'
import { ChoresError, fail } from './types'
import { pacificDay } from './time'

async function result(operation: () => Promise<unknown>) {
  try {
    const value = await operation()
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(value) }],
      structuredContent: { result: value },
    }
  } catch (error) {
    const value = {
      status: 'error',
      code: error instanceof ChoresError ? error.code : 'UNAVAILABLE',
      message:
        error instanceof ChoresError
          ? error.message
          : 'Chores is temporarily unavailable. Retry the same request ID.',
    }
    return {
      content: [{ type: 'text' as const, text: value.message }],
      structuredContent: { result: value },
      isError: true,
    }
  }
}
export function registerChoresTools(server: McpServer) {
  // Draft Events capability. The event methods are served by events-http.ts.
  server.server.registerCapabilities({ events: { listChanged: false } })
  server.registerTool(
    'chores_catalog',
    {
      title: 'Chores catalog',
      description:
        'Read the current /chores board: canonical kid/chore/reward IDs, exact balances, explicit routine order, Pacific timeWindows with inclusive opensAt and exclusive closesAt, packing and migration provenance. Before lunch uses the before-lunch group.',
      inputSchema: z.object({}),
    },
    () => result(() => choresService().catalog(parentActor())),
  )
  server.registerTool(
    'chores_inspect_day',
    {
      title: 'Inspect Chores day',
      description:
        'Parent-only history or future schedule inspection, including occurrence snapshots, accepted submission times, approval times, ledger and progress. Does not complete past work.',
      inputSchema: z.object({ day: daySchema.optional() }),
    },
    ({ day }) =>
      result(() =>
        choresService().inspect(parentActor(), day || pacificDay(new Date())),
      ),
  )
  server.registerTool(
    'chores_pending_approvals',
    {
      title: 'Chores pending approvals',
      description:
        'List durable on-time child submissions still awaiting approval, including earlier days. Resolve an exact submission ID here before approving it with chores_command.',
      inputSchema: z.object({}),
    },
    () => result(() => choresService().approvals(parentActor())),
  )
  server.registerTool(
    'chores_command',
    {
      title: 'Change Chores',
      description:
        'Apply a named command to the current /chores board. Resolve IDs first. Supply a unique requestId and reuse it after an uncertain response. submit requires an eligible current occurrence, even for parents. review approves/rejects an exact accepted on-time submission, including after its window/day. undo reverses an exact completion. Configure chores/rewards, pause/resume, adjust stars with a reason, order routines, rename/color kids, and update/reset packing. No skips, backdating, parent UI, or Telegram action buttons. pause_all until and update_chore snoozedUntil/snoozedForKids are exclusive reappear dates; pausedUntil is inclusive. Parent-hidden chores stop counting toward completion targets even after opening. Remaining nonempty completed periods earn +2; hiding awards no chore stars and preserves submissions for late approval or undo.',
      inputSchema: z.object({
        requestId: z.string().min(8).max(100),
        command: commandSchema,
      }),
    },
    ({ requestId, command }) =>
      result(async () => {
        const value = await choresService().execute(
          parentActor(),
          requestId,
          command,
        )
        if (!developmentFixture()) after(() => drainAllNotifications())
        return value
      }),
  )
  server.registerTool(
    'chores_device',
    {
      title: 'Chores device access',
      description:
        'The kid board normally reuses the existing site-password login. Optionally authorize another device with a one-use link, list invitation sessions, or revoke an exact invitation session ID. Revoking an invitation session does not sign out a separate site-password login. Invite links expire in 24 hours; invitation sessions last 90 days and permit kid commands only.',
      inputSchema: z.object({
        action: z.enum(['invite', 'list', 'revoke']),
        label: z.string().min(1).max(80).optional(),
        deviceId: z.string().optional(),
      }),
    },
    (args) =>
      result(async () => {
        const actor = parentActor()
        if (args.action === 'list') return listDevices(actor)
        if (args.action === 'revoke')
          return revokeDevice(actor, args.deviceId || '')
        if (!args.label) fail('INVALID_INPUT', 'Name the device to authorize.')
        const c = await choresService().catalog(actor)
        return inviteDevice(
          actor,
          args.label,
          c.kids.map((k) => k.id),
        )
      }),
  )
  server.registerTool(
    'chores_notification_status',
    {
      title: 'Chores delivery status',
      description:
        'Inspect pending/retrying outbound Telegram notifications. Saved submissions and stars remain authoritative even if delivery fails.',
      inputSchema: z.object({}),
    },
    () =>
      result(async () => {
        parentActor()
        return notificationStatus()
      }),
  )
}
