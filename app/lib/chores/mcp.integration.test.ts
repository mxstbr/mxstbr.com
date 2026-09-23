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
          assert.deepEqual(events.events[0].delivery, ['poll', 'push'])
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
  'real HTTP MCP Events streams a kid command and replays it after disconnect',
  { skip: process.env.CHORES_HTTP_TEST !== '1', timeout: 30000 },
  async () => {
    nextEnv.loadEnvConfig(process.cwd())
    const base = 'http://127.0.0.1:3022'
    const board = await (await fetch(`${base}/api/chores/board`)).json()
    assert.equal(
      board.serverNow,
      '2026-09-09T15:00:00.000Z',
      'Only run against the development fixture',
    )
    assert(process.env.CAL_PASSWORD)
    const input = { name: CHORE_EVENT, arguments: {} }
    let id = 0
    const rpc = (method: string, params?: unknown, signal?: AbortSignal) =>
      fetch(`${base}/api/mcp`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CAL_PASSWORD}`,
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }),
        signal,
      })
    const start = (await (await rpc('events/poll', input)).json()).result
    assert.deepEqual(start.events, [])
    const cancelled = new AbortController()
    const stream = await rpc(
      'events/stream',
      { ...input, cursor: start.cursor },
      cancelled.signal,
    )
    assert.equal(stream.headers.get('content-type'), 'text/event-stream')
    const reader = stream.body!.getReader(),
      decoder = new TextDecoder()
    let pending = ''
    const next = async () => {
      while (!pending.includes('\n\n')) {
        const value = await reader.read()
        assert(!value.done, 'The stream ended before its expected notification')
        pending += decoder.decode(value.value, { stream: true })
      }
      const end = pending.indexOf('\n\n')
      const frame = JSON.parse(pending.slice(6, end))
      pending = pending.slice(end + 2)
      return frame
    }
    try {
      const active = await next()
      assert.equal(active.method, 'notifications/events/active')
      assert.equal(active.params.cursor, start.cursor)
      const kid = board.kids.find((k: { id: string }) => k.id === 'kid-1')
      assert(kid.chores.length)
      const commandBody = {
        requestId: `events-http-${Date.now()}`,
        command: { action: 'submit', occurrenceId: kid.chores[0].occurrenceId },
      }
      const command = () =>
        fetch(`${base}/api/chores/command`, {
          method: 'POST',
          headers: { Origin: base, 'Content-Type': 'application/json' },
          body: JSON.stringify(commandBody),
        })
      assert.equal((await command()).status, 200)
      assert.equal((await command()).status, 200)
      const delivered = await next()
      assert.equal(delivered.method, 'notifications/events/event')
      assert.equal(delivered.params.name, CHORE_EVENT)
      assert(delivered.params.data.text.includes('Dilan completed'))
      assert.equal(
        delivered.params._meta['io.modelcontextprotocol/subscriptionId'],
        2,
      )
      const heartbeat = await next()
      assert.equal(heartbeat.method, 'notifications/events/heartbeat')
      assert.equal(heartbeat.params.cursor, delivered.params.cursor)
      cancelled.abort()
      const replay = (
        await (
          await rpc('events/poll', { ...input, cursor: start.cursor })
        ).json()
      ).result
      assert.equal(replay.events.length, 1)
      assert.equal(replay.events[0].eventId, delivered.params.eventId)
      assert.equal(replay.events[0].data.text, delivered.params.data.text)
      assert.deepEqual(
        (
          await (
            await rpc('events/poll', {
              ...input,
              cursor: delivered.params.cursor,
            })
          ).json()
        ).result.events,
        [],
      )
    } finally {
      cancelled.abort()
      await reader.cancel().catch(() => {})
    }
  },
)
