import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'
import { expect, test } from '@playwright/test'

type McpClient = Awaited<ReturnType<typeof createMCPClient>>
type McpTools = Awaited<ReturnType<McpClient['tools']>>

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3000'
const AUTH_TOKEN = process.env.CLIPPY_AUTOMATION_TOKEN ?? process.env.CAL_PASSWORD

test.describe('MCP server read tools', () => {
  let client: McpClient
  let tools: McpTools

  const ensureStructuredContent = (result: any) => {
    expect(result.isError ?? false).toBe(false)
    const structured = result.structuredContent ?? result.toolResult
    expect(structured).toBeTruthy()
    return structured as Record<string, unknown>
  }

  test.beforeAll(async () => {
    client = await createMCPClient({
      transport: {
        type: 'http',
        url: new URL('/api/mcp', BASE_URL).toString(),
        headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : undefined,
      },
      name: 'mcp-e2e-test-client',
      onUncaughtError: (error) => {
        throw error
      },
    })

    tools = await client.tools()
  })

  test.afterAll(async () => {
    await client?.close()
  })

  test('read-only tools return data without mutations', async () => {
    const callOptions = { toolCallId: 'mcp-e2e', messages: [] }

    const choreBoardResult = await tools.read_chore_board.execute({}, callOptions)
    const choreBoard = ensureStructuredContent(choreBoardResult)
    const chores = (choreBoard.snapshot as any)?.chores ?? choreBoard.chores

    expect(Array.isArray(chores)).toBe(true)
    expect((chores as any[])?.length ?? 0).toBeGreaterThan(0)

    const financeResult = await tools.read_finance_holdings.execute({}, callOptions)
    const financeHoldings = ensureStructuredContent(financeResult)
    const holdings = financeHoldings.holdings

    expect(Array.isArray(holdings)).toBe(true)
    expect((holdings as any[])?.length ?? 0).toBeGreaterThan(0)

    const calendarResult = await tools.read_events.execute({}, callOptions)
    const calendarEvents = ensureStructuredContent(calendarResult)
    const events = calendarEvents.events

    expect(Array.isArray(events)).toBe(true)
    expect((events as any[])?.length ?? 0).toBeGreaterThan(0)
  })
})
