import { createHmac } from 'node:crypto'
import { lookup } from 'node:dns/promises'
import { request as httpsRequest } from 'node:https'
import type { ClientRequest } from 'node:http'
import { BlockList, isIP } from 'node:net'
import { invalidParams } from './events'

export type CallbackError =
  | 'connection_refused'
  | 'timeout'
  | 'tls_error'
  | 'http_4xx'
  | 'http_5xx'
  | 'challenge_failed'
export class CallbackFailure extends Error {
  constructor(readonly reason: CallbackError) {
    super(reason)
  }
}
export type CallbackRequest = {
  url: string
  body: string
  headers: Record<string, string>
}
export type CallbackResponse = { status: number; body: string }
export type SendCallback = (
  request: CallbackRequest,
) => Promise<CallbackResponse>

export function callbackUrl(value: string) {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw invalidParams()
  }
  if (
    value.length > 2048 ||
    url.protocol !== 'https:' ||
    !url.hostname ||
    url.username ||
    url.password ||
    url.hash
  )
    throw invalidParams()
  return url
}
export function secretBytes(secret: string) {
  const encoded = secret.slice(6)
  const bytes = Buffer.from(encoded, 'base64')
  if (
    !secret.startsWith('whsec_') ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) ||
    bytes.length < 24 ||
    bytes.length > 64 ||
    (encoded !== bytes.toString('base64') &&
      encoded !== bytes.toString('base64').replace(/=+$/, ''))
  )
    throw invalidParams()
  return bytes
}
export function webhookHeaders(
  id: string,
  messageId: string,
  body: string,
  secrets: string[],
  now: number,
) {
  const timestamp = String(Math.floor(now / 1000))
  return {
    'Content-Type': 'application/json',
    'webhook-id': messageId,
    'webhook-timestamp': timestamp,
    'webhook-signature': secrets
      .map(
        (secret) =>
          `v1,${createHmac('sha256', secretBytes(secret))
            .update(`${messageId}.${timestamp}.${body}`)
            .digest('base64')}`,
      )
      .join(' '),
    'X-MCP-Subscription-Id': id,
  }
}

// Conservatively exclude special-purpose ranges, including IPv4-mapped IPv6,
// NAT64 and 6to4. Only public IPv6 global unicast is eligible.
const blocked4 = new BlockList()
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const)
  blocked4.addSubnet(network, prefix, 'ipv4')
const public6 = new BlockList()
public6.addSubnet('2000::', 3, 'ipv6')
const blocked6 = new BlockList()
for (const [network, prefix] of [
  ['2001::', 23],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['3fff::', 20],
] as const)
  blocked6.addSubnet(network, prefix, 'ipv6')
export function publicAddress(address: string) {
  return isIP(address) === 4
    ? !blocked4.check(address, 'ipv4')
    : isIP(address) === 6 &&
        public6.check(address, 'ipv6') &&
        !blocked6.check(address, 'ipv6')
}
export async function resolveCallback(
  value: string,
  resolve = (hostname: string) => lookup(hostname, { all: true }),
) {
  const url = callbackUrl(value)
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await resolve(hostname)
  if (
    !addresses.length ||
    addresses.some(({ address }) => !publicAddress(address))
  )
    throw new CallbackFailure('connection_refused')
  return { url, address: addresses[0] }
}
function connectionFailure(error: unknown) {
  if (error instanceof CallbackFailure) return error
  const code = (error as NodeJS.ErrnoException)?.code || ''
  return new CallbackFailure(
    /CERT|TLS|SSL|SELF_SIGNED|UNABLE_TO_VERIFY/.test(code)
      ? 'tls_error'
      : 'connection_refused',
  )
}
export function responseFailure(status: number): CallbackError | null {
  return status >= 200 && status < 300
    ? null
    : status >= 500
      ? 'http_5xx'
      : 'http_4xx'
}

// Resolve and validate on EVERY attempt, then pin that exact address. Keeping
// the original URL preserves Host, TLS SNI and certificate hostname validation.
// Native HTTPS follows no redirects and does not use environment HTTP proxies.
export function callbackSender(
  resolveAddress = resolveCallback,
  connect = httpsRequest,
  timeoutMs = 5000,
): SendCallback {
  return (input) =>
    new Promise((resolve, reject) => {
      let request: ClientRequest | undefined
      let settled = false
      const finish = (error?: CallbackFailure, response?: CallbackResponse) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        if (error) reject(error)
        else resolve(response!)
        request?.destroy()
      }
      const timer = setTimeout(
        () => finish(new CallbackFailure('timeout')),
        timeoutMs,
      )
      void resolveAddress(input.url)
        .then(({ url, address }) => {
          if (settled) return
          request = connect(
            url,
            {
              method: 'POST',
              agent: false,
              family: address.family,
              lookup: (_hostname, _options, callback) =>
                callback(null, address.address, address.family),
              headers: {
                ...input.headers,
                'Content-Length': Buffer.byteLength(input.body),
              },
            },
            (response) => {
              const chunks: Buffer[] = []
              let size = 0
              response.on('data', (chunk: Buffer) => {
                size += chunk.length
                // Endpoint bodies are never surfaced to clients. Only the small
                // verification echo is read; an oversized body cannot prove consent.
                if (size > 8192)
                  finish(undefined, {
                    status: response.statusCode || 500,
                    body: '',
                  })
                else chunks.push(chunk)
              })
              response.on('end', () =>
                finish(undefined, {
                  status: response.statusCode || 500,
                  body: Buffer.concat(chunks).toString('utf8'),
                }),
              )
              response.on('error', (error) => finish(connectionFailure(error)))
            },
          )
          request.on('error', (error) => finish(connectionFailure(error)))
          request.end(input.body)
        })
        .catch((error) => finish(connectionFailure(error)))
    })
}
export const sendCallback = callbackSender()
