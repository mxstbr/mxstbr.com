import { test } from 'node:test'
import assert from 'node:assert/strict'
import nextEnv from '@next/env'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import z from 'zod/v3'
import { CHORE_EVENT } from './events'

test(
  'real MCP transport reuses parent authentication and rejects unauthenticated kid access',
  { skip: process.env.CHORES_HTTP_TEST !== '1' },
  async () => {
    nextEnv.loadEnvConfig(process.cwd())
    const base = 'http://127.0.0.1:3022'
    const board = await (await fetch(`${base}/api/chores/board`)).json()
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
        name: 'chores-verification',
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
        assert.deepEqual(client.getServerCapabilities()?.events, {
          listChanged: false,
        })
        assert.equal(
          listed.tools.filter((t) => t.name.startsWith('chores_')).length,
          6,
        )
        assert(
          !listed.tools.some(
            (t) =>
              t.name === 'get_chore_board' || t.name.startsWith('chores2_'),
          ),
        )
        const result = await client.callTool({
          name: 'chores_catalog',
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
        if (allowed) {
          const events = await client.request(
            { method: 'events/list' },
            z.object({
              events: z.array(
                z.object({ name: z.string(), delivery: z.array(z.string()) }),
              ),
            }),
          )
          assert.equal(events.events[0].name, CHORE_EVENT)
          assert.deepEqual(events.events[0].delivery, ['webhook'])
        } else {
          await assert.rejects(
            client.request({ method: 'events/list' }, z.object({})),
            (error: { code: number }) => error.code === -32012,
          )
        }
      } finally {
        await client.close()
      }
    }
    const denied = await fetch(`${base}/api/chores/command`, {
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

test(
  'real HTTP MCP Events offers only webhooks',
  { skip: process.env.CHORES_HTTP_TEST !== '1' },
  async () => {
    nextEnv.loadEnvConfig(process.cwd())
    const base = 'http://127.0.0.1:3022'
    const board = await (await fetch(`${base}/api/chores/board`)).json()
    assert.equal(board.serverNow, '2026-09-09T15:00:00.000Z')
    for (const [method, mode] of [
      ['events/poll', 'poll'],
      ['events/stream', 'push'],
    ]) {
      const response = await fetch(`${base}/api/mcp`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CAL_PASSWORD}`,
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params: { name: CHORE_EVENT },
        }),
      })
      assert(response.headers.get('content-type')?.includes('application/json'))
      const value = await response.json()
      assert.equal(value.error.code, -32014)
      assert.deepEqual(value.error.data, {
        feature: 'deliveryMode',
        value: mode,
      })
    }
  },
)
