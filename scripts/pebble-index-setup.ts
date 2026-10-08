import nextEnv from '@next/env'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { OWNERS, eventName, secret } from '../app/lib/pebble/config'

nextEnv.loadEnvConfig(process.cwd())
const path = resolve(process.argv[2] ?? '.env.pebble-index-setup.html')
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  )
const field = (label: string, value: string) =>
  `<label>${label}<input readonly value="${escape(value)}" onclick="this.select()"></label>`
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Pebble Index setup — private</title>
<style>body{font:17px/1.55 system-ui;max-width:850px;margin:48px auto;padding:0 24px;color:#17252b;background:#faf9f6}h1{font-size:32px}section{background:white;border:1px solid #ddd;border-radius:12px;padding:24px;margin:24px 0}label{display:block;margin:16px 0;font-weight:600}input{display:block;box-sizing:border-box;width:100%;margin-top:6px;padding:12px;font:14px monospace;border:1px solid #aaa;border-radius:6px}li{margin:8px 0}code{background:#eee;padding:2px 4px}</style>
<h1>Pebble Index → ChatGPT</h1><p>Private setup for Max and Sue. Click a field to select it for copying. Each person uses their own section. Keep this file private; it contains connection credentials.</p>
<p>In the Pebble app: Index 01 → Webhook → choose the gesture → set the URL below → What to send: <b>Both</b> → enable <b>Sign requests</b> → paste the signing secret → Save. Configure both recording gestures if you want both to trigger. No extra headers are needed. Choose Webhook only if you want the gesture routed exclusively here.</p>
${OWNERS.map(
  (owner) => `<section><h2>${owner === 'max' ? 'Max' : 'Sue'}</h2>
${field('Pebble webhook URL', `https://mxstbr.com/api/pebble-index/${owner}`)}
${field('Pebble signing secret', secret(owner, 'webhook'))}
${field('ChatGPT MCP server URL', 'https://mxstbr.com/api/mcp')}
${field('MCP bearer token (recordings for this person only)', secret(owner, 'mcp'))}
${field('Authorization header (for clients using custom headers)', `Bearer ${secret(owner, 'mcp')}`)}
${field('Event to subscribe to', eventName(owner))}
<p>In a ChatGPT Work chat (Cloud on desktop): “Subscribe to ${eventName(owner)}. For each new recording, read the note and follow my instructions for processing it. Confirm setup test events without taking other actions.” Replace the processing instructions with what you want ChatGPT to do.</p></section>`,
).join('')}
<ol><li>Max can keep the existing family MCP connection; refresh its tools and events. The scoped tokens above expose only Pebble recordings, with separate access for each person.</li><li>For a new connection, use ChatGPT Plugins → Add custom MCP server, the MCP URL above and that person's bearer authentication. Refresh the connection and confirm its recording event appears.</li><li>Subscribe before pressing Pebble's Send test event. Verify ChatGPT receives it, then make a real recording. An HTTP success in Pebble confirms storage; ChatGPT delivery still requires an active subscription.</li></ol>
<p>Audio and text remain available for seven days. Event summaries contain up to 4,000 characters; the read tool returns the full text. Original audio is available as a private M4A download, but automatic ChatGPT transcription of an event attachment is not a documented guarantee. Both mode provides Pebble's text as a fallback. Pebble does not automatically retry failed uploads; inspect Recent runs after a failure.</p>
<p>Generated from this checkout's server configuration. Verify against production before using; changing the server root key or per-person overrides invalidates older credentials.</p></html>`
writeFile(path, html, { mode: 0o600, flag: 'wx' })
  .then(() => console.log(`Private setup instructions saved to ${path}`))
  .catch(() => {
    console.error(
      'Could not create the private setup file. Choose a new path if it already exists.',
    )
    process.exitCode = 1
  })
