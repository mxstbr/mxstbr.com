import assert from 'node:assert/strict'
import { test } from 'node:test'
import nextEnv from '@next/env'
import { secret, eventName } from '../pebble/config'

test(
  'real HTTP serves MCP 2.0 tools and scoped events alongside legacy chores',
  { skip: process.env.PEBBLE_HTTP_TEST !== '1' },
  async () => {
    nextEnv.loadEnvConfig(process.cwd())
    const base = 'http://127.0.0.1:3022'
    const fixture = await (await fetch(`${base}/api/chores/board`)).json()
    assert.equal(fixture.serverNow, '2026-09-09T14:15:00.000Z')
    async function rpc(method: string, params = {}, token?: string) {
      const response = await fetch(`${base}/api/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          'MCP-Protocol-Version': '2026-07-28',
          'Mcp-Method': method,
          ...(method === 'tools/call'
            ? { 'Mcp-Name': (params as { name: string }).name }
            : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params: {
            ...params,
            _meta: {
              'io.modelcontextprotocol/protocolVersion': '2026-07-28',
              'io.modelcontextprotocol/clientCapabilities': {},
            },
          },
        }),
      })
      assert.equal(response.headers.get('mcp-session-id'), null)
      return { status: response.status, ...(await response.json()) }
    }
    assert.equal((await rpc('server/discover')).status, 401)
    const family = process.env.CAL_PASSWORD!
    assert(family)
    const discovery = await rpc('server/discover', {}, family)
    assert.equal(discovery.result.resultType, 'complete')
    assert.deepEqual(discovery.result.capabilities.events, {})
    const familyTools = await rpc('tools/list', {}, family)
    assert.equal(
      familyTools.result.tools.filter((t: any) => t.name.startsWith('chores_'))
        .length,
      6,
    )
    assert.equal(
      familyTools.result.tools.filter((t: any) => t.name.startsWith('pebble_'))
        .length,
      2,
    )
    const catalog = await rpc(
      'tools/call',
      { name: 'chores_catalog', arguments: {} },
      family,
    )
    assert.equal(catalog.result.structuredContent.result.kids.length, 3)
    for (const owner of ['max', 'sue'] as const) {
      const token = secret(owner, 'mcp')
      const events = await rpc('events/list', {}, token)
      assert.deepEqual(
        events.result.events.map((e: any) => e.name),
        [eventName(owner)],
      )
      const tools = await rpc('tools/list', {}, token)
      assert.deepEqual(tools.result.tools.map((t: any) => t.name).sort(), [
        'pebble_get_recording',
        'pebble_list_recordings',
      ])
      const denied = await rpc(
        'tools/call',
        {
          name: 'pebble_get_recording',
          arguments: {
            owner: owner === 'max' ? 'sue' : 'max',
            recordingId: `idx_${'a'.repeat(64)}`,
          },
        },
        token,
      )
      assert.equal(denied.result.isError, true)
      const familyDenied = await rpc(
        'tools/call',
        { name: 'chores_catalog', arguments: {} },
        token,
      )
      assert(familyDenied.error || familyDenied.result?.isError)
    }
  },
)
