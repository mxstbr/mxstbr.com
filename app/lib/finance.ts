import { tool } from 'ai'
import z from 'zod/v3'

import {
  addHolding,
  deleteHolding,
  getHoldingsData,
  updateHolding,
} from 'app/(os)/finance/holdings-data'

const isoDateSchema = z
  .string()
  .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
  .describe('Date formatted as YYYY-MM-DD')

export const financeTools = {
  read_finance_holdings: tool({
    description: 'Read the current stock holdings shown on the /finance page.',
    inputSchema: z.object({}),
    execute: async () => {
      const holdings = await getHoldingsData()

      return {
        count: holdings.length,
        holdings,
      }
    },
  }),

  add_finance_holding: tool({
    description: 'Add a new holding for the /finance portfolio.',
    inputSchema: z.object({
      ticker: z
        .string()
        .min(1, 'Ticker is required')
        .transform((value) => value.toUpperCase()),
      shares: z.number().positive('Shares must be greater than 0'),
      date: isoDateSchema,
    }),
    execute: async ({ ticker, shares, date }) => {
      const holding = { ticker, shares, date }
      await addHolding(holding)

      return {
        message: `Added ${shares} shares of ${ticker} dated ${date}.`,
        holdings: await getHoldingsData(),
      }
    },
  }),

  update_finance_holding: tool({
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
    execute: async ({ index, ticker, shares, date }) => {
      const holdings = await getHoldingsData()
      if (index >= holdings.length) {
        throw new Error(`No holding found at index ${index}`)
      }

      const existing = holdings[index]
      const updated = {
        ticker: ticker ?? existing.ticker,
        shares: shares ?? existing.shares,
        date: date ?? existing.date,
      }

      await updateHolding(index, updated)

      return {
        message: `Updated holding ${index}.`,
        holdings: await getHoldingsData(),
      }
    },
  }),

  delete_finance_holding: tool({
    description: 'Delete a holding by its index in the sorted list.',
    inputSchema: z.object({
      index: z.number().int().min(0, 'Index must be non-negative'),
    }),
    execute: async ({ index }) => {
      const holdings = await getHoldingsData()
      if (index >= holdings.length) {
        throw new Error(`No holding found at index ${index}`)
      }

      await deleteHolding(index)

      return {
        message: `Deleted holding ${index}.`,
        holdings: await getHoldingsData(),
      }
    },
  }),
}
