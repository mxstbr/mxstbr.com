import z from 'zod/v3'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import {
  addHolding,
  deleteHolding,
  getHoldingsData,
  updateHolding,
} from 'app/(os)/finance/holdings-data'
import { withToolErrorHandling } from 'app/lib/mcp/tool-errors'

const isoDateSchema = z
  .string()
  .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, 'Date must be in YYYY-MM-DD format')
  .describe('Date formatted as YYYY-MM-DD')

const holdingSchema = z.object({
  ticker: z.string(),
  shares: z.number(),
  date: isoDateSchema,
})

const holdingsResponseSchema = z.object({
  count: z.number(),
  holdings: z.array(holdingSchema),
})

const mutationResponseSchema = z.object({
  message: z.string(),
  holdings: z.array(holdingSchema),
})

export function registerFinanceTools(server: McpServer) {
  server.registerTool(
    'read_finance_holdings',
    {
      title: 'Read Finance Holdings',
      description: 'Read the current stock holdings shown on the /finance page.',
      inputSchema: z.object({}),
      outputSchema: holdingsResponseSchema,
      annotations: { readOnlyHint: true },
    },
    withToolErrorHandling('read_finance_holdings', async () => {
      const holdings = await getHoldingsData()
      return {
        content: [],
        structuredContent: {
          count: holdings.length,
          holdings,
        },
      }
    }),
  )

  server.registerTool(
    'add_finance_holding',
    {
      title: 'Add Finance Holding',
      description: 'Add a new holding for the /finance portfolio.',
      inputSchema: z.object({
        ticker: z
          .string()
          .min(1, 'Ticker is required')
          .transform((value) => value.toUpperCase()),
        shares: z.number().positive('Shares must be greater than 0'),
        date: isoDateSchema,
      }),
      outputSchema: mutationResponseSchema,
    },
    withToolErrorHandling('add_finance_holding', async ({ ticker, shares, date }) => {
      const holding = { ticker, shares, date }
      await addHolding(holding)

      return {
        content: [],
        structuredContent: {
          message: `Added ${shares} shares of ${ticker} dated ${date}.`,
          holdings: await getHoldingsData(),
        },
      }
    }),
  )

  server.registerTool(
    'update_finance_holding',
    {
      title: 'Update Finance Holding',
      description: 'Update an existing holding by its index in the sorted list.',
      inputSchema: z.object({
        index: z.number().int().min(0, 'Index must be non-negative'),
        ticker: z
          .string()
          .min(1, 'Ticker cannot be empty')
          .transform((value) => value.toUpperCase())
          .optional(),
        shares: z.number().positive('Shares must be greater than 0').optional(),
        date: isoDateSchema.optional(),
      }),
      outputSchema: mutationResponseSchema,
    },
    withToolErrorHandling(
      'update_finance_holding',
      async ({ index, ticker, shares, date }) => {
      const holdings = await getHoldingsData()
      if (index >= holdings.length) {
        throw new Error(
          `No holding found at index ${index}. Valid indices are 0 through ${Math.max(
            holdings.length - 1,
            0,
          )}.`,
        )
      }

      const existing = holdings[index]
      const updated = {
        ticker: ticker ?? existing.ticker,
        shares: shares ?? existing.shares,
        date: date ?? existing.date,
      }

      await updateHolding(index, updated)

      return {
        content: [],
        structuredContent: {
          message: `Updated holding ${index}.`,
          holdings: await getHoldingsData(),
        },
      }
      },
    ),
  )

  server.registerTool(
    'delete_finance_holding',
    {
      title: 'Delete Finance Holding',
      description: 'Delete a holding by its index in the sorted list.',
      inputSchema: z.object({
        index: z.number().int().min(0, 'Index must be non-negative'),
      }),
      outputSchema: mutationResponseSchema,
    },
    withToolErrorHandling('delete_finance_holding', async ({ index }) => {
      const holdings = await getHoldingsData()
      if (index >= holdings.length) {
        throw new Error(
          `No holding found at index ${index}. Valid indices are 0 through ${Math.max(
            holdings.length - 1,
            0,
          )}.`,
        )
      }

      await deleteHolding(index)

      return {
        content: [],
        structuredContent: {
          message: `Deleted holding ${index}.`,
          holdings: await getHoldingsData(),
        },
      }
    }),
  )
}
