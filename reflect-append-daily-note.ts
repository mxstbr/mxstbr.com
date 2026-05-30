import env from '@next/env'
import { promises as fs } from 'fs'

const projectDir = process.cwd()
env.loadEnvConfig(projectDir)

const DEFAULT_TIME_ZONE = 'America/Los_Angeles'
const DEFAULT_LIST_NAME = 'Pebble Index'
const REFLECT_API_BASE_URL = 'https://reflect.app/api'

type Args = Map<string, string | boolean>

function parseArgs(argv: string[]) {
  const args: Args = new Map()

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (!arg.startsWith('--')) continue

    const [rawKey, inlineValue] = arg.slice(2).split('=', 2)
    if (inlineValue !== undefined) {
      args.set(rawKey, inlineValue)
      continue
    }

    const next = argv[index + 1]
    if (next && !next.startsWith('--')) {
      args.set(rawKey, next)
      index++
    } else {
      args.set(rawKey, true)
    }
  }

  return args
}

function getStringArg(args: Args, key: string) {
  const value = args.get(key)
  return typeof value === 'string' ? value : undefined
}

function getRequiredEnv(name: string, fallbackName?: string) {
  const value = process.env[name]?.trim()
  if (value) return value

  if (fallbackName) {
    const fallbackValue = process.env[fallbackName]?.trim()
    if (fallbackValue) return fallbackValue
  }

  throw new Error(
    `Missing ${name}${fallbackName ? ` or ${fallbackName}` : ''} in the environment`,
  )
}

async function readStdin() {
  if (process.stdin.isTTY) return ''

  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return Buffer.concat(chunks).toString('utf8')
}

async function readContent(args: Args) {
  const content = getStringArg(args, 'content')
  if (content) return content

  const filePath = getStringArg(args, 'file')
  if (filePath) return fs.readFile(filePath, 'utf8')

  return readStdin()
}

function getDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  return Object.fromEntries(parts.map((part) => [part.type, part.value]))
}

function getDailyNoteDate(date: Date, timeZone: string) {
  const parts = getDateParts(date, timeZone)
  return `${parts.year}-${parts.month}-${parts.day}`
}

async function appendToDailyNote({
  accessToken,
  date,
  graphId,
  listName,
  text,
}: {
  accessToken: string
  date: string
  graphId: string
  listName: string
  text: string
}) {
  const response = await fetch(
    `${REFLECT_API_BASE_URL}/graphs/${encodeURIComponent(graphId)}/daily-notes`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date,
        text,
        transform_type: 'list-append',
        list_name: listName,
      }),
    },
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `Reflect API returned ${response.status}: ${body || response.statusText}`,
    )
  }

  return response.json()
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const content = (await readContent(args)).trim()

  if (!content) {
    throw new Error('Provide note text with --content, --file, or stdin')
  }

  const timeZone =
    getStringArg(args, 'timezone') ??
    process.env.REFLECT_TIME_ZONE?.trim() ??
    DEFAULT_TIME_ZONE
  const now = new Date()
  const date = getStringArg(args, 'date') ?? getDailyNoteDate(now, timeZone)
  const graphId =
    getStringArg(args, 'graph-id') ?? getRequiredEnv('REFLECT_GRAPH_ID')
  const listName =
    getStringArg(args, 'list-name') ??
    process.env.REFLECT_DAILY_NOTE_LIST_NAME?.trim() ??
    DEFAULT_LIST_NAME

  if (args.has('dry-run')) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun: true,
          date,
          graphId,
          listName,
          text: content,
        },
        null,
        2,
      ),
    )
    return
  }

  const accessToken = getRequiredEnv(
    'REFLECT_ACCESS_TOKEN',
    'REFLECT_API_TOKEN',
  )
  const result = await appendToDailyNote({
    accessToken,
    date,
    graphId,
    listName,
    text: content,
  })

  console.log(
    JSON.stringify(
      {
        ok: true,
        date,
        graphId,
        listName,
        result,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
