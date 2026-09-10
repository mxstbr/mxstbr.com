import { test } from 'node:test'
import assert from 'node:assert/strict'
import nextEnv from '@next/env'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

test(
  'real MCP transport reuses parent authentication and rejects unauthenticated kid access',
  { skip: process.env.CHORES2_HTTP_TEST !== '1' },
  async () => {
    nextEnv.loadEnvConfig(process.cwd())
    const base = 'http://127.0.0.1:3022'
    const board = await (await fetch(`${base}/api/chores2/board`)).json()
    assert.equal(
      board.serverNow,
      '2026-09-09T15:00:00.000Z',
      'Only run against the development fixture',
    )
    assert(
      process.env.CAL_PASSWORD,
      'Configure the existing MCP credential locally',
    )
    for (const [credential, allowed] of [
      [undefined, false],
      [process.env.CAL_PASSWORD, true],
    ] as const) {
      const client = new Client({
        name: 'chores2-verification',
        version: '1.0.0',
      })
      try {
        await client.connect(
          new StreamableHTTPClientTransport(new URL(`${base}/api/mcp`), {
            requestInit: {
              headers: credential
                ? { Authorization: `Bearer ${credential}` }
                : {},
            },
          }),
        )
        const listed = await client.listTools()
        assert.equal(
          listed.tools.filter((t) => t.name.startsWith('chores2_')).length,
          6,
        )
        assert(listed.tools.some((t) => t.name === 'get_chore_board'))
        const result = await client.callTool({
          name: 'chores2_catalog',
          arguments: {},
        })
        assert.equal(Boolean(result.isError), !allowed)
        const value = (
          result.structuredContent as {
            result: { code?: string; kids?: unknown[] }
          }
        ).result
        if (allowed) assert.equal(value.kids?.length, 3)
        else assert.equal(value.code, 'FORBIDDEN')
      } finally {
        await client.close()
      }
    }
    const denied = await fetch(`${base}/api/chores2/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://another-origin.example',
      },
      body: JSON.stringify({
        requestId: 'forged-request',
        command: { action: 'set_color', kidId: 'kid-3', color: '#ffffff' },
      }),
    })
    assert.equal(denied.status, 403)
  },
)
